import { Response } from 'express';
import { Attendance } from '../models/Attendance.ts';
import { Performance } from '../models/Performance.ts';
import { User } from '../models/User.ts';

// ---- ATTENDANCE ----

export const getAttendance = async (req: any, res: Response) => {
  try {
    const { courseId, studentId, date } = req.query;
    const query: any = {};
    if (courseId) query.courseId = courseId;
    if (studentId) query.studentId = studentId;
    if (date) query.date = date;

    // Students can only see their own
    if (req.user.role === 'student') {
      query.studentId = req.user.id;
    }

    const records = await Attendance.find(query)
      .populate('studentId', 'displayName email')
      .populate('courseId', 'name branch')
      .sort({ date: -1 });

    res.json(records);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const saveAttendance = async (req: any, res: Response) => {
  try {
    const { courseId, date, records } = req.body;
    // records: [{ studentId, status }]

    if (!courseId || !date || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid payload definition' });
    }

    const bulkOps = records.map((record: any) => ({
      updateOne: {
        filter: { courseId, date, studentId: record.studentId },
        update: { 
          $set: { 
            status: record.status, 
            recordedBy: req.user.id 
          } 
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);

      // Recalculate attendance for affected students
      const studentIds = [...new Set(records.map((r: any) => r.studentId))];
      for (const sid of studentIds) {
        const studentRecords = await Attendance.find({ studentId: sid });
        if (studentRecords.length > 0) {
          const present = studentRecords.filter(a => a.status === 'present').length;
          const percentage = Math.round((present / studentRecords.length) * 100);
          await User.findByIdAndUpdate(sid, { attendance: percentage });
        }
      }
    }

    res.json({ message: 'Attendance processed successfully' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ---- PERFORMANCE ----

export const getPerformance = async (req: any, res: Response) => {
  try {
    const { courseId, studentId } = req.query;
    const query: any = {};
    if (courseId) query.courseId = courseId;
    if (studentId) query.studentId = studentId;

    if (req.user.role === 'student') {
      query.studentId = req.user.id;
    }

    const records = await Performance.find(query)
      .populate('studentId', 'displayName email')
      .populate('courseId', 'name branch')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const savePerformance = async (req: any, res: Response) => {
  try {
    const { records } = req.body;
    // records: [{ studentId, courseId, examName, marksObtained, totalMarks, remarks }]

    if (!Array.isArray(records)) {
      return res.status(400).json({ message: 'Records must be an array' });
    }

    const bulkOps = records.map((record: any) => ({
      updateOne: {
        filter: { 
          courseId: record.courseId, 
          studentId: record.studentId, 
          examName: record.examName 
        },
        update: { 
          $set: { 
            marksObtained: Number(record.marksObtained),
            totalMarks: Number(record.totalMarks),
            remarks: record.remarks,
            recordedBy: req.user.id 
          } 
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Performance.bulkWrite(bulkOps);

      // Recalculate GPA
      const studentIds = [...new Set(records.map((r: any) => r.studentId))];
      for (const sid of studentIds) {
        const studentPerfs = await Performance.find({ studentId: sid });
        if (studentPerfs.length > 0) {
          let totalPct = 0;
          for (const p of studentPerfs) {
            totalPct += (p.marksObtained / p.totalMarks) * 100;
          }
          const avgPct = totalPct / studentPerfs.length;
          const gpa = Number((avgPct / 10).toFixed(2));
          await User.findByIdAndUpdate(sid, { gpa });
        }
      }
    }

    res.json({ message: 'Performance marks recorded safely' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
