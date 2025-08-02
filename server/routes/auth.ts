import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../middleware/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  adminCode: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const register = async (req: Request, res: Response) => {
  console.log('Register endpoint called:', req.method, req.body);
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Check if admin code is provided and valid
    const isAdmin = validatedData.adminCode === 'EXPENSE_ADMIN_2024';

    // Create new user without automatic roommate addition
    const user = new User({
      ...validatedData,
      isAdmin,
      roommates: [], // Start with empty roommates list
      friendRequests: { sent: [], received: [] } // Initialize friend requests
    });
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        roommates: user.roommates || [],
        preferences: user.preferences
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Find user
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(validatedData.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        roommates: user.roommates || [],
        preferences: user.preferences
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        roommates: user.roommates || [],
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, preferences, avatar } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { 
        ...(name && { name }),
        ...(preferences && { preferences: { ...user.preferences, ...preferences } }),
        ...(avatar && { avatar })
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Roommate management functions
export const addRoommate = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Roommate name is required' });
    }

    const trimmedName = name.trim();

    // Check if roommate already exists
    if (user.roommates.includes(trimmedName)) {
      return res.status(400).json({ error: 'Roommate already exists' });
    }

    // Add roommate
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $push: { roommates: trimmedName } },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Roommate added successfully',
      roommates: updatedUser?.roommates || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeRoommate = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Roommate name is required' });
    }

    // Remove roommate
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $pull: { roommates: name } },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Roommate removed successfully',
      roommates: updatedUser?.roommates || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRoommateName = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { oldName, newName } = req.body;

    if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string') {
      return res.status(400).json({ error: 'Both old and new roommate names are required' });
    }

    const trimmedNewName = newName.trim();

    if (trimmedNewName.length === 0) {
      return res.status(400).json({ error: 'New roommate name cannot be empty' });
    }

    // Check if old roommate exists
    if (!user.roommates.includes(oldName)) {
      return res.status(404).json({ error: 'Roommate not found' });
    }

    // Check if new name already exists
    if (user.roommates.includes(trimmedNewName) && oldName !== trimmedNewName) {
      return res.status(400).json({ error: 'A roommate with this name already exists' });
    }

    // Update roommate name
    const roommates = user.roommates.map((roommate: string) => 
      roommate === oldName ? trimmedNewName : roommate
    );

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { roommates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Roommate name updated successfully',
      roommates: updatedUser?.roommates || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search for users to send friend requests
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Find users matching the search query (name or email)
    const users = await User.find({
      $and: [
        { _id: { $ne: user._id } }, // Exclude current user
        { email: { $nin: user.roommates } }, // Exclude existing roommates
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email').limit(10);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send friend request
export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { targetEmail } = req.body;

    if (!targetEmail || typeof targetEmail !== 'string') {
      return res.status(400).json({ error: 'Target user email is required' });
    }

    // Find target user
    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already roommates
    if (user.roommates.includes(targetEmail)) {
      return res.status(400).json({ error: 'Already roommates with this user' });
    }

    // Check if request already sent
    if (user.friendRequests?.sent?.includes(targetEmail)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Check if request already received from this user
    if (user.friendRequests?.received?.includes(targetEmail)) {
      return res.status(400).json({ error: 'This user has already sent you a friend request' });
    }

    // Add to sender's sent list
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { 'friendRequests.sent': targetEmail }
    });

    // Add to receiver's received list
    await User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { 'friendRequests.received': user.email }
    });

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { senderEmail } = req.body;

    if (!senderEmail || typeof senderEmail !== 'string') {
      return res.status(400).json({ error: 'Sender email is required' });
    }

    // Check if request exists
    if (!user.friendRequests?.received?.includes(senderEmail)) {
      return res.status(400).json({ error: 'Friend request not found' });
    }

    // Find sender user
    const senderUser = await User.findOne({ email: senderEmail });
    if (!senderUser) {
      return res.status(404).json({ error: 'Sender user not found' });
    }

    // Add each other as roommates
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { roommates: senderEmail },
      $pull: { 'friendRequests.received': senderEmail }
    });

    await User.findByIdAndUpdate(senderUser._id, {
      $addToSet: { roommates: user.email },
      $pull: { 'friendRequests.sent': user.email }
    });

    res.json({ message: 'Friend request accepted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { senderEmail } = req.body;

    if (!senderEmail || typeof senderEmail !== 'string') {
      return res.status(400).json({ error: 'Sender email is required' });
    }

    // Find sender user
    const senderUser = await User.findOne({ email: senderEmail });
    if (!senderUser) {
      return res.status(404).json({ error: 'Sender user not found' });
    }

    // Remove from both users' friend request lists
    await User.findByIdAndUpdate(user._id, {
      $pull: { 'friendRequests.received': senderEmail }
    });

    await User.findByIdAndUpdate(senderUser._id, {
      $pull: { 'friendRequests.sent': user.email }
    });

    res.json({ message: 'Friend request rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get friend requests
export const getFriendRequests = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Get received friend requests with user details
    const receivedRequests = await User.find({
      email: { $in: user.friendRequests?.received || [] }
    }).select('name email');

    // Get sent friend requests with user details
    const sentRequests = await User.find({
      email: { $in: user.friendRequests?.sent || [] }
    }).select('name email');

    res.json({
      received: receivedRequests,
      sent: sentRequests
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
