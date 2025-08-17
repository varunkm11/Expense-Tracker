import mongoose, { Document, Schema } from 'mongoose';

export interface IUserBalance extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string; // For easier queries
  balances: Map<string, number>; // email -> amount (positive = they owe you, negative = you owe them)
  totalOwed: number; // Total amount others owe this user
  totalOwing: number; // Total amount this user owes others
  createdAt: Date;
  updatedAt: Date;
}

const userBalanceSchema = new Schema<IUserBalance>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  userEmail: {
    type: String,
    required: true,
    unique: true
  },
  balances: {
    type: Map,
    of: Number,
    default: new Map()
  },
  totalOwed: {
    type: Number,
    default: 0
  },
  totalOwing: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Remove duplicate indexes since unique: true already creates them
// userBalanceSchema.index({ userEmail: 1 }); // Removed - already unique
// userBalanceSchema.index({ userId: 1 }); // Removed - already unique

export const UserBalance = mongoose.model<IUserBalance>('UserBalance', userBalanceSchema);
