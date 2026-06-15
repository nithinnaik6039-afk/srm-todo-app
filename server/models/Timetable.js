import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const timetableSchema = new Schema({
  user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String, default: '1' },
  slots: [{
    day:      { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat'], required: true },
    time:     { type: String, required: true },       // e.g. "09:00"
    endTime:  { type: String, default: '' },           // e.g. "10:00"
    subject:  { type: String, required: true },
    faculty:  { type: String, default: '' },
    room:     { type: String, default: '' },
    type:     { type: String, enum: ['lecture','lab','tutorial','break'], default: 'lecture' },
    color:    { type: String, default: '#6c63ff' },
  }],
}, { timestamps: true });

export default model('Timetable', timetableSchema);
