import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime:   { type: Date, default: null },
  duration:  { type: Number, default: 0 }, // seconds
  note:      { type: String, default: '' },
});

const timeEntrySchema = new mongoose.Schema(
  {
    todo:          { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', required: true },
    user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessions:      [sessionSchema],
    totalDuration: { type: Number, default: 0 }, // total seconds
    isRunning:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

timeEntrySchema.index({ todo: 1, user: 1 }, { unique: true });

export default mongoose.model('TimeEntry', timeEntrySchema);
