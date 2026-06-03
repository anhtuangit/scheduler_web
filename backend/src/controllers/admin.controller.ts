import { Request, Response } from 'express';
import User from '../models/User.model';
import Task from '../models/Task.model';
import Project from '../models/Project.model';
import LoginHistory from '../models/LoginHistory.model';
import SystemConfig from '../models/SystemConfig.model';

/**
 * Get all users
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role, isActive } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const users = await User.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get users' });
  }
};

/**
 * Lock/Unlock user
 */
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Prevent locking root admin (first admin user)
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if this is the first admin (root admin)
    const firstAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    if (firstAdmin && firstAdmin._id.toString() === userId && user.role === 'admin') {
      res.status(400).json({ message: 'Cannot lock root admin' });
      return;
    }

    user.isActive = isActive !== undefined ? isActive : !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'unlocked' : 'locked'} successfully`,
      user
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to toggle user status' });
  }
};

/**
 * Get system statistics
 */
export const getStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalTasks,
      totalProjects,
      tasksByStatus,
      projectsByOwner
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Task.countDocuments(),
      Project.countDocuments(),
      Task.aggregate([
        {
          $lookup: {
            from: 'labels',
            localField: 'labels',
            foreignField: '_id',
            as: 'labelDetails'
          }
        },
        {
          $unwind: {
            path: '$labelDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            'labelDetails.type': 'status'
          }
        },
        {
          $group: {
            _id: '$labelDetails.name',
            count: { $sum: 1 }
          }
        }
      ]),
      Project.aggregate([
        {
          $group: {
            _id: '$ownerId',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'owner'
          }
        },
        {
          $unwind: '$owner'
        },
        {
          $project: {
            ownerName: '$owner.name',
            count: 1
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ])
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      tasks: {
        total: totalTasks
      },
      projects: {
        total: totalProjects
      },
      tasksByStatus: tasksByStatus || [],
      topProjectOwners: projectsByOwner || []
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get statistics' });
  }
};

/**
 * Get system configuration
 */
export const getSystemConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await (SystemConfig as any).getConfig();
    res.json({ config });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get system config' });
  }
};

/**
 * Update system configuration
 */
export const updateSystemConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { appName, theme, primaryColor } = req.body;

    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({
        appName: appName || 'Schedule 18',
        theme: theme || 'light',
        primaryColor: primaryColor || '#3B82F6',
        updatedBy: req.user._id
      });
    } else {
      if (appName) config.appName = appName;
      if (theme && ['light', 'dark'].includes(theme)) {
        config.theme = theme;
      }
      if (primaryColor) config.primaryColor = primaryColor;
      config.updatedBy = req.user._id;
      await config.save();
    }

    res.json({
      message: 'System configuration updated successfully',
      config
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update system config' });
  }
};

/**
 * Get user login history (Admin view)
 */
export const getUserLoginHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const history = await LoginHistory.find({ userId })
      .sort({ loginAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-__v');

    const total = await LoginHistory.countDocuments({ userId });

    res.json({
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get login history' });
  }
};

