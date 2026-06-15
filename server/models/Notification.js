import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['todo_assigned', 'comment_added', 'due_soon', 'announcement', 'system'],
      required: true,
    },
    message:   { type: String, required: true },
    relatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Todo' },
    isRead:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
export default mongoose.model('Notification', notificationSchema);
