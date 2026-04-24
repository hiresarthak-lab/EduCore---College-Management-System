import { Request, Response } from 'express';
import { Material } from '../models/Material.ts';
import { Subject } from '../models/Subject.ts';

export const getAllMaterials = async (req: Request, res: Response) => {
  try {
    const { courseId, subjectId, type } = req.query;
    const query: any = {};
    if (courseId) query.courseId = courseId;
    if (subjectId) query.subjectId = subjectId;
    if (type) query.type = type;

    const materials = await Material.find(query)
      .populate('subjectId')
      .populate('courseId')
      .populate('uploadedBy', 'displayName');
    res.json(materials);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import fs from 'fs';

export const uploadMaterial = async (req: any, res: Response) => {
  try {
    let { title, type, subjectId, courseId } = req.body;
    
    let fileUrl = req.body.fileUrl;
    let fileData = null;
    let fileContentType = null;

    if (req.file) {
      if (req.file.filename) { // Local upload
        try {
          fileData = fs.readFileSync(req.file.path);
          fileContentType = req.file.mimetype;
        } catch(e) { console.error('Failed to read file back from disk', e); }
        // Keep the local URL for standard routing if we want, but we'll create a dedicated API endpoint next.
        fileUrl = `/api/academic/materials/download/db-file-${Date.now()}`;
      } else {
        // Cloudinary
        fileUrl = req.file.path;
      }
    }
    
    if (!fileUrl) {
      return res.status(400).json({ message: 'File or file URL is required' });
    }

    if (!courseId && subjectId) {
       const subject = await Subject.findById(subjectId);
       if (subject && subject.courseId) {
         courseId = subject.courseId;
       }
    }
    
    const material = new Material({
      title,
      type,
      subjectId,
      courseId,
      fileUrl,
      fileData,
      fileContentType,
      uploadedBy: req.user.id,
      uploadedByName: req.user.displayName || 'Faculty'
    });

    await material.save();
    
    if (material.fileUrl.includes('db-file-')) {
       // Embed the true MongoDB ID into the URL for dynamic extraction later
       material.fileUrl = `/api/academic/materials/${material._id}/download`;
       await material.save();
    }

    res.status(201).json(material);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMaterialDownload = async (req: any, res: Response) => {
  try {
    const material = await Material.findById(req.params.id).select('+fileData');
    if (!material) {
      return res.status(404).send('Material not found');
    }

    if (!material.fileData) {
       // If it's old and has no fileData, fallback or error
       return res.redirect(material.fileUrl);
    }

    res.setHeader('Content-Type', material.fileContentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(material.title)}.pdf"`);
    res.send(material.fileData);
  } catch (error: any) {
    res.status(500).send('Database error during file extraction');
  }
};

export const deleteMaterial = async (req: any, res: Response) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    
    // Safety check
    if (req.user.role !== 'admin' && material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this material' });
    }

    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
