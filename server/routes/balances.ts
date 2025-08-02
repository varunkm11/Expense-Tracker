import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { BalanceManager } from '../utils/BalanceManager';
import { Expense } from '../models/Expense';
import { z } from 'zod';

const settlePaymentSchema = z.object({
  payerEmail: z.string().email(),
  amount: z.number().positive(),
  expenseId: z.string().optional()
});

// Get user's balance summary
export const getUserBalances = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const balanceSummary = await BalanceManager.getUserBalanceSummary(user.email);
    
    res.json({
      balances: balanceSummary
    });
  } catch (error) {
    console.error('Error getting user balances:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get balance between two users
export const getBalanceBetweenUsers = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { otherUserEmail } = req.params;
    
    if (!otherUserEmail) {
      return res.status(400).json({ error: 'Other user email is required' });
    }

    const balance = await BalanceManager.getBalanceBetweenUsers(user.email, otherUserEmail);
    
    res.json({
      balance
    });
  } catch (error) {
    console.error('Error getting balance between users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Settle a payment (when someone pays their share)
export const settlePayment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const validatedData = settlePaymentSchema.parse(req.body);

    // Settle the payment in the balance system
    await BalanceManager.settlePayment(
      validatedData.payerEmail,
      user.email,
      validatedData.amount
    );

    // If expenseId is provided, mark the payment as paid in the expense
    if (validatedData.expenseId) {
      const expense = await Expense.findById(validatedData.expenseId);
      if (expense && expense.splitDetails) {
        const payment = expense.splitDetails.payments.find(p => p.participant === user.email);
        if (payment) {
          payment.isPaid = true;
          payment.paidAt = new Date();
          await expense.save();
        }
      }
    }

    res.json({
      message: 'Payment settled successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    console.error('Error settling payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark split payment as paid (for the expense creator)
export const markSplitPaymentPaid = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { expenseId, participantEmail } = req.body;

    if (!expenseId || !participantEmail) {
      return res.status(400).json({ error: 'Expense ID and participant email are required' });
    }

    const expense = await Expense.findOne({ 
      _id: expenseId, 
      userId: user._id 
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (!expense.splitDetails) {
      return res.status(400).json({ error: 'This expense is not a split expense' });
    }

    // Find the payment for the participant
    const payment = expense.splitDetails.payments.find(p => p.participant === participantEmail);
    if (!payment) {
      return res.status(404).json({ error: 'Participant not found in split expense' });
    }

    // Mark as paid
    payment.isPaid = true;
    payment.paidAt = new Date();
    await expense.save();

    // Update balance system
    await BalanceManager.settlePayment(user.email, participantEmail, payment.amount);

    res.json({
      message: 'Split payment marked as paid',
      expense
    });
  } catch (error) {
    console.error('Error marking split payment as paid:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
