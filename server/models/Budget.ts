import mongoose, { Document, Schema } from 'mongoose';

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  spent: number;
  notifications: {
    at50Percent: boolean;
    at80Percent: boolean;
    atLimit: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Education',
      'Travel',
      'Personal Care',
      'Others',
      'Total'
    ]
  },
  limit: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly', 'yearly']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  notifications: {
    at50Percent: {
      type: Boolean,
      default: true
    },
    at80Percent: {
      type: Boolean,
      default: true
    },
    atLimit: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
budgetSchema.index({ userId: 1, category: 1, period: 1 });

export const Budget = mongoose.model<IBudget>('Budget', budgetSchema);
