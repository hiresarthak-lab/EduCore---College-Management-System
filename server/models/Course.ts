import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  branch: { type: String, required: true },
  duration: { type: Number, required: true }, // in years
  createdAt: { type: Date, default: Date.now },
});

export const Course = mongoose.model('Course', courseSchema);
