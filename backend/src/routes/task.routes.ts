import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskTimeSlot
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../utils/upload.util';
import Task from '../models/Task.model';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/time-slot', updateTaskTimeSlot);

// File upload route
router.post('/:id/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Add file to attachments
    const fileUrl = `/uploads/${req.file.filename}`;
    task.attachments.push(fileUrl);
    await task.save();

    res.json({
      message: 'File uploaded successfully',
      file: fileUrl,
      attachments: task.attachments
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to upload file' });
  }
});

// Delete attachment route
router.delete('/:id/attachments/:filename', async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const filename = req.params.filename;
    const filePath = `/uploads/${filename}`;
    
    // Remove from attachments array
    task.attachments = task.attachments.filter(att => att !== filePath);
    await task.save();

    // Delete file from filesystem
    const fileFullPath = path.join(__dirname, '../../uploads', filename);
    if (fs.existsSync(fileFullPath)) {
      fs.unlinkSync(fileFullPath);
    }

    res.json({
      message: 'Attachment deleted successfully',
      attachments: task.attachments
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete attachment' });
  }
});

export default router;

