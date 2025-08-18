import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

export function ClearDataButtons() {
  const queryClient = useQueryClient();
  const [isAllDialogOpen, setIsAllDialogOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Generate a simple math captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer = 0;
    let question = "";
    
    switch (operator) {
      case '+':
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        // Ensure positive result
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        answer = larger - smaller;
        question = `${larger} - ${smaller}`;
        break;
      case '*':
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
    }
    
    setCaptchaQuestion(question);
    setCorrectAnswer(answer);
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isAllDialogOpen) {
      setConfirmationText("");
      setCaptchaAnswer("");
      setIsConfirmed(false);
      generateCaptcha();
    }
  }, [isAllDialogOpen]);

  // Check if form is valid
  useEffect(() => {
    const isTextValid = confirmationText.toLowerCase() === "delete all my data";
    const isCaptchaValid = parseInt(captchaAnswer) === correctAnswer;
    setIsConfirmed(isTextValid && isCaptchaValid);
  }, [confirmationText, captchaAnswer, correctAnswer]);

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.clearAll();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("All data cleared successfully!");
      setIsAllDialogOpen(false);
      setConfirmationText("");
      setCaptchaAnswer("");
      setIsConfirmed(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to clear data");
    }
  });

  const handleClearData = () => {
    if (!isConfirmed) {
      toast.error("Please complete both verification steps");
      return;
    }
    clearAllMutation.mutate();
  };

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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Clear All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete ALL your data including expenses, income, and balances. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Confirmation Text */}
            <div className="space-y-2">
              <Label htmlFor="confirmation" className="text-sm font-medium">
                Type <span className="font-mono bg-gray-100 px-1 rounded text-red-600">"delete all my data"</span> to confirm:
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type the confirmation text..."
                className={confirmationText.toLowerCase() === "delete all my data" ? "border-green-500" : ""}
              />
            </div>

            {/* Math Captcha */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="captcha" className="text-sm font-medium">
                  Solve this math problem:
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateCaptcha}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gray-100 p-2 rounded font-mono text-center min-w-[80px]">
                  {captchaQuestion} = ?
                </div>
                <Input
                  id="captcha"
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Answer"
                  className={`w-20 ${parseInt(captchaAnswer) === correctAnswer && captchaAnswer !== "" ? "border-green-500" : ""}`}
                />
              </div>
            </div>

            {/* Verification Status */}
            <div className="text-xs text-gray-600 space-y-1">
              <div className={`flex items-center gap-1 ${confirmationText.toLowerCase() === "delete all my data" ? "text-green-600" : "text-red-600"}`}>
                <div className={`w-2 h-2 rounded-full ${confirmationText.toLowerCase() === "delete all my data" ? "bg-green-500" : "bg-red-500"}`}></div>
                Confirmation text {confirmationText.toLowerCase() === "delete all my data" ? "✓" : "✗"}
              </div>
              <div className={`flex items-center gap-1 ${parseInt(captchaAnswer) === correctAnswer && captchaAnswer !== "" ? "text-green-600" : "text-red-600"}`}>
                <div className={`w-2 h-2 rounded-full ${parseInt(captchaAnswer) === correctAnswer && captchaAnswer !== "" ? "bg-green-500" : "bg-red-500"}`}></div>
                Math problem {parseInt(captchaAnswer) === correctAnswer && captchaAnswer !== "" ? "✓" : "✗"}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearData}
              disabled={clearAllMutation.isPending || !isConfirmed}
            >
              {clearAllMutation.isPending ? "Clearing..." : "Clear All Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
