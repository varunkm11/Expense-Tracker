import { Response } from 'express';
import { Income } from '../models/Income';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const incomeSchema = z.object({
  amount: z.number().positive(),
  source: z.string().min(1),
  description: z.string().min(1),
  date: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().positive(),
    endDate: z.string().optional()
  }).optional(),
  taxable: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

export const createIncome = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = incomeSchema.parse(req.body);
    const userId = req.user!._id;

    const income = new Income({
      ...validatedData,
      userId,
      date: validatedData.date ? new Date(validatedData.date) : new Date(),
      tags: validatedData.tags || []
    });

    await income.save();

    res.status(201).json({
      message: 'Income created successfully',
      income
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getIncomes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { 
      page = 1, 
      limit = 20, 
      source, 
      startDate, 
      endDate, 
      tags,
      search 
    } = req.query;

    const query: any = { userId };

    if (source) query.source = source;
    if (tags) query.tags = { $in: (tags as string).split(',') };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } }
      ];
    }

    const incomes = await Income.find(query)
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Income.countDocuments(query);

    res.json({
      data: incomes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateIncome = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    
    const income = await Income.findOne({ _id: id, userId });
    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    const validatedData = incomeSchema.partial().parse(req.body);
    
    Object.assign(income, validatedData);
    if (validatedData.date) income.date = new Date(validatedData.date);
    
    await income.save();

    res.json({
      message: 'Income updated successfully',
      income
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteIncome = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    
    const income = await Income.findOne({ _id: id, userId });
    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    await Income.findByIdAndDelete(id);

    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
