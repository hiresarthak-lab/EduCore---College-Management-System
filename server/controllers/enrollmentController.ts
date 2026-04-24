import { Response } from 'express';
import { Enrollment } from '../models/Enrollment.ts';

export const enrollStudent = async (req: any, res: Response) => {
  try {
    const { studentId, courseId } = req.body;
    
    if (!studentId || !courseId) {
      return res.status(400).json({ message: 'Student ID and Course ID are required' });
    }

    const newEnrollment = new Enrollment({
      studentId,
      courseId,
      enrolledBy: req.user.id
    });

    await newEnrollment.save();
    
    const populated = await Enrollment.findById(newEnrollment._id)
      .populate('studentId', 'displayName email')
      .populate('courseId');
      
    res.status(201).json(populated);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student is already enrolled in this course' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getEnrollments = async (req: any, res: Response) => {
  try {
    const query: any = {};
    if (req.user.role === 'student') {
      query.studentId = req.user.id;
    }
    const enrollments = await Enrollment.find(query)
      .populate('studentId', 'displayName email')
      .populate('courseId');
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const removeEnrollment = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Enrollment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Enrollment not found' });
    res.json({ message: 'Enrollment removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
