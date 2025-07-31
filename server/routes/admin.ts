import { Response } from 'express';
import { User } from '../models/User';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { AuthRequest } from '../middleware/auth';

// Middleware to check if user is admin
export const requireAdmin = async (req: AuthRequest, res: Response, next: any) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    res.json({
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get system statistics (admin only)
export const getSystemStats = async (req: AuthRequest, res: Response) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get total admins
    const totalAdmins = await User.countDocuments({ isAdmin: true });
    
    // Get total expenses amount
    const expenseStats = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);
    
    // Get total income amount
    const incomeStats = await Income.aggregate([
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$amount' }
        }
      }
    ]);

    const stats = {
      totalUsers,
      totalAdmins,
      totalExpenses: expenseStats[0]?.totalExpenses || 0,
      totalIncome: incomeStats[0]?.totalIncome || 0
    };

    res.json({
      message: 'System stats retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Don't allow admin to delete themselves
    if (userId === req.user!._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Delete user and their data
    await User.findByIdAndDelete(userId);
    await Expense.deleteMany({ userId });
    await Income.deleteMany({ userId });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle user admin status (super admin only)
export const toggleAdminStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;
    
    // Don't allow admin to modify their own status
    if (userId === req.user!._id.toString()) {
      return res.status(400).json({ error: 'Cannot modify your own admin status' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: `User ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully`,
      data: user
    });
  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
