import React, { useState, useEffect } from 'react';
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
import type { Expense } from '@shared/api';

interface SplitBalance {
  participant: string;
  amount: number;
  isOwed: boolean; // true if they owe you, false if you owe them
}

export function SplitExpensesSummary() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [splitBalances, setSplitBalances] = useState<SplitBalance[]>([]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (expenses.length > 0 && user) {
      calculateSplitBalances();
    }
  }, [expenses, user]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getExpenses();
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const calculateSplitBalances = () => {
    if (!user) return;

    const balanceMap = new Map<string, number>();

    expenses.forEach(expense => {
      if (!expense.splitDetails || expense.splitDetails.totalParticipants <= 1) return;

      const currentUserPayment = expense.splitDetails.payments.find(p => p.participant === user.name);
      if (!currentUserPayment && expense.paidBy !== user.name) return;

      expense.splitDetails.payments.forEach(payment => {
        if (payment.participant === user.name) return;

        // If current user paid the expense
        if (expense.paidBy === user.name) {
          // Others owe the current user, but only if not paid yet
          if (!payment.isPaid) {
            const amountOwed = payment.amount;
            balanceMap.set(payment.participant, (balanceMap.get(payment.participant) || 0) + amountOwed);
          }
        } 
        // If someone else paid the expense and current user has a payment
        else if (expense.paidBy === payment.participant && currentUserPayment) {
          // Current user owes this participant, but only if not paid yet
          if (!currentUserPayment.isPaid) {
            const amountOwing = currentUserPayment.amount;
            balanceMap.set(payment.participant, (balanceMap.get(payment.participant) || 0) - amountOwing);
          }
        }
      });
    });

    const balances: SplitBalance[] = Array.from(balanceMap.entries())
      .filter(([_, amount]) => Math.abs(amount) > 0)
      .map(([participant, amount]) => ({
        participant,
        amount: Math.abs(amount),
        isOwed: amount > 0
      }))
      .sort((a, b) => b.amount - a.amount);

    setSplitBalances(balances);
  };

  const totalOwed = splitBalances
    .filter(b => b.isOwed)
    .reduce((sum, b) => sum + b.amount, 0);

  const totalOwing = splitBalances
    .filter(b => !b.isOwed)
    .reduce((sum, b) => sum + b.amount, 0);

  const netBalance = totalOwed - totalOwing;

  const recentSplitExpenses = expenses
    .filter(expense => 
      expense.splitDetails && 
      expense.splitDetails.totalParticipants > 1 &&
      (expense.splitDetails.payments.some(p => p.participant === user?.email) || expense.paidBy === user?.name)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border dark:border-green-800/30">
            <div className="flex items-center justify-center mb-1">
              <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              ₹{totalOwed.toLocaleString()}
            </div>
            <div className="text-xs text-green-600/80 dark:text-green-400/80">You'll Receive</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border dark:border-red-800/30">
            <div className="flex items-center justify-center mb-1">
              <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              ₹{totalOwing.toLocaleString()}
            </div>
            <div className="text-xs text-red-600/80 dark:text-red-400/80">You Owe</div>
          </div>
          
          <div className={`text-center p-3 rounded-lg border ${
            netBalance >= 0 
              ? 'bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/30' 
              : 'bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800/30'
          }`}>
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className={`h-4 w-4 ${
                netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
              }`} />
            </div>
            <div className={`text-lg font-bold ${
              netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
            }`}>
              ₹{Math.abs(netBalance).toLocaleString()}
            </div>
            <div className={`text-xs ${
              netBalance >= 0 ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-orange-600/80 dark:text-orange-400/80'
            }`}>
              Net {netBalance >= 0 ? 'Gain' : 'Loss'}
            </div>
          </div>
        </div>

        {/* Split Balances */}
        {splitBalances.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Outstanding Balances
            </h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {splitBalances.map((balance, index) => (
                  <div key={`balance-${balance.participant}-${balance.amount}-${balance.isOwed}`} className={`flex items-center justify-between p-2 rounded text-sm border ${
                    balance.isOwed 
                      ? 'bg-green-50 dark:bg-green-900/20 dark:border-green-800/30' 
                      : 'bg-red-50 dark:bg-red-900/20 dark:border-red-800/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      {balance.isOwed ? (
                        <ArrowDownLeft className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 text-red-600 dark:text-red-400" />
                      )}
                      <span className="font-medium">{balance.participant}</span>
                    </div>
                    <Badge 
                      variant={balance.isOwed ? "secondary" : "destructive"} 
                      className="text-xs"
                    >
                      ₹{balance.amount.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Recent Split Expenses */}
        {recentSplitExpenses.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Recent Split Expenses
            </h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {recentSplitExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{expense.description}</div>
                      <div className="text-xs text-muted-foreground dark:text-gray-300">
                        Paid by <span className="font-semibold text-gray-800 dark:text-gray-200">{expense.paidBy}</span> • {expense.splitDetails?.totalParticipants} people • {new Date(expense.date).toLocaleDateString()}
                        {expense.splitDetails?.payments.map((p, idx) => {
                          const isPaid = p.isPaid;
                          return (
                            <span key={p.participant} className="ml-2">
                              <span className={`font-semibold ${isPaid ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                {p.participant}
                                {isPaid && ' ✓'}
                              </span>
                              {idx < (expense.splitDetails?.payments.length || 0) - 1 ? ',' : ''}
                            </span>
                          );
                        })}
                      </div>
                      {expense.splitDetails?.payments.some(p => p.isPaid) && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          {expense.splitDetails.payments.filter(p => p.isPaid).length} of {expense.splitDetails.payments.length} payments settled
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-gray-100">₹{expense.amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        Your share: <span className="font-semibold text-gray-800 dark:text-gray-200">₹{(
                          expense.splitDetails?.payments.find(p => p.participant === user?.email)?.amount || 
                          expense.splitDetails?.amountPerPerson || 0
                        ).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
