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
  const splitBalances = useMemo(() => {
    if (!user) return [];
    const balanceMap = new Map<string, number>();
    expenses.forEach(expense => {
      if (!expense.splitDetails || expense.splitDetails.totalParticipants <= 1) return;
      // If you are the payer, others owe you (only unpaid)
      if (expense.paidBy === user.email) {
        expense.splitDetails.payments.forEach(payment => {
          if (payment.participant !== user.email && !payment.isPaid) {
            balanceMap.set(payment.participant, (balanceMap.get(payment.participant) || 0) + payment.amount);
          }
        });
      }
      // If you are a participant (not payer), you owe the payer (only unpaid)
      else {
        const myPayment = expense.splitDetails.payments.find(p => p.participant === user.email);
        if (myPayment && !myPayment.isPaid) {
          // If payer is an email, use as is; if payer is a name, try to map to email if possible
          balanceMap.set(expense.paidBy, (balanceMap.get(expense.paidBy) || 0) - myPayment.amount);
        }
      }
    });
    // Remove zero balances
    return Array.from(balanceMap.entries())
      .filter(([_, amount]) => Math.abs(amount) > 0.01)
      .map(([participant, amount]) => ({
        participant,
        amount: Math.abs(amount),
        isOwed: amount > 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, user]);

  const totalOwed = splitBalances.filter(b => b.isOwed).reduce((sum, b) => sum + b.amount, 0);
  const totalOwing = splitBalances.filter(b => !b.isOwed).reduce((sum, b) => sum + b.amount, 0);
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

        {splitBalances.length === 0 && recentSplitExpenses.length === 0 && (
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
