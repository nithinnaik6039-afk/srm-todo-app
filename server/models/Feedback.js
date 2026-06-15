import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const feedbackSchema = new Schema({
  student:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject:     { type: String, required: true },
  faculty:     { type: String, required: true },
  semester:    { type: String, default: '1' },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  teaching:    { type: Number, required: true, min: 1, max: 5 },
  clarity:     { type: Number, required: true, min: 1, max: 5 },
  helpfulness: { type: Number, required: true, min: 1, max: 5 },
  comment:     { type: String, maxlength: 1000, default: '' },
  isAnonymous: { type: Boolean, default: false },
}, { timestamps: true });

export default model('Feedback', feedbackSchema);
