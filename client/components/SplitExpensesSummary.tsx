import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  IndianRupee
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from "@tanstack/react-query";
import type { Expense } from '@shared/api';

interface SplitBalance {
  participant: string;
  amount: number;
  isOwed: boolean; // true if they owe you, false if you owe them
}

export function SplitExpensesSummary() {
  const { user } = useAuth();
  const { data, isLoading: loading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => apiClient.getExpenses({ limit: 50 }),
    staleTime: 1000 * 60, // 1 minute
  });
  const expenses = data?.data || [];

  // Calculate split balances using useMemo for performance

  // Calculate 'You'll Receive' (totalOwed) robustly

  // List of unpaid amounts owed to you, per split expense
  const youWillReceiveList = useMemo(() => {
    if (!user) return [];
    const result: { description: string; amount: number; from: string }[] = [];
    const userIdentifiers = [user.email, user.name, 'you'].map(v => v.trim().toLowerCase());
    expenses.forEach(expense => {
      if (!expense.splitDetails || expense.splitDetails.totalParticipants <= 1) return;
      // Consider user as payer if paidBy matches email, name, or 'you' (case-insensitive)
      const paidByNormalized = (expense.paidBy || '').trim().toLowerCase();
      const isUserPayer = userIdentifiers.includes(paidByNormalized);
      if (isUserPayer) {
        expense.splitDetails.payments.forEach(payment => {
          const participantNormalized = (payment.participant || '').trim().toLowerCase();
          const isNotUser = !userIdentifiers.includes(participantNormalized);
          if (isNotUser && !payment.isPaid) {
            result.push({ description: expense.description, amount: payment.amount, from: payment.participant });
          }
        });
      }
    });
    return result;
  }, [expenses, user]);

  const totalOwed = youWillReceiveList.reduce((sum, item) => sum + item.amount, 0);

  // Calculate 'You Owe' (totalOwing) robustly
  const totalOwing = useMemo(() => {
    if (!user) return 0;
    let sum = 0;
    expenses.forEach(expense => {
      if (!expense.splitDetails || expense.splitDetails.totalParticipants <= 1) return;
      if (expense.paidBy !== user.email && expense.paidBy !== user.name) {
        const myPayment = expense.splitDetails.payments.find(p => p.participant === user.email || p.participant === user.name);
        if (myPayment && !myPayment.isPaid) {
          sum += myPayment.amount;
        }
      }
    });
    return sum;
  }, [expenses, user]);

  const netBalance = totalOwed - totalOwing;

  const recentSplitExpenses = useMemo(() => {
    return expenses
      .filter(expense => 
        expense.splitDetails && 
        expense.splitDetails.totalParticipants > 1 &&
        (expense.splitDetails.payments.some(p => p.participant === user?.email) || expense.paidBy === user?.name)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expenses, user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Split Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Split Expenses Summary
        </CardTitle>
        <CardDescription>
          Your split expense balance and recent activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
  {/* Balance Summary */}
        <div className="grid grid-cols-3 gap-3">

          <div className="text-center p-3 bg-green-50 rounded-lg border">
            <div className="flex items-center justify-center mb-1">
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">
              ₹{totalOwed.toLocaleString()}
            </div>
            <div className="text-xs text-green-600/80">You'll Receive</div>
            {/* No breakdown, only total shown */}
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg border">
            <div className="flex items-center justify-center mb-1">
              <ArrowUpRight className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-lg font-bold text-red-600">
              ₹{totalOwing.toLocaleString()}
            </div>
            <div className="text-xs text-red-600/80">You Owe</div>
          </div>
          
          <div className={`text-center p-3 rounded-lg border ${
            netBalance >= 0 
              ? 'bg-blue-50 border-blue-200'
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className={`h-4 w-4 ${
                netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`} />
            </div>
            <div className={`text-lg font-bold ${
              netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              ₹{Math.abs(netBalance).toLocaleString()}
            </div>
            <div className={`text-xs ${
              netBalance >= 0 ? 'text-blue-600/80' : 'text-orange-600/80'
            }`}>
              Net {netBalance >= 0 ? 'Gain' : 'Loss'}
            </div>
          </div>
        </div>



        {/* Minimalist Recent Split Expenses */}
        {recentSplitExpenses.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Recent Split History
            </h4>
            <ScrollArea className="h-32">
              <ul className="space-y-1">
                {recentSplitExpenses.map((expense) => {
                  const settled = expense.splitDetails?.payments.every(p => p.isPaid);
                  return (
                    <li key={expense.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition text-xs border border-transparent">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{expense.description}</span>
                        <span className="text-gray-500 dark:text-gray-400">{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">₹{expense.amount.toLocaleString()}</span>
                        {settled ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle className="h-3 w-3" />Settled</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400"><AlertTriangle className="h-3 w-3" />Pending</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>
        )}

  {totalOwed === 0 && totalOwing === 0 && recentSplitExpenses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No split expenses found</p>
            <p className="text-xs">Start splitting expenses with roommates!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
