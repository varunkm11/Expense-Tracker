/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * User types
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAdmin?: boolean;
  roommates: string[];
  friends: Array<{
    email: string;
    name: string;
  }>;
  friendRequests?: {
    sent: string[];
    received: string[];
  };
  preferences: {
    currency: string;
    theme: string;
    notifications: boolean;
  };
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

/**
 * Expense types
 */
export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  date: string;
  splitWith: string[];
  paidBy: string;
  receiptUrl?: string;
  tags: string[];
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  splitDetails?: {
    totalParticipants: number;
    amountPerPerson: number;
    payments: Array<{
      participant: string;
      amount: number; // Custom amount for this participant
      isPaid: boolean;
      paidAt?: string;
      notes?: string;
    }>;
  };
  nonRoommateNotes?: Array<{
    person: string;
    amount: number;
    description: string;
    isPaid: boolean;
    paidAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  date?: string;
  splitWith?: string[];
  paidBy?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  splitDetails?: {
    totalParticipants: number;
    amountPerPerson: number;
    payments: Array<{
      participant: string;
      amount: number; // Custom amount for this participant
      isPaid: boolean;
      paidAt?: string;
      notes?: string;
    }>;
  };
  nonRoommateNotes?: Array<{
    person: string;
    amount: number;
    description: string;
    isPaid: boolean;
    paidAt?: string;
  }>;
}

/**
 * Income types
 */
export interface Income {
  id: string;
  userId: string;
  amount: number;
  source: string;
  description: string;
  date: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  taxable: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomeRequest {
  amount: number;
  source: string;
  description: string;
  date?: string;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  taxable?: boolean;
  tags?: string[];
}

/**
 * Budget types
 */
export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  spent: number;
  notifications: {
    at50Percent: boolean;
    at80Percent: boolean;
    atLimit: boolean;
  };
  progress?: number;
  status?: 'safe' | 'caution' | 'warning' | 'exceeded';
  remaining?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetRequest {
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  notifications?: {
    at50Percent?: boolean;
    at80Percent?: boolean;
    atLimit?: boolean;
  };
}

/**
 * Analytics and Reports
 */
export interface ExpenseAnalytics {
  period: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  categoryExpenses: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  dailyExpenses: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  summary: {
    total: number;
    count: number;
    average: number;
    previousTotal: number;
    change: number;
  };
}

export interface MonthlySummaryData {
  period: {
    month: string;
    startDate: string;
    endDate: string;
  };
  totals: {
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
  };
  previousMonth: {
    expenses: number;
    income: number;
  };
  expenses: Expense[];
  incomes: Income[];
  categoryExpenses: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  budgets: Budget[];
  dailySpending: Array<{
    _id: string;
    total: number;
  }>;
  insights: string[];
}

/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Categories
 */
export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Personal Care",
  "Others"
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

/**
 * Category colors for UI
 */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  "Food & Dining": "bg-orange-500",
  "Transportation": "bg-blue-500",
  "Shopping": "bg-purple-500",
  "Entertainment": "bg-pink-500",
  "Bills & Utilities": "bg-yellow-500",
  "Healthcare": "bg-red-500",
  "Education": "bg-green-500",
  "Travel": "bg-indigo-500",
  "Personal Care": "bg-teal-500",
  "Others": "bg-gray-500"
};
