import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
    },
    department: {
      type: String,
      enum: ['CSE', 'ECE', 'MECH', 'CIVIL', 'MBA', 'MCA', 'OTHER'],
      default: 'OTHER',
    },
    regNumber: { type: String, trim: true, default: '' },
    avatar:    { type: String, default: '' },
    isActive:  { type: Boolean, default: true },
    preferences: {
      studyGoalHours: { type: Number, default: 4 },
      targetCGPA: { type: Number, default: 8.5 },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
