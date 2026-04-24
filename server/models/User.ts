import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student',
  },
  photoURL: String,
  profilePhotoData: Buffer,
  profilePhotoContentType: String,
  signatureURL: String,
  signatureData: Buffer,
  signatureContentType: String,
  address: String,
  studentClass: String,
  sectionDiv: String,
  gpa: Number,
  attendance: Number,
  activeSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  backlogs: Number,
  credits: Number,
  branch: String,
  semester: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model('User', userSchema);
