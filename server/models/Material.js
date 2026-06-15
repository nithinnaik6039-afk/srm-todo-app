import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const materialSchema = new Schema({
  title:       { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 500, default: '' },
  subject:     { type: String, required: true },
  semester:    { type: String, default: '1' },
  fileUrl:     { type: String, required: true },
  filename:    { type: String, required: true },
  fileType:    { type: String },
  fileSize:    { type: Number, default: 0 },
  uploadedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  downloads:   { type: Number, default: 0 },
}, { timestamps: true });

export default model('Material', materialSchema);
