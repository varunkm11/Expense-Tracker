import { Response } from 'express';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { Budget } from '../models/Budget';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from 'date-fns';

const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string(),
  subcategory: z.string().optional(),
  description: z.string().min(1),
  date: z.string().optional(),
  splitWith: z.array(z.string()).optional(),
  paidBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().positive(),
    endDate: z.string().optional()
  }).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string()
  }).optional()
});

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = expenseSchema.parse(req.body);
    const userId = req.user!._id;

    const expense = new Expense({
      ...validatedData,
      userId,
      date: validatedData.date ? new Date(validatedData.date) : new Date(),
      splitWith: validatedData.splitWith || [],
      paidBy: validatedData.paidBy || 'You',
      tags: validatedData.tags || []
    });

    await expense.save();

    // Update budget if exists
    await updateBudgetSpent(userId, validatedData.category, validatedData.amount);

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { 
      page = 1, 
      limit = 20, 
      category, 
      startDate, 
      endDate, 
      tags,
      search 
    } = req.query;

    // Base query to include expenses owned by user OR where user is in splitWith array
    const baseQuery: any = {
      $or: [
        { userId },
        { splitWith: userId }
      ]
    };

    const query: any = { ...baseQuery };

    if (category) query.category = category;
    if (tags) query.tags = { $in: (tags as string).split(',') };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    if (search) {
      // Combine the search criteria with the base query using $and
      query.$and = [
        baseQuery,
        {
          $or: [
            { description: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      // Remove the base $or since it's now in $and
      delete query.$or;
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      data: expenses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    
    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const validatedData = expenseSchema.partial().parse(req.body);
    
    // Calculate difference for budget update
    const oldAmount = expense.amount;
    const oldCategory = expense.category;
    
    Object.assign(expense, validatedData);
    if (validatedData.date) expense.date = new Date(validatedData.date);
    
    await expense.save();

    // Update budgets
    if (oldCategory === validatedData.category) {
      // Same category, adjust by difference
      const difference = (validatedData.amount || oldAmount) - oldAmount;
      if (difference !== 0) {
        await updateBudgetSpent(userId, oldCategory, difference);
      }
    } else {
      // Different category, subtract from old and add to new
      await updateBudgetSpent(userId, oldCategory, -oldAmount);
      if (validatedData.category && validatedData.amount) {
        await updateBudgetSpent(userId, validatedData.category, validatedData.amount);
      }
    }

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    
    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await Expense.findByIdAndDelete(id);
    
    // Update budget
    await updateBudgetSpent(userId, expense.category, -expense.amount);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getExpenseAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { period = 'month' } = req.query;
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = now;
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default: // month
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    // Category-wise expenses
    const categoryExpenses = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Daily expenses for trend
    const dailyExpenses = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Total expenses
    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      }
    ]);

    // Previous period comparison
    const previousStartDate = period === 'month' 
      ? startOfMonth(subMonths(now, 1))
      : new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    
    const previousTotal = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: previousStartDate, $lt: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      period,
      dateRange: { startDate, endDate },
      categoryExpenses,
      dailyExpenses,
      summary: {
        total: totalExpenses[0]?.total || 0,
        count: totalExpenses[0]?.count || 0,
        average: totalExpenses[0]?.average || 0,
        previousTotal: previousTotal[0]?.total || 0,
        change: previousTotal[0]?.total 
          ? ((totalExpenses[0]?.total || 0) - previousTotal[0].total) / previousTotal[0].total * 100
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to update budget spent amount
async function updateBudgetSpent(userId: any, category: string, amount: number) {
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);

  await Budget.updateMany(
    {
      userId,
      $or: [
        { category },
        { category: 'Total' }
      ],
      startDate: { $lte: now },
      endDate: { $gte: now }
    },
    {
      $inc: { spent: amount }
    }
  );
}
