import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  inviteMemberByEmail,
  updateMemberRole,
  removeMember,
  createColumn,
  updateColumn,
  deleteColumn,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  moveTask,
  addComment,
  deleteComment
} from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../utils/upload.util';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Project routes
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Member routes
router.post('/:id/members', addMember);
router.post('/:id/members/invite', inviteMemberByEmail);
router.put('/:id/members/:userId/role', updateMemberRole);
router.delete('/:id/members/:userId', removeMember);

// Column routes
router.post('/:projectId/columns', createColumn);
router.put('/columns/:columnId', updateColumn);
router.delete('/columns/:columnId', deleteColumn);

// Task routes
router.post('/columns/:columnId/tasks', createProjectTask);
router.put('/tasks/:taskId', updateProjectTask);
router.delete('/tasks/:taskId', deleteProjectTask);
router.patch('/tasks/:taskId/move', moveTask);

// Comment routes
router.post('/tasks/:taskId/comments', addComment);
router.delete('/tasks/:taskId/comments/:commentId', deleteComment);

// File upload route
router.post('/tasks/:taskId/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const ProjectTask = require('../models/ProjectTask.model').default;
    const task = await ProjectTask.findById(req.params.taskId)
      .populate('projectId');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const project = task.projectId as any;

    // Check permission
    const hasPermission = project.ownerId.toString() === req.user!._id.toString() ||
      project.members.some((m: any) =>
        m.userId.toString() === req.user!._id.toString() && m.role === 'editor'
      );

    if (!hasPermission) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Add file to attachments
    const fileUrl = `/uploads/${req.file.filename}`;
    if (!task.attachments) {
      task.attachments = [];
    }
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
router.delete('/tasks/:taskId/attachments', async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const fs = require('fs');
    const path = require('path');
    const ProjectTask = require('../models/ProjectTask.model').default;
    
    const task = await ProjectTask.findById(req.params.taskId)
      .populate('projectId');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const project = task.projectId as any;

    // Check permission
    const hasPermission = project.ownerId.toString() === req.user!._id.toString() ||
      project.members.some((m: any) =>
        m.userId.toString() === req.user!._id.toString() && m.role === 'editor'
      );

    if (!hasPermission) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const { attachmentUrl } = req.body;
    
    if (!attachmentUrl) {
      res.status(400).json({ message: 'Attachment URL is required' });
      return;
    }

    // Remove from attachments array
    task.attachments = task.attachments.filter((att: string) => att !== attachmentUrl);
    await task.save();

    // Delete file from filesystem
    const filename = attachmentUrl.replace('/uploads/', '');
    const fileFullPath = path.join(__dirname, '../../uploads', filename);
    if (fs.existsSync(fileFullPath)) {
      fs.unlinkSync(fileFullPath);
    }

    res.json({
      message: 'Attachment deleted successfully',
      task
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete attachment' });
  }
});

export default router;

