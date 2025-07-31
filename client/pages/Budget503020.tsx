import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle, CheckCircle, TrendingDown, Target, DollarSign } from 'lucide-react';

interface Budget503020Data {
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

export default function Budget503020() {
  const [budgetData, setBudgetData] = useState<Budget503020Data | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetData();
  }, [selectedMonth, selectedYear]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/budget/503020?month=${selectedMonth}&year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setBudgetData(result.data);
      }
    } catch (error) {
      console.error('Error fetching 50/30/20 budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'exceeded':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'exceeded':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const chartData = budgetData ? [
    {
      name: 'Needs (50%)',
      value: budgetData.needs.spentAmount,
      budget: budgetData.needs.budgetAmount,
      color: '#ef4444'
    },
    {
      name: 'Wants (30%)',
      value: budgetData.wants.spentAmount,
      budget: budgetData.wants.budgetAmount,
      color: '#f97316'
    },
    {
      name: 'Savings (20%)',
      value: budgetData.savings.actualSavings,
      budget: budgetData.savings.budgetAmount,
      color: '#22c55e'
    }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!budgetData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No budget data available for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">50/30/20 Budget</h1>
          <p className="text-gray-600">Track your spending according to the 50/30/20 rule</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={`month-${i}`} value={i.toString()}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={`year-${year}`} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold">₹{budgetData.totalIncome.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Needs Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Needs (50%)
                {getStatusIcon(budgetData.needs.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>₹{budgetData.needs.spentAmount.toLocaleString()}</span>
                  <span className="text-gray-500">/ ₹{budgetData.needs.budgetAmount.toLocaleString()}</span>
                </div>
                <Progress value={(budgetData.needs.spentAmount / budgetData.needs.budgetAmount) * 100} className="h-2" />
                <Badge className={getStatusColor(budgetData.needs.status)}>
                  {budgetData.needs.percentage.toFixed(1)}% of income
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wants Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Wants (30%)
                {getStatusIcon(budgetData.wants.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>₹{budgetData.wants.spentAmount.toLocaleString()}</span>
                  <span className="text-gray-500">/ ₹{budgetData.wants.budgetAmount.toLocaleString()}</span>
                </div>
                <Progress value={(budgetData.wants.spentAmount / budgetData.wants.budgetAmount) * 100} className="h-2" />
                <Badge className={getStatusColor(budgetData.wants.status)}>
                  {budgetData.wants.percentage.toFixed(1)}% of income
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Savings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Savings (20%)
                {getStatusIcon(budgetData.savings.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>₹{budgetData.savings.actualSavings.toLocaleString()}</span>
                  <span className="text-gray-500">/ ₹{budgetData.savings.budgetAmount.toLocaleString()}</span>
                </div>
                <Progress value={(budgetData.savings.actualSavings / budgetData.savings.budgetAmount) * 100} className="h-2" />
                <Badge className={getStatusColor(budgetData.savings.status)}>
                  {budgetData.savings.percentage.toFixed(1)}% of income
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual</CardTitle>
              <CardDescription>Visual breakdown of your 50/30/20 budget</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Tips to improve your budget</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetData.recommendations.map((recommendation, index) => (
                  <Alert key={`recommendation-${index}`}>
                    <AlertDescription>
                      {recommendation}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Needs Categories</CardTitle>
              <CardDescription>Essential expenses breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetData.needs.categories.map((category, index) => (
                  <div key={`needs-${index}`} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.category}</span>
                    <span className="text-sm text-gray-600">₹{category.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wants Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Wants Categories</CardTitle>
              <CardDescription>Discretionary expenses breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetData.wants.categories.map((category, index) => (
                  <div key={`wants-${index}`} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.category}</span>
                    <span className="text-sm text-gray-600">₹{category.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
