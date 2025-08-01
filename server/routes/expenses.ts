import { Response } from 'express';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { Budget } from '../models/Budget';
import { AuthRequest } from '../middleware/auth';
import { BalanceManager } from '../utils/BalanceManager';
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
  }).optional(),
  splitDetails: z.object({
    totalParticipants: z.number().min(1),
    amountPerPerson: z.number().min(0),
    payments: z.array(z.object({
      participant: z.string(),
      amount: z.number().min(0), // Custom amount for each participant
      isPaid: z.boolean().default(false),
      paidAt: z.string().optional(),
      notes: z.string().optional()
    }))
  }).optional(),
  nonRoommateNotes: z.array(z.object({
    person: z.string(),
    amount: z.number().min(0),
    description: z.string(),
    isPaid: z.boolean().default(false),
    paidAt: z.string().optional()
  })).optional()
});

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = expenseSchema.parse(req.body);
    const userId = req.user!._id;

    // Calculate split details if splitWith is provided
    let splitDetails = validatedData.splitDetails;
    if (validatedData.splitWith && validatedData.splitWith.length > 0 && !splitDetails) {
      const totalParticipants = validatedData.splitWith.length + 1; // +1 for the payer
      const amountPerPerson = validatedData.amount / totalParticipants;
      
      splitDetails = {
        totalParticipants,
        amountPerPerson,
        payments: validatedData.splitWith.map(participant => ({
          participant,
          amount: amountPerPerson, // Default to equal split
          isPaid: false,
          notes: ''
        }))
      };
    }

    const expense = new Expense({
      ...validatedData,
      userId,
      date: validatedData.date ? new Date(validatedData.date) : new Date(),
      splitWith: validatedData.splitWith || [],
      paidBy: validatedData.paidBy || 'You',
      tags: validatedData.tags || [],
      splitDetails,
      nonRoommateNotes: validatedData.nonRoommateNotes || []
    });

    await expense.save();

    // Update balances if this is a split expense
    if (splitDetails && splitDetails.payments.length > 0) {
      const payerUser = req.user!;
      const splitDetailsForBalance = splitDetails.payments.map(payment => ({
        email: payment.participant, // This should be email, not name
        amount: payment.amount
      }));

      // Update balance system
      await BalanceManager.updateBalancesForSplitExpense(
        payerUser.email,
        splitDetailsForBalance
      );
    }

    // Create linked expenses for each participant so they can see split expenses on their dashboard
    if (splitDetails && splitDetails.payments.length > 0) {
      for (const payment of splitDetails.payments) {
        // Find the user by their name (roommate name)
        const participantUser = await import('../models/User').then(({ User }) => 
          User.findOne({ 
            $or: [
              { name: payment.participant },
              { roommates: { $in: [payment.participant] } }
            ]
          })
        );

        if (participantUser) {
          // Create a linked expense for the participant
          const linkedExpense = new Expense({
            userId: participantUser._id,
            amount: payment.amount,
            category: validatedData.category,
            description: `${validatedData.description} (Split from ${validatedData.paidBy})`,
            date: validatedData.date ? new Date(validatedData.date) : new Date(),
            splitWith: [],
            paidBy: validatedData.paidBy || 'You',
            tags: [...(validatedData.tags || []), 'split-expense'],
            isLinkedExpense: true,
            originalExpenseId: expense._id,
            splitDetails: {
              totalParticipants: 1,
              amountPerPerson: payment.amount,
              payments: [{
                participant: payment.participant,
                amount: payment.amount,
                isPaid: payment.isPaid,
                notes: payment.notes || ''
              }]
            }
          });
          
          await linkedExpense.save();
        }
      }
    }

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

export const markSplitPaymentPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { expenseId, participant } = req.params;
    const { notes } = req.body;
    const userId = req.user!._id;

    const expense = await Expense.findOne({ 
      _id: expenseId, 
      $or: [{ userId }, { splitWith: userId }] 
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (!expense.splitDetails) {
      return res.status(400).json({ error: 'This expense is not split' });
    }

    const paymentIndex = expense.splitDetails.payments.findIndex(p => p.participant === participant);
    if (paymentIndex === -1) {
      return res.status(404).json({ error: 'Participant not found in split' });
    }

    expense.splitDetails.payments[paymentIndex].isPaid = true;
    expense.splitDetails.payments[paymentIndex].paidAt = new Date();
    if (notes) {
      expense.splitDetails.payments[paymentIndex].notes = notes;
    }

    await expense.save();

    res.json({
      message: 'Split payment marked as paid',
      expense
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markNonRoommatePaymentPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { expenseId, noteIndex } = req.params;
    const userId = req.user!._id;

    const expense = await Expense.findOne({ _id: expenseId, userId });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (!expense.nonRoommateNotes || !expense.nonRoommateNotes[parseInt(noteIndex)]) {
      return res.status(404).json({ error: 'Note not found' });
    }

    expense.nonRoommateNotes[parseInt(noteIndex)].isPaid = true;
    expense.nonRoommateNotes[parseInt(noteIndex)].paidAt = new Date();

    await expense.save();

    res.json({
      message: 'Non-roommate payment marked as paid',
      expense
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
