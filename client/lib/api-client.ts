import { 
  User, 
  AuthResponse, 
  Expense, 
  Income, 
  Budget, 
  CreateExpenseRequest, 
  CreateIncomeRequest, 
  CreateBudgetRequest,
  ExpenseAnalytics,
  MonthlySummaryData,
  ApiResponse,
  PaginatedResponse 
} from '@shared/api';

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? '/api'
  : 'https://expense-tracker-rk26.onrender.com/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Auth API
  async register(email: string, password: string, name: string, adminCode?: string): Promise<AuthResponse> {
    const body: any = { email, password, name };
    if (adminCode) {
      body.adminCode = adminCode;
    }
    
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/profile');
  }

  async updateProfile(updates: Partial<Pick<User, 'name' | 'preferences' | 'avatar'>>): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // Roommate management API
  async addRoommate(name: string): Promise<{ roommates: string[] }> {
    return this.request<{ roommates: string[] }>('/auth/roommates', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  async removeRoommate(name: string): Promise<{ roommates: string[] }> {
    return this.request<{ roommates: string[] }>('/auth/roommates', {
      method: 'DELETE',
      body: JSON.stringify({ name })
    });
  }

  async updateRoommateName(oldName: string, newName: string): Promise<{ roommates: string[] }> {
    return this.request<{ roommates: string[] }>('/auth/roommates', {
      method: 'PUT',
      body: JSON.stringify({ oldName, newName })
    });
  }

  // Friend request API
  async searchUsers(query: string): Promise<{ users: Array<{ name: string; email: string }> }> {
    return this.request<{ users: Array<{ name: string; email: string }> }>(`/auth/users/search?query=${encodeURIComponent(query)}`);
  }

  async sendFriendRequest(targetEmail: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/friend-requests/send', {
      method: 'POST',
      body: JSON.stringify({ targetEmail })
    });
  }

  async acceptFriendRequest(senderEmail: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/friend-requests/accept', {
      method: 'POST',
      body: JSON.stringify({ senderEmail })
    });
  }

  async rejectFriendRequest(senderEmail: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/friend-requests/reject', {
      method: 'POST',
      body: JSON.stringify({ senderEmail })
    });
  }

  async getFriendRequests(): Promise<{ 
    received: Array<{ name: string; email: string }>;
    sent: Array<{ name: string; email: string }>;
  }> {
    return this.request<{ 
      received: Array<{ name: string; email: string }>;
      sent: Array<{ name: string; email: string }>;
    }>('/auth/friend-requests');
  }

  // Balance API
  async getUserBalances(): Promise<{ 
    balances: {
      totalOwed: number;
      totalOwing: number;
      balances: {[email: string]: number};
      netBalance: number;
    }
  }> {
    return this.request<{ 
      balances: {
        totalOwed: number;
        totalOwing: number;
        balances: {[email: string]: number};
        netBalance: number;
      }
    }>('/balances');
  }

  async getBalanceBetweenUsers(otherUserEmail: string): Promise<{
    balance: {
      user1OwesUser2: number;
      user2OwesUser1: number;
      netBalance: number;
      summary: string;
    }
  }> {
    return this.request<{
      balance: {
        user1OwesUser2: number;
        user2OwesUser1: number;
        netBalance: number;
        summary: string;
      }
    }>(`/balances/${encodeURIComponent(otherUserEmail)}`);
  }

  async settlePayment(payerEmail: string, amount: number, expenseId?: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/balances/settle', {
      method: 'POST',
      body: JSON.stringify({ payerEmail, amount, expenseId })
    });
  }

  async markPaymentPaid(expenseId: string, participantEmail: string): Promise<{ message: string; expense: Expense }> {
    return this.request<{ message: string; expense: Expense }>('/balances/mark-paid', {
      method: 'PUT',
      body: JSON.stringify({ expenseId, participantEmail })
    });
  }

  // Expenses API
  async createExpense(expense: CreateExpenseRequest): Promise<{ expense: Expense }> {
    return this.request<{ expense: Expense }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense)
    });
  }

  async getExpenses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    startDate?: string;
    endDate?: string;
    tags?: string;
    search?: string;
  }): Promise<PaginatedResponse<Expense>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    const endpoint = query ? `/expenses?${query}` : '/expenses';
    
    return this.request<PaginatedResponse<Expense>>(endpoint);
  }

  async updateExpense(id: string, updates: Partial<CreateExpenseRequest>): Promise<{ expense: Expense }> {
    return this.request<{ expense: Expense }>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteExpense(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE'
    });
  }

  async getExpenseAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<ExpenseAnalytics> {
    return this.request<ExpenseAnalytics>(`/expenses/analytics?period=${period}`);
  }

  async markSplitPaymentPaid(expenseId: string, participant: string, notes?: string): Promise<{ expense: Expense }> {
    return this.request<{ expense: Expense }>(`/expenses/${expenseId}/split/${participant}/paid`, {
      method: 'PUT',
      body: JSON.stringify({ notes })
    });
  }

  async markNonRoommatePaymentPaid(expenseId: string, noteIndex: number): Promise<{ expense: Expense }> {
    return this.request<{ expense: Expense }>(`/expenses/${expenseId}/notes/${noteIndex}/paid`, {
      method: 'PUT'
    });
  }

  // Income API
  async createIncome(income: CreateIncomeRequest): Promise<{ income: Income }> {
    return this.request<{ income: Income }>('/income', {
      method: 'POST',
      body: JSON.stringify(income)
    });
  }

  async getIncomes(params?: {
    page?: number;
    limit?: number;
    source?: string;
    startDate?: string;
    endDate?: string;
    tags?: string;
    search?: string;
  }): Promise<PaginatedResponse<Income>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    const endpoint = query ? `/income?${query}` : '/income';
    
    return this.request<PaginatedResponse<Income>>(endpoint);
  }

  async updateIncome(id: string, updates: Partial<CreateIncomeRequest>): Promise<{ income: Income }> {
    return this.request<{ income: Income }>(`/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteIncome(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/income/${id}`, {
      method: 'DELETE'
    });
  }

  // Budget API
  async createBudget(budget: CreateBudgetRequest): Promise<{ budget: Budget }> {
    return this.request<{ budget: Budget }>('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget)
    });
  }

  async getBudgets(params?: {
    period?: 'weekly' | 'monthly' | 'yearly';
    active?: boolean;
  }): Promise<{ budgets: Budget[] }> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    const endpoint = query ? `/budgets?${query}` : '/budgets';
    
    return this.request<{ budgets: Budget[] }>(endpoint);
  }

  async updateBudget(id: string, updates: Partial<CreateBudgetRequest>): Promise<{ budget: Budget }> {
    return this.request<{ budget: Budget }>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteBudget(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/budgets/${id}`, {
      method: 'DELETE'
    });
  }

  async getBudgetAnalytics(): Promise<{
    analytics: {
      totalBudgets: number;
      totalBudgetAmount: number;
      totalSpent: number;
      budgetsExceeded: number;
      budgetsAtRisk: number;
      averageUtilization: number;
    };
    budgets: Budget[];
  }> {
    return this.request('/budgets/analytics');
  }

  // Reports API
  async getMonthlySummary(month?: number, year?: number): Promise<{ data: MonthlySummaryData }> {
    const searchParams = new URLSearchParams();
    
    if (month !== undefined) searchParams.append('month', month.toString());
    if (year !== undefined) searchParams.append('year', year.toString());

    const query = searchParams.toString();
    const endpoint = query ? `/reports/monthly?${query}` : '/reports/monthly';
    
    return this.request<{ data: MonthlySummaryData }>(endpoint);
  }

  async getYearlySummary(year?: number): Promise<{
    data: {
      year: number;
      monthlyData: Array<{
        _id: { month: number; year: number };
        expenses: number;
        count: number;
      }>;
      monthlyIncome: Array<{
        _id: { month: number; year: number };
        income: number;
      }>;
      categoryTrends: Array<{
        _id: string;
        monthlyTotals: Array<{
          month: number;
          total: number;
        }>;
        yearlyTotal: number;
      }>;
    };
  }> {
    const searchParams = new URLSearchParams();
    
    if (year !== undefined) searchParams.append('year', year.toString());

    const query = searchParams.toString();
    const endpoint = query ? `/reports/yearly?${query}` : '/reports/yearly';
    
    return this.request(endpoint);
  }

  // File upload API
  async uploadReceipt(file: File): Promise<{ filename: string; url: string }> {
    const formData = new FormData();
    formData.append('receipt', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload/receipt`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Budget 50/30/20 methods
  async getBudget503020(month?: number, year?: number): Promise<any> {
    const searchParams = new URLSearchParams();
    if (month !== undefined) searchParams.append('month', month.toString());
    if (year !== undefined) searchParams.append('year', year.toString());
    
    const queryString = searchParams.toString();
    const endpoint = `/budget/503020${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }
}

export const apiClient = new ApiClient();
