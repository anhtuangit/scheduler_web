import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.model';
import Column from '../models/Column.model';
import ProjectTask from '../models/ProjectTask.model';
import User from '../models/User.model';
import { sendProjectInvitation } from '../utils/email.util';

/**
 * Get all projects user is involved in
 */
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { search } = req.query;

    const query: any = {
      $or: [
        { ownerId: req.user._id },
        { 'members.userId': req.user._id }
      ]
    };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const projects = await Project.find(query)
      .populate('ownerId', 'name email picture')
      .populate('members.userId', 'name email picture')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({ projects });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get projects' });
  }
};

/**
 * Get project by ID with columns and tasks
 */
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: req.user._id },
        { 'members.userId': req.user._id }
      ]
    })
      .populate('ownerId', 'name email picture')
      .populate('members.userId', 'name email picture')
      .select('-__v');

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Get columns with tasks
    const columns = await Column.find({ projectId: project._id })
      .populate({
        path: 'tasks',
        populate: [
          {
            path: 'labels',
            model: 'Label'
          },
          {
            path: 'comments.userId',
            select: 'name email picture'
          }
        ]
      })
      .sort({ order: 1 })
      .select('-__v');

    res.json({
      project,
      columns
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get project' });
  }
};

/**
 * Create project
 */
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Project name is required' });
      return;
    }

    const project = await Project.create({
      name,
      description,
      ownerId: req.user._id,
      members: [],
      columns: []
    });

    await project.populate('ownerId', 'name email picture');

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create project' });
  }
};

/**
 * Update project
 */
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found or you are not the owner' });
      return;
    }

    const { name, description } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();
    await project.populate('ownerId', 'name email picture');
    await project.populate('members.userId', 'name email picture');

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update project' });
  }
};

/**
 * Delete project
 */
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found or you are not the owner' });
      return;
    }

    // Delete all columns and tasks
    const columns = await Column.find({ projectId: project._id });
    const taskIds = columns.flatMap(col => col.tasks);
    await ProjectTask.deleteMany({ _id: { $in: taskIds } });
    await Column.deleteMany({ projectId: project._id });

    await Project.findByIdAndDelete(project._id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete project' });
  }
};

/**
 * Add member to project
 */
export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found or you are not the owner' });
      return;
    }

    const { userId, role } = req.body;

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if already a member
    const isMember = project.members.some(
      m => m.userId.toString() === userId
    );

    if (isMember) {
      res.status(400).json({ message: 'User is already a member' });
      return;
    }

    project.members.push({
      userId: new mongoose.Types.ObjectId(userId),
      role: role || 'editor',
      joinedAt: new Date()
    });

    await project.save();
    await project.populate('members.userId', 'name email picture');

    res.json({
      message: 'Member added successfully',
      project
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to add member' });
  }
};

/**
 * Invite member to project by email
 */
export const inviteMemberByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: req.user._id },
        { 'members.userId': req.user._id, 'members.role': 'editor' }
      ]
    })
      .populate('ownerId', 'name email');

    if (!project) {
      res.status(404).json({ message: 'Project not found or access denied' });
      return;
    }

    const { email, role } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check if already a member (if user exists)
    if (user) {
      const isMember = project.ownerId.toString() === user._id.toString() ||
        project.members.some(m => m.userId.toString() === user._id.toString());

      if (isMember) {
        res.status(400).json({ message: 'User is already a member of this project' });
        return;
      }

      // If user exists, add them directly
      project.members.push({
        userId: user._id,
        role: role || 'editor',
        joinedAt: new Date()
      });

      await project.save();
    }

    // Send invitation email
    const inviterName = (project.ownerId as any).name || req.user.name || 'Một người dùng';
    const projectName = project.name;
    const memberRole = role || 'editor';

    try {
      await sendProjectInvitation(
        email,
        projectName,
        inviterName,
        memberRole,
        project._id.toString(),
        process.env.FRONTEND_URL
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue even if email fails
    }

    // If user was added, populate and return
    if (user) {
      await project.populate('members.userId', 'name email picture');
      res.json({
        message: 'Member invited and added successfully',
        project
      });
    } else {
      res.json({
        message: 'Invitation email sent successfully. User will be added when they register.',
        project
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to invite member' });
  }
};

/**
 * Update member role
 */
export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found or you are not the owner' });
      return;
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['viewer', 'editor'].includes(role)) {
      res.status(400).json({ message: 'Valid role (viewer or editor) is required' });
      return;
    }

    const memberIndex = project.members.findIndex(
      m => m.userId.toString() === userId
    );

    if (memberIndex === -1) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    project.members[memberIndex].role = role as 'viewer' | 'editor';
    await project.save();
    await project.populate('members.userId', 'name email picture');

    res.json({
      message: 'Member role updated successfully',
      project
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update member role' });
  }
};

/**
 * Remove member from project
 */
export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found or you are not the owner' });
      return;
    }

    const { userId } = req.params;

    project.members = project.members.filter(
      m => m.userId.toString() !== userId
    );

    await project.save();
    await project.populate('members.userId', 'name email picture');

    res.json({
      message: 'Member removed successfully',
      project
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to remove member' });
  }
};

/**
 * Create column
 */
export const createColumn = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const project = await Project.findOne({
      _id: req.params.projectId,
      $or: [
        { ownerId: req.user._id },
        { 'members.userId': req.user._id, 'members.role': 'editor' }
      ]
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found or access denied' });
      return;
    }

    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Column name is required' });
      return;
    }

    // Get max order
    const maxOrder = await Column.findOne({ projectId: project._id })
      .sort({ order: -1 })
      .select('order');

    const column = await Column.create({
      projectId: project._id,
      name,
      order: (maxOrder?.order || -1) + 1,
      tasks: []
    });

    project.columns.push(column._id);
    await project.save();

    res.status(201).json({
      message: 'Column created successfully',
      column
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create column' });
  }
};

/**
 * Update column
 */
export const updateColumn = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const column = await Column.findById(req.params.columnId)
      .populate('projectId');

    if (!column) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }

    const project = column.projectId as any;

    // Check permission
    const hasPermission = project.ownerId.toString() === req.user!._id.toString() ||
      project.members.some((m: any) =>
        m.userId.toString() === req.user!._id.toString() && m.role === 'editor'
      );

    if (!hasPermission) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const { name, order } = req.body;

    if (name) column.name = name;
    if (order !== undefined) column.order = order;

    await column.save();

    res.json({
      message: 'Column updated successfully',
      column
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update column' });
  }
};

/**
 * Delete column
 */
export const deleteColumn = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const column = await Column.findById(req.params.columnId)
      .populate('projectId');

    if (!column) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }

    const project = column.projectId as any;

    // Check permission
    const hasPermission = project.ownerId.toString() === req.user!._id.toString() ||
      project.members.some((m: any) =>
        m.userId.toString() === req.user!._id.toString() && m.role === 'editor'
      );

    if (!hasPermission) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Delete all tasks in column
    await ProjectTask.deleteMany({ _id: { $in: column.tasks } });

    // Remove column from project
    await Project.updateOne(
      { _id: project._id },
      { $pull: { columns: column._id } }
    );

    await Column.findByIdAndDelete(column._id);

    res.json({ message: 'Column deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete column' });
  }
};

/**
 * Create project task
 */
export const createProjectTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const column = await Column.findById(req.params.columnId)
      .populate('projectId');

    if (!column) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }

    const project = column.projectId as any;

    // Check permission
    const hasPermission = project.ownerId.toString() === req.user!._id.toString() ||
      project.members.some((m: any) =>
        m.userId.toString() === req.user!._id.toString() && m.role === 'editor'
      );

    if (!hasPermission) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const {
      title,
      shortDescription,
      detailedDescription,
      labels,
      attachments,
      subtasks,
      emailReminder
    } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Task title is required' });
      return;
    }

    // Get max order in column
    const maxOrder = await ProjectTask.findOne({ columnId: column._id })
      .sort({ order: -1 })
      .select('order');

    const task = await ProjectTask.create({
      projectId: project._id,
      columnId: column._id,
      title,
      shortDescription,
      detailedDescription,
      labels: labels || [],
      attachments: attachments || [],
      subtasks: subtasks || [],
      comments: [],
      emailReminder: emailReminder ? new Date(emailReminder) : undefined,
      order: (maxOrder?.order || -1) + 1
    });

    column.tasks.push(task._id);
    await column.save();

    await task.populate('labels');

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create task' });
  }
};

/**
 * Update project task
 */
export const updateProjectTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

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

    const {
      title,
      shortDescription,
      detailedDescription,
      labels,
      attachments,
      subtasks,
      emailReminder
    } = req.body;

    if (title) task.title = title;
    if (shortDescription !== undefined) task.shortDescription = shortDescription;
    if (detailedDescription !== undefined) task.detailedDescription = detailedDescription;
    if (labels) task.labels = labels;
    if (attachments) task.attachments = attachments;
    if (subtasks) task.subtasks = subtasks;
    if (emailReminder !== undefined) {
      task.emailReminder = emailReminder ? new Date(emailReminder) : undefined;
    }

    await task.save();
    await task.populate('labels');

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update task' });
  }
};

/**
 * Delete project task
 */
export const deleteProjectTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

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

    // Remove task from column
    await Column.updateOne(
      { _id: task.columnId },
      { $pull: { tasks: task._id } }
    );

    await ProjectTask.findByIdAndDelete(task._id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete task' });
  }
};

/**
 * Move task between columns or reorder
 */
export const moveTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { columnId, newOrder } = req.body;

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

    const oldColumnId = task.columnId;

    // If moving to different column
    if (columnId && columnId.toString() !== oldColumnId.toString()) {
      // Remove from old column
      await Column.updateOne(
        { _id: oldColumnId },
        { $pull: { tasks: task._id } }
      );

      // Add to new column
      task.columnId = columnId;
      await Column.updateOne(
        { _id: columnId },
        { $push: { tasks: task._id } }
      );
    }

    // Update order
    if (newOrder !== undefined) {
      task.order = newOrder;
    }

    await task.save();
    await task.populate('labels');

    res.json({
      message: 'Task moved successfully',
      task
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to move task' });
  }
};

/**
 * Add comment to task
 */
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const task = await ProjectTask.findById(req.params.taskId)
      .populate('projectId');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const project = task.projectId as any;

    // Check if user has access to project
    const hasAccess = project.ownerId.toString() === req.user!._id.toString() ||
      project.members.some((m: any) =>
        m.userId.toString() === req.user!._id.toString()
      );

    if (!hasAccess) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const { content } = req.body;

    if (!content) {
      res.status(400).json({ message: 'Comment content is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    task.comments.push({
      userId: req.user._id,
      content,
      createdAt: new Date()
    });

    await task.save();

    // Populate comment user
    const updatedTask = await ProjectTask.findById(task._id)
      .populate('comments.userId', 'name email picture');

    res.json({
      message: 'Comment added successfully',
      task: updatedTask
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to add comment' });
  }
};

/**
 * Delete comment
 */
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

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

    const commentId = req.params.commentId;

    task.comments = task.comments.filter(
      (c: any) => c._id.toString() !== commentId
    );

    await task.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete comment' });
  }
};

