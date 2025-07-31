import { Response } from 'express';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { AuthRequest } from '../middleware/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

interface Budget503020Response {
  totalIncome: number;
  needs: {
    budgetAmount: number;
    spentAmount: number;
    percentage: number;
    status: 'safe' | 'warning' | 'exceeded';
    categories: Array<{ category: string; amount: number }>;
  };
  wants: {
    budgetAmount: number;
    spentAmount: number;
    percentage: number;
    status: 'safe' | 'warning' | 'exceeded';
    categories: Array<{ category: string; amount: number }>;
  };
  savings: {
    budgetAmount: number;
    actualSavings: number;
    percentage: number;
    status: 'safe' | 'warning' | 'exceeded';
  };
  recommendations: string[];
}

// Categories mapping for 50/30/20 rule
const NEEDS_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Utilities',
  'Healthcare',
  'Insurance',
  'Housing',
  'Groceries'
];

const WANTS_CATEGORIES = [
  'Entertainment',
  'Shopping',
  'Travel',
  'Hobbies',
  'Dining Out',
  'Subscriptions',
  'Personal Care',
  'Gifts'
];

export const getBudget503020 = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { month, year } = req.query;
    
    const targetDate = new Date(
      Number(year) || new Date().getFullYear(), 
      Number(month) || new Date().getMonth(), 
      1
    );
    const startDate = startOfMonth(targetDate);
    const endDate = endOfMonth(targetDate);

    // Get total income for the month
    const incomes = await Income.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

    // Get all expenses for the month (including split expenses)
    const expenses = await Expense.find({
      $or: [{ userId }, { splitWith: userId }],
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate category totals
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });

    // Calculate needs spending
    const needsSpending = NEEDS_CATEGORIES.reduce((sum, category) => {
      return sum + (categoryTotals[category] || 0);
    }, 0);

    // Calculate wants spending
    const wantsSpending = WANTS_CATEGORIES.reduce((sum, category) => {
      return sum + (categoryTotals[category] || 0);
    }, 0);

    // Calculate budget amounts (50/30/20 rule)
    const needsBudget = totalIncome * 0.5;
    const wantsBudget = totalIncome * 0.3;
    const savingsBudget = totalIncome * 0.2;

    // Calculate actual savings (income - total expenses)
    const totalExpenses = needsSpending + wantsSpending;
    const actualSavings = totalIncome - totalExpenses;

    // Determine status for each category
    const getNeedsStatus = (): 'safe' | 'warning' | 'exceeded' => {
      const percentage = (needsSpending / needsBudget) * 100;
      if (percentage <= 80) return 'safe';
      if (percentage <= 100) return 'warning';
      return 'exceeded';
    };

    const getWantsStatus = (): 'safe' | 'warning' | 'exceeded' => {
      const percentage = (wantsSpending / wantsBudget) * 100;
      if (percentage <= 80) return 'safe';
      if (percentage <= 100) return 'warning';
      return 'exceeded';
    };

    const getSavingsStatus = (): 'safe' | 'warning' | 'exceeded' => {
      const percentage = (actualSavings / savingsBudget) * 100;
      if (percentage >= 100) return 'safe';
      if (percentage >= 70) return 'warning';
      return 'exceeded';
    };

    // Generate category breakdowns
    const needsCategories = NEEDS_CATEGORIES
      .filter(category => categoryTotals[category] > 0)
      .map(category => ({
        category,
        amount: categoryTotals[category]
      }))
      .sort((a, b) => b.amount - a.amount);

    const wantsCategories = WANTS_CATEGORIES
      .filter(category => categoryTotals[category] > 0)
      .map(category => ({
        category,
        amount: categoryTotals[category]
      }))
      .sort((a, b) => b.amount - a.amount);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (needsSpending > needsBudget) {
      recommendations.push(`Your essential expenses are ₹${(needsSpending - needsBudget).toLocaleString()} over budget. Consider reviewing your necessary expenses.`);
    }
    
    if (wantsSpending > wantsBudget) {
      recommendations.push(`Your discretionary spending is ₹${(wantsSpending - wantsBudget).toLocaleString()} over budget. Try reducing entertainment and shopping expenses.`);
    }
    
    if (actualSavings < savingsBudget) {
      recommendations.push(`You're saving ₹${(savingsBudget - actualSavings).toLocaleString()} less than recommended. Aim to save 20% of your income.`);
    }
    
    if (actualSavings >= savingsBudget && needsSpending <= needsBudget && wantsSpending <= wantsBudget) {
      recommendations.push('Excellent! You\'re following the 50/30/20 rule perfectly. Keep up the great work!');
    }

    if (totalIncome === 0) {
      recommendations.push('Add your income sources to get accurate budget analysis.');
    }

    const response: Budget503020Response = {
      totalIncome,
      needs: {
        budgetAmount: needsBudget,
        spentAmount: needsSpending,
        percentage: totalIncome > 0 ? (needsSpending / totalIncome) * 100 : 0,
        status: getNeedsStatus(),
        categories: needsCategories
      },
      wants: {
        budgetAmount: wantsBudget,
        spentAmount: wantsSpending,
        percentage: totalIncome > 0 ? (wantsSpending / totalIncome) * 100 : 0,
        status: getWantsStatus(),
        categories: wantsCategories
      },
      savings: {
        budgetAmount: savingsBudget,
        actualSavings,
        percentage: totalIncome > 0 ? (actualSavings / totalIncome) * 100 : 0,
        status: getSavingsStatus()
      },
      recommendations
    };

    res.json({
      message: '50/30/20 budget analysis retrieved successfully',
      data: response
    });

  } catch (error) {
    console.error('Error generating 50/30/20 budget analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
