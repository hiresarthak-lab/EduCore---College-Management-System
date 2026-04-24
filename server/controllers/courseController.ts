import { Request, Response } from 'express';
import { Course } from '../models/Course.ts';
import { Subject } from '../models/Subject.ts';
import { User } from '../models/User.ts';
import { Material } from '../models/Material.ts';

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    // Also cleanup subjects if needed, but for now just the course
    res.json({ message: 'Course deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await Subject.find().populate('courseId').populate('teacherId', 'displayName');
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import fs from 'fs';

export const createSubject = async (req: any, res: Response) => {
  try {
    const subjectData = { ...req.body };
    if (subjectData.data) {
       Object.assign(subjectData, typeof subjectData.data === 'string' ? JSON.parse(subjectData.data) : subjectData.data);
    }
    const subject = new Subject(subjectData);
    
    if (req.file) {
      if (req.file.filename) { // Local upload
        try {
          subject.syllabusData = fs.readFileSync(req.file.path);
          subject.syllabusContentType = req.file.mimetype;
          subject.syllabusUrl = `/api/academic/subjects/${subject._id}/syllabus`;
        } catch(e) { console.error('Failed to read file back from disk', e); }
      } else {
        // Cloudinary upload
        subject.syllabusUrl = req.file.path;
      }
    }
    
    await subject.save();
    res.status(201).json(subject);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subject code already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateSubject = async (req: any, res: Response) => {
  try {
    const subjectData = { ...req.body };
    if (subjectData.data) {
       Object.assign(subjectData, typeof subjectData.data === 'string' ? JSON.parse(subjectData.data) : subjectData.data);
    }
    
    if (req.file) {
      if (req.file.filename) { // Local upload
        try {
          subjectData.syllabusData = fs.readFileSync(req.file.path);
          subjectData.syllabusContentType = req.file.mimetype;
          subjectData.syllabusUrl = `/api/academic/subjects/${req.params.id}/syllabus`;
        } catch(e) { console.error('Failed to read file back from disk', e); }
      } else {
        // Cloudinary
        subjectData.syllabusUrl = req.file.path;
      }
    }

    const subject = await Subject.findByIdAndUpdate(req.params.id, subjectData, { new: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Subject code already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getSubjectSyllabus = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).send('Subject not found');

    if (!subject.syllabusData) {
       return res.redirect(subject.syllabusUrl || '/');
    }

    res.setHeader('Content-Type', subject.syllabusContentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(subject.name)}-syllabus.pdf"`);
    res.send(subject.syllabusData);
  } catch (error: any) {
    res.status(500).send('Database error during file extraction');
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const [studentCount, teacherCount, courseCount, materialCount] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Course.countDocuments(),
      Material.countDocuments()
    ]);
    res.json({
      students: studentCount,
      teachers: teacherCount,
      courses: courseCount,
      materials: materialCount
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
