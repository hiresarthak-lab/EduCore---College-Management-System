import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  semester: { type: Number, required: true },
  day: { 
    type: String, 
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  slots: [{
    startTime: String,
    endTime: String,
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    room: String
  }],
  updatedAt: { type: Date, default: Date.now }
});

export const Timetable = mongoose.model('Timetable', timetableSchema);
