import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  date:   { type: Date, default: Date.now },
  status: { type: String, enum: ['present', 'absent', 'od', 'medical'], default: 'present' },
  note:   { type: String, default: '' },
});

const attendanceSchema = new mongoose.Schema(
  {
    student:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject:         { type: String, required: true, trim: true },
    subjectCode:     { type: String, trim: true, default: '' },
    faculty:         { type: String, trim: true, default: '' },
    totalClasses:    { type: Number, default: 0 },
    attendedClasses: { type: Number, default: 0 },
    percentage:      { type: Number, default: 0 },
    minimumRequired: { type: Number, default: 75 }, // SRM minimum = 75%
    records:         [attendanceRecordSchema],
  },
  { timestamps: true }
);

attendanceSchema.pre('save', function () {
  if (this.totalClasses > 0) {
    this.percentage = parseFloat(
      ((this.attendedClasses / this.totalClasses) * 100).toFixed(2)
    );
  } else {
    this.percentage = 0;
  }
});

// Virtual: safety status
attendanceSchema.virtual('status').get(function () {
  if (this.percentage >= 85)                    return 'safe';
  if (this.percentage >= this.minimumRequired)  return 'warning';
  return 'danger';
});

attendanceSchema.set('toJSON',   { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });
attendanceSchema.index({ student: 1 });

export default mongoose.model('Attendance', attendanceSchema);
