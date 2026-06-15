import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const commentSchema = new Schema({
  todo:      { type: Schema.Types.ObjectId, ref: 'Todo', required: true },
  author:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

export default model('Comment', commentSchema);
