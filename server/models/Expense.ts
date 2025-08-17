import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  date: Date;
  splitWith: string[];
  paidBy: string;
  receiptUrl?: string;
  tags: string[];
  isRecurring: boolean;
  isLinkedExpense?: boolean; // Flag to indicate this is a linked split expense
  originalExpenseId?: mongoose.Types.ObjectId; // Reference to original expense
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  splitDetails?: {
    totalParticipants: number;
    amountPerPerson: number;
    payments: Array<{
      participant: string;
      amount: number; // Custom amount for this participant
      isPaid: boolean;
      paidAt?: Date;
      notes?: string;
    }>;
  };
  nonRoommateNotes?: Array<{
    person: string;
    amount: number;
    description: string;
    isPaid: boolean;
    paidAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
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
      'Others'
    ]
  },
  subcategory: {
    type: String,
    default: null
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  splitWith: [{
    type: String,
    default: []
  }],
  paidBy: {
    type: String,
    required: true,
    default: 'You'
  },
  receiptUrl: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  isLinkedExpense: {
    type: Boolean,
    default: false
  },
  originalExpenseId: {
    type: Schema.Types.ObjectId,
    ref: 'Expense'
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      min: 1
    },
    endDate: Date
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  splitDetails: {
    totalParticipants: {
      type: Number,
      default: 1
    },
    amountPerPerson: {
      type: Number,
      default: 0
    },
    payments: [{
      participant: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      isPaid: {
        type: Boolean,
        default: false
      },
      paidAt: {
        type: Date
      },
      notes: {
        type: String
      }
    }]
  },
  nonRoommateNotes: [{
    person: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      required: true
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date
    }
  }]
}, {
  timestamps: true
});

// Transform _id to id when converting to JSON
expenseSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Index for better query performance
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, tags: 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
