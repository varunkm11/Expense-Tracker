import { Response } from 'express';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { AuthRequest } from '../middleware/auth';
import { startOfMonth, endOfMonth } from 'date-fns';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface FinancialInsight {
  type: 'spending' | 'saving' | 'income' | 'budget' | 'trend';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface InsightsResponse {
  insights: FinancialInsight[];
  motivation: {
    dailyQuote: string;
    weeklyGoal: string;
    monthlyChallenge: string;
  };
  recommendations: string[];
  financialScore: number;
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Mock Gemini API responses - In production, integrate with actual Gemini API
const DAILY_QUOTES = [
  "Every rupee saved today is a step towards financial freedom tomorrow.",
  "Budget is telling your money where to go instead of wondering where it went.",
  "The best investment you can make is in yourself and your financial education.",
  "Small changes in spending habits can lead to big changes in your bank account.",
  "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
  "A budget is more than just a series of numbers on a page; it is an embodiment of your values.",
  "Don't save what is left after spending; spend what is left after saving.",
  "The real measure of your wealth is how much you'd be worth if you lost all your money."
];

const WEEKLY_GOALS = [
  "Track every expense this week",
  "Cook meals at home instead of ordering out",
  "Find one subscription you can cancel",
  "Set aside ₹500 for your emergency fund",
  "Review and optimize your recurring expenses",
  "Plan your meals to avoid food waste",
  "Use cash for discretionary spending to stay aware",
  "Research one new investment opportunity"
];

const MONTHLY_CHALLENGES = [
  "Save 5% more than last month",
  "Reduce dining out expenses by 25%",
  "Implement the 50/30/20 budget rule",
  "Start a side income stream",
  "Build an emergency fund of 3 months expenses",
  "Automate your savings and investments",
  "Negotiate better rates for your utilities",
  "Create a debt reduction plan"
];

// Function to generate AI insights using Gemini
async function generateAIInsights(expenses: any[], incomes: any[], categoryTotals: { [key: string]: number }, currentTotalIncome: number, currentTotalExpenses: number): Promise<FinancialInsight[]> {
  try {
    const prompt = `
You are a financial advisor AI. Analyze the following financial data and provide 3-5 actionable insights in JSON format.

Financial Data:
- Total Income: ₹${currentTotalIncome}
- Total Expenses: ₹${currentTotalExpenses}
- Net Savings: ₹${currentTotalIncome - currentTotalExpenses}
- Savings Rate: ${currentTotalIncome > 0 ? ((currentTotalIncome - currentTotalExpenses) / currentTotalIncome * 100).toFixed(1) : 0}%

Category-wise Spending:
${Object.entries(categoryTotals).map(([category, amount]) => `- ${category}: ₹${amount}`).join('\n')}

Recent Expenses:
${expenses.slice(0, 10).map(exp => `- ${exp.description}: ₹${exp.amount} (${exp.category})`).join('\n')}

Please respond ONLY with a valid JSON array of financial insights. Each insight should have:
- type: one of 'spending', 'saving', 'income', 'budget', 'trend'
- title: short descriptive title
- description: detailed explanation
- impact: 'positive', 'negative', or 'neutral'
- actionable: boolean
- priority: 'high', 'medium', or 'low'

Example format:
[
  {
    "type": "spending",
    "title": "High Food Expenses",
    "description": "Your food expenses are 30% higher than recommended",
    "impact": "negative",
    "actionable": true,
    "priority": "medium"
  }
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    try {
      const insights = JSON.parse(text);
      if (Array.isArray(insights)) {
        return insights;
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
    }
  } catch (error) {
    console.error('Error generating AI insights:', error);
  }
  
  // Fallback to basic insights if AI fails
  return [];
}

// Function to generate basic rule-based insights
function generateBasicInsights(categoryTotals: { [key: string]: number }, currentTotalIncome: number, currentTotalExpenses: number, prevTotalExpenses: number, prevTotalIncome: number): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // Spending trend insight
  if (prevTotalExpenses > 0) {
    const spendingChange = ((currentTotalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100;
    if (spendingChange > 10) {
      insights.push({
        type: 'spending',
        title: 'Spending Increase Alert',
        description: `Your spending increased by ${spendingChange.toFixed(1)}% compared to last month. Consider reviewing your expenses.`,
        impact: 'negative',
        actionable: true,
        priority: 'high'
      });
    } else if (spendingChange < -10) {
      insights.push({
        type: 'spending',
        title: 'Great Spending Control',
        description: `You reduced your spending by ${Math.abs(spendingChange).toFixed(1)}% this month. Keep up the excellent work!`,
        impact: 'positive',
        actionable: false,
        priority: 'medium'
      });
    }
  }

  // Top spending category insight
  const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0];
  if (topCategory) {
    const percentage = (topCategory[1] / currentTotalExpenses) * 100;
    insights.push({
      type: 'spending',
      title: 'Top Spending Category',
      description: `${topCategory[0]} accounts for ${percentage.toFixed(1)}% (₹${topCategory[1].toLocaleString()}) of your monthly spending.`,
      impact: percentage > 40 ? 'negative' : 'neutral',
      actionable: percentage > 40,
      priority: percentage > 40 ? 'high' : 'low'
    });
  }

  // Savings rate insight
  const savingsRate = currentTotalIncome > 0 ? ((currentTotalIncome - currentTotalExpenses) / currentTotalIncome) * 100 : 0;
  if (savingsRate < 10) {
    insights.push({
      type: 'saving',
      title: 'Low Savings Rate',
      description: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% to build financial security.`,
      impact: 'negative',
      actionable: true,
      priority: 'high'
    });
  } else if (savingsRate >= 20) {
    insights.push({
      type: 'saving',
      title: 'Excellent Savings Rate',
      description: `You're saving ${savingsRate.toFixed(1)}% of your income. You're on track for strong financial health!`,
      impact: 'positive',
      actionable: false,
      priority: 'medium'
    });
  }

  return insights;
}

export const getFinancialInsights = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const currentDate = new Date();
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    
    // Get previous month for comparison
    const prevMonthStart = startOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const prevMonthEnd = endOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    // Get current month data
    const [currentExpenses, currentIncome, prevExpenses, prevIncome] = await Promise.all([
      Expense.find({
        $or: [{ userId }, { splitWith: userId }],
        date: { $gte: startDate, $lte: endDate }
      }),
      Income.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }),
      Expense.find({
        $or: [{ userId }, { splitWith: userId }],
        date: { $gte: prevMonthStart, $lte: prevMonthEnd }
      }),
      Income.find({
        userId,
        date: { $gte: prevMonthStart, $lte: prevMonthEnd }
      })
    ]);

    // Calculate totals
    const currentTotalExpenses = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const currentTotalIncome = currentIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const prevTotalExpenses = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const prevTotalIncome = prevIncome.reduce((sum, inc) => sum + inc.amount, 0);

    // Calculate category spending
    const categoryTotals: { [key: string]: number } = {};
    currentExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    // Generate insights using AI and fallback to basic insights
    let insights: FinancialInsight[] = [];
    
    // Try to get AI-generated insights first
    const aiInsights = await generateAIInsights(currentExpenses, currentIncome, categoryTotals, currentTotalIncome, currentTotalExpenses);
    if (aiInsights.length > 0) {
      insights = aiInsights;
    } else {
      // Fallback to basic rule-based insights
      insights = generateBasicInsights(categoryTotals, currentTotalIncome, currentTotalExpenses, prevTotalExpenses, prevTotalIncome);
    }

    // Generate financial score (0-100)
    let score = 50; // Base score
    const savingsRate = currentTotalIncome > 0 ? ((currentTotalIncome - currentTotalExpenses) / currentTotalIncome) * 100 : 0;
    const needsCategories = ['Food & Dining', 'Transportation', 'Utilities', 'Healthcare', 'Housing'];
    const needsSpending = needsCategories.reduce((sum, cat) => sum + (categoryTotals[cat] || 0), 0);
    const needsPercentage = currentTotalIncome > 0 ? (needsSpending / currentTotalIncome) * 100 : 0;
    
    if (savingsRate >= 20) score += 20;
    if (savingsRate >= 10) score += 10;
    if (needsPercentage <= 50) score += 15;
    if (currentTotalIncome > prevTotalIncome) score += 10;
    if (currentTotalExpenses <= prevTotalExpenses) score += 15;

    // Random motivational content
    const randomQuote = DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)];
    const randomGoal = WEEKLY_GOALS[Math.floor(Math.random() * WEEKLY_GOALS.length)];
    const randomChallenge = MONTHLY_CHALLENGES[Math.floor(Math.random() * MONTHLY_CHALLENGES.length)];

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (savingsRate < 20) {
      recommendations.push("Increase your savings rate by reducing discretionary spending");
    }
    if (needsPercentage > 50) {
      recommendations.push("Review your essential expenses to find areas for optimization");
    }
    if (Object.keys(categoryTotals).length > 0) {
      const topSpendingCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0][0];
      recommendations.push(`Consider setting a monthly limit for your highest spending category: ${topSpendingCategory}`);
    }
    
    recommendations.push("Use the 50/30/20 budget rule to maintain financial balance");
    recommendations.push("Track your expenses daily to stay aware of your spending patterns");

    const response: InsightsResponse = {
      insights,
      motivation: {
        dailyQuote: randomQuote,
        weeklyGoal: randomGoal,
        monthlyChallenge: randomChallenge
      },
      recommendations,
      financialScore: Math.min(100, Math.max(0, score))
    };

    res.json({
      message: 'Financial insights generated successfully',
      data: response
    });

  } catch (error) {
    console.error('Error generating financial insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
