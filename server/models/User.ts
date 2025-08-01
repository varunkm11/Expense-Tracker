import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  roommates: string[];
  friends: Array<{
    email: string;
    name: string;
  }>;
  friendRequests: {
    sent: string[];
    received: string[];
  };
  isAdmin: boolean;
  adminCode?: string;
  preferences: {
    currency: string;
    theme: string;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  roommates: [{
    type: String,
    trim: true
  }],
  friends: [{
    email: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  }],
  friendRequests: {
    sent: [{
      type: String,
      trim: true
    }],
    received: [{
      type: String,
      trim: true
    }]
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  adminCode: {
    type: String,
    default: null
  },
  preferences: {
    currency: {
      type: String,
      default: 'INR'
    },
    theme: {
      type: String,
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
