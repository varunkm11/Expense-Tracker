import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { verifyToken, optionalAuth } from "./middleware/auth";

// Auth routes
import { register, login, getProfile, updateProfile, addRoommate, removeRoommate, updateRoommateName } from "./routes/auth";

// Main feature routes
import { 
  createExpense, 
  getExpenses, 
  updateExpense, 
  deleteExpense, 
  getExpenseAnalytics 
} from "./routes/expenses";

import { 
  createIncome, 
  getIncomes, 
  updateIncome, 
  deleteIncome 
} from "./routes/income";

import { 
  createBudget, 
  getBudgets, 
  updateBudget, 
  deleteBudget, 
  getBudgetAnalytics 
} from "./routes/budgets";

import { 
  generateMonthlySummaryPDF, 
  generateYearlySummary 
} from "./routes/reports";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

export function createServer() {
  const app = express();

  // Connect to MongoDB
  const connectDB = async () => {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker';
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  };

  connectDB();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Authentication routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/profile", verifyToken, getProfile);
  app.put("/api/auth/profile", verifyToken, updateProfile);
  
  // Roommate management routes
  app.post("/api/auth/roommates", verifyToken, addRoommate);
  app.delete("/api/auth/roommates", verifyToken, removeRoommate);
  app.put("/api/auth/roommates", verifyToken, updateRoommateName);

  // Expense routes
  app.post("/api/expenses", verifyToken, createExpense);
  app.get("/api/expenses", verifyToken, getExpenses);
  app.put("/api/expenses/:id", verifyToken, updateExpense);
  app.delete("/api/expenses/:id", verifyToken, deleteExpense);
  app.get("/api/expenses/analytics", verifyToken, getExpenseAnalytics);

  // Income routes
  app.post("/api/income", verifyToken, createIncome);
  app.get("/api/income", verifyToken, getIncomes);
  app.put("/api/income/:id", verifyToken, updateIncome);
  app.delete("/api/income/:id", verifyToken, deleteIncome);

  // Budget routes
  app.post("/api/budgets", verifyToken, createBudget);
  app.get("/api/budgets", verifyToken, getBudgets);
  app.put("/api/budgets/:id", verifyToken, updateBudget);
  app.delete("/api/budgets/:id", verifyToken, deleteBudget);
  app.get("/api/budgets/analytics", verifyToken, getBudgetAnalytics);

  // Report routes
  app.get("/api/reports/monthly", verifyToken, generateMonthlySummaryPDF);
  app.get("/api/reports/yearly", verifyToken, generateYearlySummary);

  // File upload route
  app.post("/api/upload/receipt", verifyToken, upload.single('receipt'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`
      });
    } catch (error) {
      res.status(500).json({ error: 'File upload failed' });
    }
  });

  // Error handling middleware
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
