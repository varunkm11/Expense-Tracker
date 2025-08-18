import { ClearDataButtons } from "@/components/ClearAllButton";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ExpenseChart } from "@/components/ExpenseChart";
import { ExpenseSplitDetails } from "@/components/ExpenseSplitDetails";
import { SplitExpensesSummary } from "@/components/SplitExpensesSummary";
import { FriendRequestsManager } from "@/components/FriendRequestsManager";
import { BalanceOverview } from "@/components/BalanceOverview";
import { NavigationBar } from "@/components/NavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Users,
  Calendar,
  IndianRupee,
  Filter,
  MoreVertical,
  BarChart3,
  LogOut,
  Upload,
  Loader2,
  Settings,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from "@shared/api";
import type { Expense, Income, CreateExpenseRequest, CreateIncomeRequest } from "@shared/api";

export default function Index() {
  const { user, logout, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [newExpense, setNewExpense] = useState<CreateExpenseRequest>({
    amount: 0,
    category: "",
    description: "",
    splitWith: [],
    paidBy: "You",
    nonRoommateNotes: []
  });
  
  const [newIncome, setNewIncome] = useState<CreateIncomeRequest>({
    amount: 0,
    source: "",
    description: ""
  });
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [customSplitAmounts, setCustomSplitAmounts] = useState<{[friendEmail: string]: number}>({});
  const [useCustomSplit, setUseCustomSplit] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Fetch expenses
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => apiClient.getExpenses({ limit: 50 })
  });

  // Fetch income
  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ['income'],
    queryFn: () => apiClient.getIncomes({ limit: 50 })
  });

  // Fetch analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['expense-analytics'],
    queryFn: () => apiClient.getExpenseAnalytics('month')
  });

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: (expense: CreateExpenseRequest) => apiClient.createExpense(expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-analytics'] });
      toast.success('Expense added successfully!');
      setIsAddExpenseOpen(false);
      resetExpenseForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add expense');
    }
  });

  const createIncomeMutation = useMutation({
    mutationFn: (income: CreateIncomeRequest) => apiClient.createIncome(income),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['expense-analytics'] });
      toast.success('Income added successfully!');
      setIsAddIncomeOpen(false);
      resetIncomeForm();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add income');
    }
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadReceipt(file),
    onSuccess: (data) => {
      // Update the expense with receipt URL
      setNewExpense(prev => ({ ...prev, receiptUrl: data.url }));
      toast.success('Receipt uploaded successfully!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to upload receipt');
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) => apiClient.deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-analytics'] });
      toast.success('Expense deleted successfully!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete expense');
    }
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (incomeId: string) => apiClient.deleteIncome(incomeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income'] });
      toast.success('Income deleted successfully!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete income');
    }
  });

  const resetExpenseForm = () => {
    setNewExpense({
      amount: 0,
      category: "",
      description: "",
      splitWith: [],
      paidBy: "You",
      nonRoommateNotes: []
    });
    setReceiptFile(null);
    setCustomSplitAmounts({});
    setUseCustomSplit(false);
  };

  const resetIncomeForm = () => {
    setNewIncome({
      amount: 0,
      source: "",
      description: ""
    });
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.category || !newExpense.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate custom split amounts if using custom split
    if (useCustomSplit && newExpense.splitWith && newExpense.splitWith.length > 0) {
      const totalAssigned = Object.entries(customSplitAmounts)
        .filter(([friendEmail]) => newExpense.splitWith?.includes(friendEmail))
        .reduce((sum, [, amount]) => sum + amount, 0);
      
      if (totalAssigned > newExpense.amount) {
        toast.error('Split amounts cannot exceed total expense amount');
        return;
      }
    }

    let receiptUrl = undefined;
    
    // Upload receipt if provided
    if (receiptFile) {
      try {
        const uploadResult = await uploadReceiptMutation.mutateAsync(receiptFile);
        receiptUrl = uploadResult.url;
      } catch (error) {
        // Receipt upload failed, but continue with expense creation
        console.error('Receipt upload failed:', error);
      }
    }

    // Prepare split details if split is enabled
    let splitDetails = undefined;
    if (newExpense.splitWith && newExpense.splitWith.length > 0) {
      const totalParticipants = newExpense.splitWith.length + 1; // +1 for payer
      
      if (useCustomSplit) {
        // Use custom amounts
        splitDetails = {
          totalParticipants,
          amountPerPerson: 0, // Not applicable for custom split
          payments: newExpense.splitWith.map(participant => ({
            participant,
            amount: customSplitAmounts[participant] || 0,
            isPaid: false,
            paidAt: undefined,
            notes: '',
            markedPaidBy: undefined
          }))
        };
      } else {
        // Use equal split
        const amountPerPerson = newExpense.amount / totalParticipants;
        splitDetails = {
          totalParticipants,
          amountPerPerson,
          payments: newExpense.splitWith.map(participant => ({
            participant,
            amount: amountPerPerson,
            isPaid: false,
            paidAt: undefined,
            notes: '',
            markedPaidBy: undefined
          }))
        };
      }
    }

    createExpenseMutation.mutate({
      ...newExpense,
      ...(receiptUrl && { receiptUrl }),
      ...(splitDetails && { splitDetails })
    });
  };

  const handleAddIncome = () => {
    if (!newIncome.amount || !newIncome.source || !newIncome.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    createIncomeMutation.mutate(newIncome);
  };

  const handleSplitWithChange = (friendEmail: string, checked: boolean) => {
    setNewExpense(prev => ({
      ...prev,
      splitWith: checked 
        ? [...(prev.splitWith || []), friendEmail]
        : (prev.splitWith || []).filter(r => r !== friendEmail)
    }));
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const expenses = expensesData?.data || [];
  const incomes = incomeData?.data || [];
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const balance = totalIncome - totalExpenses;

  const getCategoryExpenses = () => {
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return Object.entries(categoryTotals).map(([category, amount]) => ({ 
      category, 
      amount,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6B7280'
    }));
  };

  const recentExpenses = expenses.slice(0, 5);
  const recentIncomes = incomes.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      {/* Navigation */}
      <NavigationBar />

      <div className="container mx-auto px-4 py-6 pt-20">
        {/* Balance Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-green-800">
                <span>Total Income</span>
                <TrendingUp className="w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">₹{totalIncome.toLocaleString()}</div>
              <p className="text-green-700 text-sm mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-red-800">
                <span>Total Expenses</span>
                <TrendingDown className="w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">₹{totalExpenses.toLocaleString()}</div>
              <p className="text-red-700 text-sm mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-red-50 to-red-100 border-red-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center justify-between ${balance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                <span>Balance</span>
                <Wallet className="w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                ₹{Math.abs(balance).toLocaleString()}
              </div>
              <p className={`text-sm mt-1 ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {balance >= 0 ? 'Surplus' : 'Deficit'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-md border">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="balance">Balance</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col h-full"
              >
                <Card className="h-full min-h-[420px] flex flex-col">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Add your expenses and income quickly</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-orange-400 to-red-500">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Expense
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Expense</DialogTitle>
                          <DialogDescription>Record a new expense with details</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expense-amount">Amount</Label>
                              <Input
                                id="expense-amount"
                                type="number"
                                placeholder="₹0"
                                value={newExpense.amount || ''}
                                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="expense-category">Category</Label>
                              <Select value={newExpense.category} onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {EXPENSE_CATEGORIES.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="expense-description">Description</Label>
                            <Input
                              id="expense-description"
                              placeholder="What did you spend on?"
                              value={newExpense.description}
                              onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>

                          <div>
                            <Label htmlFor="expense-paidby">Paid By</Label>
                            <Select value={newExpense.paidBy} onValueChange={(value) => setNewExpense(prev => ({ ...prev, paidBy: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="You">You</SelectItem>
                                {user?.friends?.map(friend => (
                                  <SelectItem key={friend.email} value={friend.email}>{friend.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Split Expense</Label>
                            <div className="space-y-4 mt-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="use-custom-split"
                                  checked={useCustomSplit}
                                  onCheckedChange={(checked) => setUseCustomSplit(checked as boolean)}
                                />
                                <Label htmlFor="use-custom-split" className="text-sm">
                                  Use custom amounts
                                </Label>
                              </div>
                              
                              {/* Friends Split Section */}
                              <div className="border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-3">
                                  <Users className="w-4 h-4 text-blue-600" />
                                  <Label className="font-medium text-sm">Split with Friends</Label>
                                </div>
                                <div className="space-y-2">
                                  {user?.friends && user.friends.length > 0 ? (
                                    user.friends.map(friend => (
                                      <div key={friend.email} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                                        <Checkbox
                                          id={`split-${friend.email}`}
                                          checked={newExpense.splitWith?.includes(friend.email)}
                                          onCheckedChange={(checked) => handleSplitWithChange(friend.email, checked as boolean)}
                                        />
                                        <Label 
                                          htmlFor={`split-${friend.email}`} 
                                          className="text-sm flex-1"
                                          title={friend.name}
                                        >
                                          {friend.name}
                                        </Label>
                                        {useCustomSplit && newExpense.splitWith?.includes(friend.email) && (
                                          <div className="flex items-center space-x-1">
                                            <span className="text-xs">₹</span>
                                            <Input
                                              type="number"
                                              placeholder="Amount"
                                              value={customSplitAmounts[friend.email] || ''}
                                              onChange={(e) => setCustomSplitAmounts(prev => ({
                                                ...prev,
                                                [friend.email]: Number(e.target.value) || 0
                                              }))}
                                              className="w-20 h-8 text-xs"
                                            />
                                          </div>
                                        )}
                                        {!useCustomSplit && newExpense.splitWith?.includes(friend.email) && newExpense.amount > 0 && (
                                          <span className="text-xs text-gray-500">
                                            ₹{(newExpense.amount / ((newExpense.splitWith?.length || 0) + 1)).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-4 text-sm text-gray-500">
                                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                      <p>No friends added yet</p>
                                      <p className="text-xs">Add friends to split expenses with them</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Split Amount Display */}
                                {newExpense.splitWith && newExpense.splitWith.length > 0 && newExpense.amount > 0 && (
                                  <div className="mt-3 p-3 bg-green-50 rounded border">
                                    <div className="text-sm font-medium text-green-800">Split Summary:</div>
                                    <div className="text-xs text-green-700 mt-1">
                                      <div>Total Bill: ₹{newExpense.amount}</div>
                                      <div>Friends Selected: {newExpense.splitWith.length}</div>
                                      <div>Each Person Pays: ₹{(newExpense.amount / (newExpense.splitWith.length + 1)).toFixed(2)}</div>
                                      <div className="font-medium mt-1">You'll receive: ₹{(newExpense.amount - (newExpense.amount / (newExpense.splitWith.length + 1))).toFixed(2)} when friends pay</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {useCustomSplit && newExpense.splitWith && newExpense.splitWith.length > 0 && (
                                <div className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
                                  <strong>Split Summary:</strong><br/>
                                  Total: ₹{newExpense.amount}<br/>
                                  Assigned: ₹{Object.values(customSplitAmounts).reduce((sum, amount) => sum + amount, 0)}<br/>
                                  Remaining: ₹{newExpense.amount - Object.values(customSplitAmounts).reduce((sum, amount) => sum + amount, 0)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Non-Roommate Expenses</Label>
                            <div className="space-y-2 mt-2">
                              {(newExpense.nonRoommateNotes || []).map((note, index) => (
                                <div key={`note-${index}`} className="flex items-center space-x-2 p-2 border rounded">
                                  <div className="flex-1 grid grid-cols-3 gap-2">
                                    <Input
                                      placeholder="Person name"
                                      value={note.person}
                                      onChange={(e) => {
                                        const notes = [...(newExpense.nonRoommateNotes || [])];
                                        notes[index] = { ...note, person: e.target.value };
                                        setNewExpense(prev => ({ ...prev, nonRoommateNotes: notes }));
                                      }}
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Amount"
                                      value={note.amount}
                                      onChange={(e) => {
                                        const notes = [...(newExpense.nonRoommateNotes || [])];
                                        notes[index] = { ...note, amount: Number(e.target.value) };
                                        setNewExpense(prev => ({ ...prev, nonRoommateNotes: notes }));
                                      }}
                                    />
                                    <Input
                                      placeholder="Description"
                                      value={note.description}
                                      onChange={(e) => {
                                        const notes = [...(newExpense.nonRoommateNotes || [])];
                                        notes[index] = { ...note, description: e.target.value };
                                        setNewExpense(prev => ({ ...prev, nonRoommateNotes: notes }));
                                      }}
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const notes = [...(newExpense.nonRoommateNotes || [])];
                                      notes.splice(index, 1);
                                      setNewExpense(prev => ({ ...prev, nonRoommateNotes: notes }));
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const notes = [...(newExpense.nonRoommateNotes || [])];
                                  notes.push({ person: '', amount: 0, description: '', isPaid: false });
                                  setNewExpense(prev => ({ ...prev, nonRoommateNotes: notes }));
                                }}
                              >
                                + Add Non-Roommate Note
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="receipt-upload">Receipt (optional)</Label>
                            <Input
                              id="receipt-upload"
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleReceiptUpload}
                              className="mt-1"
                            />
                            {receiptFile && (
                              <p className="text-sm text-gray-600 mt-1">
                                Selected: {receiptFile.name}
                              </p>
                            )}
                          </div>

                          <Button 
                            onClick={handleAddExpense} 
                            className="w-full" 
                            disabled={createExpenseMutation.isPending || uploadReceiptMutation.isPending}
                          >
                            {(createExpenseMutation.isPending || uploadReceiptMutation.isPending) ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              'Add Expense'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Income
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Income</DialogTitle>
                          <DialogDescription>Record a new income source</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="income-amount">Amount</Label>
                              <Input
                                id="income-amount"
                                type="number"
                                placeholder="₹0"
                                value={newIncome.amount || ''}
                                onChange={(e) => setNewIncome(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="income-source">Source</Label>
                              <Input
                                id="income-source"
                                placeholder="e.g., Salary, Freelance"
                                value={newIncome.source}
                                onChange={(e) => setNewIncome(prev => ({ ...prev, source: e.target.value }))}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="income-description">Description</Label>
                            <Input
                              id="income-description"
                              placeholder="Additional details"
                              value={newIncome.description}
                              onChange={(e) => setNewIncome(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>

                          <Button 
                            onClick={handleAddIncome} 
                            className="w-full" 
                            disabled={createIncomeMutation.isPending}
                          >
                            {createIncomeMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              'Add Income'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Clear Data Buttons */}
                    <ClearDataButtons />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Expenses */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col h-full"
              >
                <Card className="h-full min-h-[420px] flex flex-col">
                  <CardHeader>
                    <CardTitle>Recent Expenses</CardTitle>
                    <CardDescription>Your latest spending activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {expensesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : recentExpenses.length > 0 ? (
                      <div className="space-y-3">
                        {recentExpenses.map(expense => (
                          <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-500'}`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm text-gray-900">{expense.description}</p>
                                  {expense.isLinkedExpense && (
                                    <Badge variant="secondary" className="text-xs px-2 py-0">
                                      Split
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600">{expense.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">₹{expense.amount.toLocaleString()}</p>
                                <p className="text-xs text-gray-600">{expense.paidBy}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteExpenseMutation.mutate(expense.id)}
                                disabled={deleteExpenseMutation.isPending || expense.isLinkedExpense}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={expense.isLinkedExpense ? "Cannot delete split expense directly" : "Delete expense"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No expenses yet</p>
                        <p className="text-sm">Add your first expense to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Split Expenses Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col h-full"
              >
                <div className="h-full min-h-[420px] flex flex-col">
                  <SplitExpensesSummary />
                </div>
              </motion.div>
            </div>

            {/* Category Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>Where your money goes</CardDescription>
                </CardHeader>
                <CardContent>
                  {totalExpenses > 0 ? (
                    <ExpenseChart data={getCategoryExpenses()} totalExpenses={totalExpenses} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No spending data available</p>
                      <p className="text-sm">Add some expenses to see the breakdown</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Expenses</CardTitle>
                <CardDescription>Complete list of your expenses</CardDescription>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : expenses.length > 0 ? (
                  <div className="space-y-3">
                    {expenses.map(expense => (
                      <div key={expense.id} className="space-y-2">
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={`w-4 h-4 rounded-full ${CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-500'}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{expense.description}</p>
                                {expense.isLinkedExpense && (
                                  <Badge variant="secondary" className="text-xs px-2 py-0">
                                    Split
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                              {expense.splitWith && expense.splitWith.length > 0 && (
                                <div className="text-xs space-y-1">
                                  <p className="text-blue-600">Split with: {expense.splitWith.join(', ')}</p>
                                  {expense.splitDetails && (
                                    <p className="text-green-600">
                                      ₹{expense.splitDetails.amountPerPerson.toFixed(2)} per person 
                                      ({expense.splitDetails.totalParticipants} people)
                                    </p>
                                  )}
                                </div>
                              )}
                              {expense.nonRoommateNotes && expense.nonRoommateNotes.length > 0 && (
                                <p className="text-xs text-purple-600">
                                  Includes non-roommate expenses: {expense.nonRoommateNotes.length} items
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold text-lg text-gray-900">₹{expense.amount.toLocaleString()}</p>
                              <p className="text-sm text-gray-600">by {expense.paidBy}</p>
                              {expense.splitWith && expense.splitWith.length > 0 && expense.splitDetails && (
                                <p className="text-xs text-blue-600">
                                  You owe: ₹{expense.splitDetails.amountPerPerson.toFixed(2)}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteExpenseMutation.mutate(expense.id)}
                              disabled={deleteExpenseMutation.isPending || expense.isLinkedExpense}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={expense.isLinkedExpense ? "Cannot delete split expense directly" : "Delete expense"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <ExpenseSplitDetails expense={expense} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <PieChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No expenses found</p>
                    <p className="text-sm">Start tracking your expenses by adding your first one</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Income Sources</CardTitle>
                <CardDescription>Track your earnings and income</CardDescription>
              </CardHeader>
              <CardContent>
                {incomeLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : incomes.length > 0 ? (
                  <div className="space-y-3">
                    {incomes.map(income => (
                      <div key={income.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-green-50 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">{income.description}</p>
                          <p className="text-sm text-gray-600">{income.source} • {new Date(income.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-lg text-green-600">+₹{income.amount.toLocaleString()}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteIncomeMutation.mutate(income.id)}
                            disabled={deleteIncomeMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No income recorded</p>
                    <p className="text-sm">Add your income sources to track your earnings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="friends" className="space-y-6">
            <FriendRequestsManager />
          </TabsContent>

          <TabsContent value="balance" className="space-y-6">
            <BalanceOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
