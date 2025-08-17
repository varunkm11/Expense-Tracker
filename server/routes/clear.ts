import { Router } from 'express';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { UserBalance } from '../models/UserBalance';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// POST /clear-all: Deletes all expenses, incomes, and balances for the authenticated user
router.post('/clear-all', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;
    const userEmail = req.user!.email;

    // Delete all expenses
    await Expense.deleteMany({ userId });
    // Delete all incomes
    await Income.deleteMany({ userId });
    // Delete user balance
    await UserBalance.deleteOne({ userId });

    res.json({ message: 'All expenses, incomes, and balances cleared.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear data.' });
  }
});

// POST /clear-expenses: Deletes only expenses for the authenticated user
router.post('/clear-expenses', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    // Delete all expenses for the user
    const result = await Expense.deleteMany({ userId });

    res.json({ message: `${result.deletedCount} expenses cleared successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear expenses.' });
  }
});

// POST /clear-income: Deletes only income for the authenticated user
router.post('/clear-income', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    // Delete all income for the user
    const result = await Income.deleteMany({ userId });

    res.json({ message: `${result.deletedCount} income records cleared successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear income.' });
  }
});

// POST /clear-balances: Deletes only balances for the authenticated user
router.post('/clear-balances', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!._id;

    // Delete all balances for the user
    const result = await UserBalance.deleteOne({ userId });

    res.json({ 
      message: result.deletedCount > 0 ? 'Balances cleared successfully.' : 'No balances found to clear.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear balances.' });
  }
});

export default router;
