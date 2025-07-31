import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PDFGenerator } from "@/lib/pdf-generator";
import { toast } from "sonner";
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  FileDown,
  Loader2
} from "lucide-react";

export default function MonthlySummary() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { data: summaryData, isLoading, error } = useQuery({
    queryKey: ['monthly-summary', selectedMonth, selectedYear],
    queryFn: () => apiClient.getMonthlySummary(selectedMonth, selectedYear),
    enabled: true
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['expense-analytics', 'month'],
    queryFn: () => apiClient.getExpenseAnalytics('month')
  });

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleDownloadPDF = async () => {
    if (!summaryData?.data) {
      toast.error('No data available to generate PDF');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const pdfGenerator = new PDFGenerator();
      pdfGenerator.generateMonthlySummaryPDF(summaryData.data);
      
      const filename = `Monthly_Summary_${summaryData.data.period.month.replace(' ', '_')}.pdf`;
      pdfGenerator.save(filename);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading monthly summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load monthly summary</p>
          <p className="text-gray-600 text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const data = summaryData?.data;
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available for the selected month</p>
        </div>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthName = `${monthNames[selectedMonth]} ${selectedYear}`;
  const expenseChange = data.previousMonth.expenses > 0 
    ? ((data.totals.expenses - data.previousMonth.expenses) / data.previousMonth.expenses) * 100 
    : 0;

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
              <Button variant="ghost" size="sm" className="p-2" asChild>
                <a href="/">
                  <ChevronLeft className="w-4 h-4" />
                </a>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Monthly Summary</h1>
                <p className="text-sm text-gray-600">Detailed insights for {currentMonthName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Badge variant="secondary" className="px-4 py-2">
                <Calendar className="w-3 h-3 mr-1" />
                {currentMonthName}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-orange-400 to-amber-500"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-6">
        {/* Summary Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-green-800">
                <span>Total Income</span>
                <TrendingUp className="w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">₹{data.totals.income.toLocaleString()}</div>
              <p className="text-green-700 text-sm mt-1">
                {data.previousMonth.income > 0 
                  ? `${((data.totals.income - data.previousMonth.income) / data.previousMonth.income * 100).toFixed(1)}% from last month`
                  : 'No previous data'
                }
              </p>
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
              <div className="text-3xl font-bold text-red-900">₹{data.totals.expenses.toLocaleString()}</div>
              <p className={`text-sm mt-1 ${expenseChange > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-blue-800">
                <span>Savings</span>
                <Target className="w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">₹{data.totals.savings.toLocaleString()}</div>
              <p className="text-blue-700 text-sm mt-1">{data.totals.savingsRate.toFixed(1)}% savings rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-purple-800">
                <span>Avg. Daily Spend</span>
                <Award className="w-5 h-5" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">₹{Math.round(data.totals.expenses / 30).toLocaleString()}</div>
              <p className="text-purple-700 text-sm mt-1">Daily average</p>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-md">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            {/* Daily Spending Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Daily Spending Trend</CardTitle>
                  <CardDescription>Your spending pattern throughout the month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.dailySpending}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="_id" 
                          tick={{ fontSize: 12 }}
                          tickLine={{ stroke: '#e5e7eb' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={{ stroke: '#e5e7eb' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']} />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          stroke="#f97316" 
                          strokeWidth={2}
                          dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            {/* Category Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>Where your money went this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.categoryExpenses.map((category, index) => {
                      const percentage = (category.total / data.totals.expenses) * 100;
                      return (
                        <div key={category._id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-full bg-orange-500" />
                            <span className="font-medium">{category._id}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-32">
                              <Progress value={percentage} className="h-2" />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {percentage.toFixed(1)}%
                            </span>
                            <span className="font-semibold w-24 text-right">
                              ₹{category.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            {/* Budget Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Budget Performance</CardTitle>
                  <CardDescription>How well you stayed within your budgets</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.budgets.length > 0 ? (
                    <div className="space-y-4">
                      {data.budgets.map((budget) => {
                        const progress = budget.progress || 0;
                        const status = budget.status || 'safe';
                        const statusColors = {
                          safe: 'text-green-600',
                          caution: 'text-yellow-600',
                          warning: 'text-orange-600',
                          exceeded: 'text-red-600'
                        };

                        return (
                          <div key={budget.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{budget.category}</span>
                              <Badge variant={status === 'exceeded' ? 'destructive' : 'secondary'}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>₹{budget.spent.toLocaleString()} of ₹{budget.limit.toLocaleString()}</span>
                                <span className={statusColors[status as keyof typeof statusColors]}>
                                  {progress.toFixed(1)}%
                                </span>
                              </div>
                              <Progress 
                                value={Math.min(progress, 100)} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No budgets set for this month</p>
                      <p className="text-sm text-gray-500">Create budgets to track your spending goals</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Financial Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Financial Insights</CardTitle>
                  <CardDescription>AI-powered insights based on your spending patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm text-blue-800">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Sample data for demonstration
const monthlyData = [
  { month: 'Jan', income: 50000, expenses: 35000, savings: 15000 },
  { month: 'Feb', income: 52000, expenses: 38000, savings: 14000 },
  { month: 'Mar', income: 50000, expenses: 42000, savings: 8000 },
  { month: 'Apr', income: 55000, expenses: 40000, savings: 15000 },
  { month: 'May', income: 50000, expenses: 37000, savings: 13000 },
  { month: 'Jun', income: 50000, expenses: 36000, savings: 14000 },
];

const categoryTrends = [
  { category: 'Food & Dining', current: 8500, previous: 7200, budget: 10000 },
  { category: 'Transportation', current: 3200, previous: 2800, budget: 4000 },
  { category: 'Shopping', current: 5600, previous: 6200, budget: 6000 },
  { category: 'Entertainment', current: 2800, previous: 3200, budget: 3500 },
  { category: 'Bills & Utilities', current: 4200, previous: 4000, budget: 4500 },
];

const dailyExpenses = [
  { day: '1', amount: 450 },
  { day: '5', amount: 1200 },
  { day: '8', amount: 680 },
  { day: '12', amount: 2100 },
  { day: '15', amount: 890 },
  { day: '18', amount: 1450 },
  { day: '22', amount: 760 },
  { day: '25', amount: 980 },
  { day: '28', amount: 1350 },
];
