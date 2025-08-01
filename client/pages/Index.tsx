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
  const [customSplitAmounts, setCustomSplitAmounts] = useState<{[roommate: string]: number}>({});
  const [useCustomSplit, setUseCustomSplit] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  // Roommate management state
  const [isAddRoommateOpen, setIsAddRoommateOpen] = useState(false);
  const [isEditRoommateOpen, setIsEditRoommateOpen] = useState(false);
  const [newRoommateName, setNewRoommateName] = useState("");
  const [editingRoommate, setEditingRoommate] = useState({ oldName: "", newName: "" });
  
  // Get roommates list including "You" as first option
  const roommates = ["You", ...(user?.roommates || [])];

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
        .filter(([roommate]) => newExpense.splitWith?.includes(roommate))
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
            notes: ''
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
            notes: ''
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

  const handleSplitWithChange = (roommate: string, checked: boolean) => {
    setNewExpense(prev => ({
      ...prev,
      splitWith: checked 
        ? [...(prev.splitWith || []), roommate]
        : (prev.splitWith || []).filter(r => r !== roommate)
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
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-md border-b border-orange-200 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mystic Zone</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.name}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/monthly-summary">
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Monthly Summary
                </Button>
              </Link>
              <Link to="/budget">
                <Button variant="outline" size="sm">
                  <PieChart className="w-4 h-4 mr-2" />
                  50/30/20 Budget
                </Button>
              </Link>
              <Link to="/insights">
                <Button variant="outline" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Insights
                </Button>
              </Link>
              {user?.isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Badge variant="outline" className="text-sm">
                <Users className="w-3 h-3 mr-1" />
                {roommates.length} Roommates
              </Badge>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-6">
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
          <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-md">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
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
                                {roommates.map(roommate => (
                                  <SelectItem key={roommate} value={roommate}>{roommate}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Split with roommates</Label>
                            <div className="space-y-3 mt-2">
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
                              
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {roommates.filter(r => r !== "You").map(roommate => (
                                  <div key={roommate} className="flex items-center space-x-2 p-2 border rounded">
                                    <Checkbox
                                      id={`split-${roommate}`}
                                      checked={newExpense.splitWith?.includes(roommate)}
                                      onCheckedChange={(checked) => handleSplitWithChange(roommate, checked as boolean)}
                                    />
                                    <Label 
                                      htmlFor={`split-${roommate}`} 
                                      className="text-sm flex-1"
                                      title={roommate}
                                    >
                                      {roommate}
                                    </Label>
                                    {useCustomSplit && newExpense.splitWith?.includes(roommate) && (
                                      <div className="flex items-center space-x-1">
                                        <span className="text-xs">₹</span>
                                        <Input
                                          type="number"
                                          placeholder="Amount"
                                          value={customSplitAmounts[roommate] || ''}
                                          onChange={(e) => setCustomSplitAmounts(prev => ({
                                            ...prev,
                                            [roommate]: Number(e.target.value) || 0
                                          }))}
                                          className="w-20 h-8 text-xs"
                                        />
                                      </div>
                                    )}
                                    {!useCustomSplit && newExpense.splitWith?.includes(roommate) && newExpense.amount > 0 && (
                                      <span className="text-xs text-gray-500">
                                        ₹{(newExpense.amount / ((newExpense.splitWith?.length || 0) + 1)).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {roommates.filter(r => r !== "You").length === 0 && (
                                  <p className="text-sm text-gray-500 italic">No roommates added yet</p>
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
                                <div key={index} className="flex items-center space-x-2 p-2 border rounded">
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
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Expenses */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
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
                          <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-500'}`} />
                              <div>
                                <p className="font-medium text-sm">{expense.description}</p>
                                <p className="text-xs text-gray-600">{expense.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{expense.amount.toLocaleString()}</p>
                              <p className="text-xs text-gray-600">{expense.paidBy}</p>
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
            </div>

            {/* Category Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
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
                              <p className="font-medium">{expense.description}</p>
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
                          <div className="text-right">
                            <p className="font-semibold text-lg">₹{expense.amount.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">by {expense.paidBy}</p>
                            {expense.splitWith && expense.splitWith.length > 0 && expense.splitDetails && (
                              <p className="text-xs text-blue-600">
                                You owe: ₹{expense.splitDetails.amountPerPerson.toFixed(2)}
                              </p>
                            )}
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
                          <p className="font-medium">{income.description}</p>
                          <p className="text-sm text-gray-600">{income.source} • {new Date(income.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-green-600">+₹{income.amount.toLocaleString()}</p>
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

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Spending Analytics</CardTitle>
                <CardDescription>Insights into your spending patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Total Spent</p>
                      <p className="text-2xl font-bold text-blue-900">₹{analyticsData.summary.total.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Transactions</p>
                      <p className="text-2xl font-bold text-green-900">{analyticsData.summary.count}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Average</p>
                      <p className="text-2xl font-bold text-purple-900">₹{Math.round(analyticsData.summary.average).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-600 font-medium">Change</p>
                      <p className={`text-2xl font-bold ${analyticsData.summary.change >= 0 ? 'text-red-900' : 'text-green-900'}`}>
                        {analyticsData.summary.change >= 0 ? '+' : ''}{analyticsData.summary.change.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No analytics data available</p>
                    <p className="text-sm">Add some expenses to see insights</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
