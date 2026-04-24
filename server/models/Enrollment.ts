import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate enrollments
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
