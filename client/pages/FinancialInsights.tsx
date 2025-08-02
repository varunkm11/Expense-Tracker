import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NavigationBar } from "@/components/NavigationBar";
import { RefreshCw, TrendingUp, TrendingDown, Target, Star, AlertTriangle, Lightbulb, Trophy } from 'lucide-react';

interface FinancialInsight {
  type: 'motivation' | 'warning' | 'tip' | 'achievement';
  title: string;
  message: string;
  actionable?: string;
}

interface InsightsData {
  insights: FinancialInsight[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    savingsRate: number;
    topSpendingCategory: string;
  };
  dailyMotivation: string;
}

export default function FinancialInsights() {
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const isRefresh = !loading;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/insights/financial', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setInsightsData(result.data);
      }
    } catch (error) {
      console.error('Error fetching financial insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'motivation':
        return <Star className="h-5 w-5 text-purple-500" />;
      default:
        return <Target className="h-5 w-5 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'border-yellow-200 bg-yellow-50';
      case 'warning':
        return 'border-red-200 bg-red-50';
      case 'tip':
        return 'border-blue-200 bg-blue-50';
      case 'motivation':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'bg-yellow-100 text-yellow-800';
      case 'warning':
        return 'bg-red-100 text-red-800';
      case 'tip':
        return 'bg-blue-100 text-blue-800';
      case 'motivation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!insightsData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No insights available. Please check back later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <NavigationBar />
      <div className="container mx-auto px-4 py-6 pt-20">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Financial Insights</h1>
              <p className="text-gray-600 dark:text-gray-300">AI-powered analysis of your spending patterns</p>
            </div>
            
            <Button 
              onClick={fetchInsights} 
              disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Insights
        </Button>
      </div>

      {/* Daily Motivation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-gradient bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-orange-500" />
              Daily Motivation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-gray-800">{insightsData.dailyMotivation}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold">₹{insightsData.summary.totalIncome.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-2xl font-bold">₹{insightsData.summary.totalExpenses.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Savings Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">{insightsData.summary.savingsRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Top Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Badge variant="secondary" className="text-sm">
                  {insightsData.summary.topSpendingCategory}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insightsData.insights.map((insight, index) => (
          <motion.div
            key={`insight-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <Card className={`${getInsightColor(insight.type)} border`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    {insight.title}
                  </div>
                  <Badge className={getBadgeColor(insight.type)}>
                    {insight.type}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">{insight.message}</p>
                {insight.actionable && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Action:</strong> {insight.actionable}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Additional Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Financial Health Tips</CardTitle>
            <CardDescription>General advice for better money management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">🎯 Budgeting</h4>
                <p className="text-sm text-gray-600">Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">💰 Emergency Fund</h4>
                <p className="text-sm text-gray-600">Aim for 3-6 months of expenses in emergency savings</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">📊 Track Everything</h4>
                <p className="text-sm text-gray-600">Regular expense tracking helps identify spending patterns</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">🔄 Review Monthly</h4>
                <p className="text-sm text-gray-600">Monthly financial reviews help you stay on track</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
        </div>
      </div>
    </div>
  );
}
