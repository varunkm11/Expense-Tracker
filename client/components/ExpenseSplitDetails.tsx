import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Clock, DollarSign, Users } from "lucide-react";
import type { Expense } from "@shared/api";

interface ExpenseSplitDetailsProps {
  expense: Expense;
}

export function ExpenseSplitDetails({ expense }: ExpenseSplitDetailsProps) {
  const queryClient = useQueryClient();

  const markSplitPaidMutation = useMutation({
    mutationFn: ({ participant }: { participant: string; notes?: string }) =>
      apiClient.markPaymentPaid(expense.id, participant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      toast.success('Payment marked as paid and balances updated');
    },
    onError: () => {
      toast.error('Failed to mark payment as paid');
    }
  });

  const markNonRoommatePaidMutation = useMutation({
    mutationFn: (noteIndex: number) =>
      apiClient.markNonRoommatePaymentPaid(expense.id, noteIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Payment marked as paid');
    },
    onError: () => {
      toast.error('Failed to mark payment as paid');
    }
  });

  const handleMarkSplitPaid = (participant: string) => {
    markSplitPaidMutation.mutate({ 
      participant
    });
  };

  const handleMarkNonRoommatePaid = (noteIndex: number) => {
    markNonRoommatePaidMutation.mutate(noteIndex);
  };

  const hasValidSplit = expense.splitWith && expense.splitWith.length > 0;
  const hasNonRoommateNotes = expense.nonRoommateNotes && expense.nonRoommateNotes.length > 0;

  if (!hasValidSplit && !hasNonRoommateNotes) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Expense Split Details
        </CardTitle>
        <CardDescription>
          Track payments from roommates and others
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Roommate Split Details */}
        {hasValidSplit && expense.splitDetails && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">Roommate Split</span>
              <Badge variant="outline">
                {expense.splitDetails.totalParticipants} people
              </Badge>
              <Badge variant="secondary">
                ₹{expense.splitDetails.amountPerPerson.toFixed(2)} each
              </Badge>
            </div>
            
            {/* Summary of who paid */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    <strong>{expense.paidBy}</strong> paid ₹{expense.amount.toLocaleString()} total
                  </p>
                  <p className="text-xs text-blue-600">
                    Split among {expense.splitDetails.totalParticipants} people: {expense.paidBy}, {expense.splitWith.join(', ')}
                  </p>
                </div>
                <Badge variant="outline" className="bg-white">
                  ₹{expense.splitDetails.amountPerPerson.toFixed(2)} each
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              {expense.splitDetails.payments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.participant}</span>
                      <span className="text-sm text-gray-500">
                        Owes ₹{payment.amount ? payment.amount.toFixed(2) : expense.splitDetails!.amountPerPerson.toFixed(2)} to {expense.paidBy}
                      </span>
                    </div>
                    {payment.isPaid ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  
                  {!payment.isPaid && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkSplitPaid(payment.participant)}
                      disabled={markSplitPaidMutation.isPending}
                    >
                      Mark Paid
                    </Button>
                  )}
                  
                  {payment.isPaid && payment.paidAt && (
                    <div className="text-xs text-gray-500">
                      Paid on {new Date(payment.paidAt).toLocaleDateString()}
                      {payment.notes && (
                        <div className="text-xs mt-1 italic">"{payment.notes}"</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {hasValidSplit && hasNonRoommateNotes && <Separator />}

        {/* Non-Roommate Notes */}
        {hasNonRoommateNotes && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" />
              <span className="font-medium">Non-Roommate Expenses</span>
            </div>
            
            <div className="space-y-3">
              {expense.nonRoommateNotes!.map((note, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{note.person}</span>
                      <Badge variant="secondary">₹{note.amount}</Badge>
                    </div>
                    <span className="text-sm text-gray-600">{note.description}</span>
                    {note.isPaid ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 w-fit">
                        <Check className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 w-fit">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  
                  {!note.isPaid && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkNonRoommatePaid(index)}
                      disabled={markNonRoommatePaidMutation.isPending}
                    >
                      Mark Paid
                    </Button>
                  )}
                  
                  {note.isPaid && note.paidAt && (
                    <div className="text-xs text-gray-500">
                      Paid on {new Date(note.paidAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
