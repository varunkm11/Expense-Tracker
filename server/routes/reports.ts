import { Response } from 'express';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { Budget } from '../models/Budget';
import { AuthRequest } from '../middleware/auth';
import { startOfMonth, endOfMonth, format, subMonths, startOfYear, endOfYear } from 'date-fns';

export const getMonthlySummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { month, year } = req.query;
    
    const targetDate = new Date(Number(year) || new Date().getFullYear(), Number(month) || new Date().getMonth(), 1);
    const startDate = startOfMonth(targetDate);
    const endDate = endOfMonth(targetDate);
    const previousStartDate = startOfMonth(subMonths(targetDate, 1));
    const previousEndDate = endOfMonth(subMonths(targetDate, 1));

    // Get expenses for current month (owned by user OR where user is in splitWith)
    const expenses = await Expense.find({
      $or: [{ userId }, { splitWith: userId }],
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    // Get income for current month
    const incomes = await Income.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    // Get category-wise expenses
    const categoryExpenses = await Expense.aggregate([
      {
        $match: {
          $or: [{ userId }, { splitWith: userId }],
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

    // Get previous month totals for comparison
    const previousExpenses = await Expense.aggregate([
      {
        $match: {
          $or: [{ userId }, { splitWith: userId }],
          date: { $gte: previousStartDate, $lte: previousEndDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const previousIncome = await Income.aggregate([
      {
        $match: {
          userId,
          date: { $gte: previousStartDate, $lte: previousEndDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Get budgets
    const budgets = await Budget.find({
      userId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    // Get daily spending trend
    const dailySpending = await Expense.aggregate([
      {
        $match: {
          $or: [{ userId }, { splitWith: userId }],
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Prepare summary data
    const summaryData = {
      period: {
        month: format(targetDate, 'MMMM yyyy'),
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      },
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        savings: netSavings,
        savingsRate
      },
      previousMonth: {
        expenses: previousExpenses[0]?.total || 0,
        income: previousIncome[0]?.total || 0
      },
      expenses,
      incomes,
      categoryExpenses,
      budgets: budgets.map(budget => ({
        ...budget.toObject(),
        progress: budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0,
        remaining: Math.max(0, budget.limit - budget.spent)
      })),
      dailySpending,
      insights: generateInsights(expenses, incomes, categoryExpenses, budgets, totalExpenses, totalIncome, previousExpenses[0]?.total || 0)
    };

    res.json({
      message: 'Monthly summary data generated successfully',
      data: summaryData
    });
  } catch (error) {
    console.error('Error generating monthly summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const generateYearlySummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { year } = req.query;
    
    const targetYear = Number(year) || new Date().getFullYear();
    const startDate = startOfYear(new Date(targetYear, 0, 1));
    const endDate = endOfYear(new Date(targetYear, 0, 1));

    // Monthly breakdown
    const monthlyData = await Expense.aggregate([
      {
        $match: {
          $or: [{ userId }, { splitWith: userId }],
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' }
          },
          expenses: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    const monthlyIncome = await Income.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' }
          },
          income: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    // Category trends over the year
    const categoryTrends = await Expense.aggregate([
      {
        $match: {
          $or: [{ userId }, { splitWith: userId }],
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          monthlyTotals: {
            $push: {
              month: '$_id.month',
              total: '$total'
            }
          },
          yearlyTotal: { $sum: '$total' }
        }
      },
      {
        $sort: { yearlyTotal: -1 }
      }
    ]);

    res.json({
      message: 'Yearly summary generated successfully',
      data: {
        year: targetYear,
        monthlyData,
        monthlyIncome,
        categoryTrends
      }
    });
  } catch (error) {
    console.error('Error generating yearly summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function generateInsights(expenses: any[], incomes: any[], categoryExpenses: any[], budgets: any[], totalExpenses: number, totalIncome: number, previousExpenses: number) {
  const insights = [];

  // Expense change from previous month
  if (previousExpenses > 0) {
    const change = ((totalExpenses - previousExpenses) / previousExpenses) * 100;
    if (change > 10) {
      insights.push(`Your expenses increased by ${change.toFixed(1)}% compared to last month. Consider reviewing your spending.`);
    } else if (change < -10) {
      insights.push(`Great job! You reduced your expenses by ${Math.abs(change).toFixed(1)}% compared to last month.`);
    }
  }

  // Top spending category
  if (categoryExpenses.length > 0) {
    const topCategory = categoryExpenses[0];
    const percentage = (topCategory.total / totalExpenses) * 100;
    insights.push(`${topCategory._id} was your highest spending category, accounting for ${percentage.toFixed(1)}% of your total expenses.`);
  }

  // Budget adherence
  const exceededBudgets = budgets.filter(b => b.spent > b.limit);
  if (exceededBudgets.length > 0) {
    insights.push(`You exceeded ${exceededBudgets.length} budget(s) this month. Consider adjusting your spending or budget limits.`);
  } else if (budgets.length > 0) {
    insights.push(`Congratulations! You stayed within all your budget limits this month.`);
  }

  // Savings rate
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  if (savingsRate >= 20) {
    insights.push(`Excellent! You saved ${savingsRate.toFixed(1)}% of your income this month.`);
  } else if (savingsRate >= 10) {
    insights.push(`Good job! You saved ${savingsRate.toFixed(1)}% of your income. Try to aim for 20% or more.`);
  } else if (savingsRate > 0) {
    insights.push(`You saved ${savingsRate.toFixed(1)}% of your income. Consider ways to increase your savings rate.`);
  } else {
    insights.push(`Your expenses exceeded your income this month. Review your spending to improve your financial health.`);
  }

  // Spending frequency
  const averageDailyExpenses = expenses.length > 0 ? totalExpenses / new Set(expenses.map(e => format(e.date, 'yyyy-MM-dd'))).size : 0;
  if (averageDailyExpenses > 0) {
    insights.push(`Your average daily spending was ₹${averageDailyExpenses.toFixed(0)}.`);
  }

  return insights;
}
