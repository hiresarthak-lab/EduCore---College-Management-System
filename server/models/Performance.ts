import mongoose from 'mongoose';

const performanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  examName: { type: String, required: true },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  remarks: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

performanceSchema.index({ studentId: 1, courseId: 1, examName: 1 }, { unique: true });

export const Performance = mongoose.model('Performance', performanceSchema);
