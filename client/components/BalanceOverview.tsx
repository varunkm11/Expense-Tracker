import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Users, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export function BalanceOverview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user balances
  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['userBalances'],
    queryFn: () => apiClient.getUserBalances()
  });

  // Settle payment mutation
  const settlePaymentMutation = useMutation({
    mutationFn: ({ payerEmail, amount }: { payerEmail: string; amount: number }) =>
      apiClient.settlePayment(payerEmail, amount),
    onSuccess: () => {
      toast({ title: 'Payment settled successfully!' });
      queryClient.invalidateQueries({ queryKey: ['userBalances'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error settling payment',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSettlePayment = (payerEmail: string, amount: number) => {
    settlePaymentMutation.mutate({ payerEmail, amount });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading balances...</div>
        </CardContent>
      </Card>
    );
  }

  const balances = balanceData?.balances;
  if (!balances) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">No balance data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                You Are Owed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  {balances.totalOwed.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Money others owe you</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                You Owe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-red-600">
                  {balances.totalOwing.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Money you owe others</p>
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
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Net Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                <IndianRupee className={`w-5 h-5 ${balances.netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-2xl font-bold ${balances.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(balances.netBalance).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {balances.netBalance >= 0 ? 'Overall, you are owed' : 'Overall, you owe'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Individual Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Individual Balances
          </CardTitle>
          <CardDescription>
            Your financial relationships with roommates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(balances.balances).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">All settled up!</p>
              <p className="text-sm">No outstanding balances with anyone</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(balances.balances).map(([email, amount], index) => (
                <motion.div
                  key={email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {amount > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{email}</p>
                      <p className="text-sm text-gray-500">
                        {amount > 0 ? 'Owes you' : 'You owe'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <IndianRupee className={`w-4 h-4 ${amount > 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-lg font-bold ${amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(amount).toLocaleString()}
                        </span>
                      </div>
                      {amount > 0 ? (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSettlePayment(email, Math.abs(amount))}
                          disabled={settlePaymentMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
