import { Response } from 'express';
import { Budget } from '../models/Budget';
import { Expense } from '../models/Expense';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { startOfMonth, endOfMonth, addMonths, startOfWeek, endOfWeek, addWeeks, startOfYear, endOfYear, addYears } from 'date-fns';

const budgetSchema = z.object({
  category: z.string(),
  limit: z.number().positive(),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  startDate: z.string().optional(),
  notifications: z.object({
    at50Percent: z.boolean().optional(),
    at80Percent: z.boolean().optional(),
    atLimit: z.boolean().optional()
  }).optional()
});

export const createBudget = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = budgetSchema.parse(req.body);
    const userId = req.user!._id;

    // Calculate start and end dates based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (validatedData.startDate) {
      startDate = new Date(validatedData.startDate);
    } else {
      startDate = now;
    }

    switch (validatedData.period) {
      case 'weekly':
        startDate = startOfWeek(startDate);
        endDate = endOfWeek(startDate);
        break;
      case 'yearly':
        startDate = startOfYear(startDate);
        endDate = endOfYear(startDate);
        break;
      default: // monthly
        startDate = startOfMonth(startDate);
        endDate = endOfMonth(startDate);
    }

    // Calculate current spent amount
    const spent = await calculateSpentAmount(userId, validatedData.category, startDate, endDate);

    const budget = new Budget({
      ...validatedData,
      userId,
      startDate,
      endDate,
      spent,
      notifications: {
        at50Percent: true,
        at80Percent: true,
        atLimit: true,
        ...validatedData.notifications
      }
    });

    await budget.save();

    res.status(201).json({
      message: 'Budget created successfully',
      budget
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBudgets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { period, active = 'true' } = req.query;

    const query: any = { userId };
    
    if (period) query.period = period;
    
    if (active === 'true') {
      const now = new Date();
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    }

    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    // Calculate progress and status for each budget
    const budgetsWithProgress = budgets.map(budget => {
      const progress = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
      let status = 'safe';
      
      if (progress >= 100) status = 'exceeded';
      else if (progress >= 80) status = 'warning';
      else if (progress >= 50) status = 'caution';

      return {
        ...budget.toObject(),
        progress,
        status,
        remaining: Math.max(0, budget.limit - budget.spent)
      };
    });

    res.json({ budgets: budgetsWithProgress });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    
    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const validatedData = budgetSchema.partial().parse(req.body);
    
    Object.assign(budget, validatedData);
    
    // Recalculate dates if period changed
    if (validatedData.period) {
      const startDate = budget.startDate;
      let endDate: Date;

      switch (validatedData.period) {
        case 'weekly':
          endDate = endOfWeek(startDate);
          break;
        case 'yearly':
          endDate = endOfYear(startDate);
          break;
        default: // monthly
          endDate = endOfMonth(startDate);
      }

      budget.endDate = endDate;
    }

    // Recalculate spent amount
    budget.spent = await calculateSpentAmount(userId, budget.category, budget.startDate, budget.endDate);
    
    await budget.save();

    res.json({
      message: 'Budget updated successfully',
      budget
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    
    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await Budget.findByIdAndDelete(id);

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBudgetAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const now = new Date();
    
    // Get all active budgets
    const activeBudgets = await Budget.find({
      userId,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    // Calculate analytics
    const analytics = {
      totalBudgets: activeBudgets.length,
      totalBudgetAmount: activeBudgets.reduce((sum, b) => sum + b.limit, 0),
      totalSpent: activeBudgets.reduce((sum, b) => sum + b.spent, 0),
      budgetsExceeded: activeBudgets.filter(b => b.spent > b.limit).length,
      budgetsAtRisk: activeBudgets.filter(b => b.spent / b.limit > 0.8 && b.spent <= b.limit).length,
      averageUtilization: activeBudgets.length > 0 
        ? activeBudgets.reduce((sum, b) => sum + (b.spent / b.limit), 0) / activeBudgets.length * 100
        : 0
    };

    res.json({
      analytics,
      budgets: activeBudgets.map(budget => ({
        ...budget.toObject(),
        progress: budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0,
        remaining: Math.max(0, budget.limit - budget.spent)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to calculate spent amount for a category and period
async function calculateSpentAmount(userId: any, category: string, startDate: Date, endDate: Date): Promise<number> {
  const query: any = {
    userId,
    date: { $gte: startDate, $lte: endDate }
  };

  if (category !== 'Total') {
    query.category = category;
  }

  const result = await Expense.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return result[0]?.total || 0;
}
