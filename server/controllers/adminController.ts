import { Request, Response } from 'express';
import { User } from '../models/User.ts';
import { Timetable } from '../models/Timetable.ts';
import { Announcement } from '../models/Announcement.ts';
import bcrypt from 'bcryptjs';

// User Management
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const query = role ? { role: role as any } : {};
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role, branch, semester } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, displayName, role, branch, semester });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { password, ...updates } = req.body;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: any, res: Response) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'Cannot delete self' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Timetables
export const getTimetables = async (req: Request, res: Response) => {
  try {
    const { courseId, semester } = req.query;
    const query: any = {};
    if (courseId) query.courseId = courseId;
    if (semester) query.semester = semester;
    const timetables = await Timetable.find(query).populate('slots.subjectId slots.teacherId');
    res.json(timetables);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTimetable = async (req: Request, res: Response) => {
  try {
    const timetable = new Timetable(req.body);
    await timetable.save();
    res.status(201).json(timetable);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTimetable = async (req: Request, res: Response) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(timetable);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Announcements
export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).populate('authorId', 'displayName');
    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAnnouncement = async (req: any, res: Response) => {
  try {
    const announcement = new Announcement({
      ...req.body,
      authorId: req.user.id
    });
    await announcement.save();
    res.status(201).json(announcement);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAnnouncement = async (req: any, res: Response) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    
    if (req.user.role !== 'admin' && announcement.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this announcement' });
    }

    const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req: any, res: Response) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    
    if (req.user.role !== 'admin' && announcement.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this announcement' });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
