import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";

export function ClearDataButtons() {
  const queryClient = useQueryClient();
  const [isAllDialogOpen, setIsAllDialogOpen] = useState(false);

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.clearAll();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("All data cleared successfully!");
      setIsAllDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to clear data");
    }
  });

  return (
    <div className="space-y-2">
      {/* Clear All Data */}
      <Dialog open={isAllDialogOpen} onOpenChange={setIsAllDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Clear All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete ALL your data including expenses, income, and balances. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
            >
              {clearAllMutation.isPending ? "Clearing..." : "Clear All Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
