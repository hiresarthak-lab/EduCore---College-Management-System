import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  semester: { type: Number, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  syllabusUrl: String,
  syllabusData: Buffer,
  syllabusContentType: String,
  createdAt: { type: Date, default: Date.now },
});

export const Subject = mongoose.model('Subject', subjectSchema);
