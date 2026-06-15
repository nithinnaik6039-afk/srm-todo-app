import mongoose from 'mongoose';
import crypto from 'crypto';

const subTaskSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
}, { _id: true });

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    completed:   { type: Boolean, default: false },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    category:    { type: String, enum: ['academic', 'event', 'personal', 'admin', 'other'], default: 'other' },
    dueDate:     { type: Date, default: null },
    tags:        [{ type: String, trim: true }],
    labelColor:  { type: String, default: '' },
    subTasks:    [subTaskSchema],
    attachments: [{
      filename:   String,
      url:        String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    isRecurring:      { type: Boolean, default: false },
    recurringPattern: { type: String, enum: ['daily', 'weekly', 'monthly', null], default: undefined },

    // Sharing & Visibility
    visibility:  { type: String, enum: ['private', 'department', 'public'], default: 'private' },
    shareToken:  { type: String, default: () => crypto.randomBytes(16).toString('hex'), unique: true, sparse: true },
    department:  { type: String, default: '' },

    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

todoSchema.index({ createdBy: 1, completed: 1 });
todoSchema.index({ assignedTo: 1 });
todoSchema.index({ shareToken: 1 });
todoSchema.index({ visibility: 1, department: 1 });

export default mongoose.model('Todo', todoSchema);

