import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const iaRecordSchema = new Schema({
  student:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject:    { type: String, required: true },
  subjectCode:{ type: String },
  semester:   { type: String, default: '1' },
  ia1:        { type: Number, default: 0, min: 0, max: 30 },
  ia2:        { type: Number, default: 0, min: 0, max: 30 },
  ia3:        { type: Number, default: 0, min: 0, max: 30 },
  maxMarks:   { type: Number, default: 30 },
  credits:    { type: Number, default: 3 },
  grade:      { type: String, default: '' },
  gradePoint: { type: Number, default: 0 },
}, { timestamps: true });

// Virtual: best 2 average
iaRecordSchema.virtual('bestTwo').get(function () {
  const marks = [this.ia1, this.ia2, this.ia3].sort((a, b) => b - a);
  return parseFloat(((marks[0] + marks[1]) / 2).toFixed(2));
});

iaRecordSchema.set('toJSON', { virtuals: true });

export default model('IARecord', iaRecordSchema);
