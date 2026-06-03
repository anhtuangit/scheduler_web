import { Request, Response } from 'express';
import Task from '../models/Task.model';
import { getTimeSlotFromDate } from '../utils/timeSlot.util';
import { sendEmailReminder } from '../utils/email.util';

/**
 * Get all personal tasks
 */
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { timeSlot, search, startDate, endDate } = req.query;

    const query: any = { userId: req.user._id };

    if (timeSlot) {
      query.timeSlot = timeSlot;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate as string);
      }
    }

    const tasks = await Task.find(query)
      .populate('labels')
      .sort({ startTime: 1 })
      .select('-__v');

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get tasks' });
  }
};

/**
 * Get task by ID
 */
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
      .populate('labels')
      .select('-__v');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get task' });
  }
};

/**
 * Create task
 */
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const {
      title,
      shortDescription,
      detailedDescription,
      startTime,
      endTime,
      labels,
      attachments,
      subtasks,
      emailReminder
    } = req.body;

    if (!title || !startTime || !endTime) {
      res.status(400).json({ message: 'Title, startTime, and endTime are required' });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const timeSlot = getTimeSlotFromDate(start);

    const task = await Task.create({
      userId: req.user._id,
      title,
      shortDescription,
      detailedDescription,
      startTime: start,
      endTime: end,
      timeSlot,
      labels: labels || [],
      attachments: attachments || [],
      subtasks: subtasks || [],
      emailReminder: emailReminder ? new Date(emailReminder) : undefined
    });

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
 * Update task
 */
export const updateTask = async (req: Request, res: Response): Promise<void> => {
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

    const {
      title,
      shortDescription,
      detailedDescription,
      startTime,
      endTime,
      timeSlot,
      labels,
      attachments,
      subtasks,
      emailReminder
    } = req.body;

    if (title) task.title = title;
    if (shortDescription !== undefined) task.shortDescription = shortDescription;
    if (detailedDescription !== undefined) task.detailedDescription = detailedDescription;
    if (startTime) {
      task.startTime = new Date(startTime);
      task.timeSlot = getTimeSlotFromDate(task.startTime);
    }
    if (endTime) task.endTime = new Date(endTime);
    if (timeSlot) task.timeSlot = timeSlot;
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
 * Delete task
 */
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete task' });
  }
};

/**
 * Update task time slot (drag and drop)
 */
export const updateTaskTimeSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { startTime, endTime, timeSlot } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (startTime) {
      task.startTime = new Date(startTime);
      task.timeSlot = getTimeSlotFromDate(task.startTime);
    }
    if (endTime) task.endTime = new Date(endTime);
    if (timeSlot) task.timeSlot = timeSlot;

    await task.save();
    await task.populate('labels');

    res.json({
      message: 'Task time slot updated successfully',
      task
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update task time slot' });
  }
};

