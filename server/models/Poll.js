import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text:  { type: String, required: true, trim: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Poll question is required'],
      trim: true,
      maxlength: 200,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (v) => v.length >= 2 && v.length <= 6,
        message: 'Poll must have 2–6 options',
      },
    },
    todo:         { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', default: null },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    allowMultiple:{ type: Boolean, default: false },
    isAnonymous:  { type: Boolean, default: false },
    expiresAt:    { type: Date, default: null },
    isClosed:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

pollSchema.virtual('totalVotes').get(function () {
  return this.options.reduce((sum, opt) => sum + opt.votes.length, 0);
});

pollSchema.set('toJSON',   { virtuals: true });
pollSchema.set('toObject', { virtuals: true });

export default mongoose.model('Poll', pollSchema);
