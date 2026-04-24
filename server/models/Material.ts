import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['notes', 'pyq', 'assignment', 'syllabus'],
    required: true 
  },
  fileUrl: { type: String, required: true },
  fileData: { type: Buffer, select: false },
  fileContentType: { type: String },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedByName: String,
  isApproved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Material = mongoose.model('Material', materialSchema);
