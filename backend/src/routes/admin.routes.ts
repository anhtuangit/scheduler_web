import express from 'express';
import {
  getUsers,
  toggleUserStatus,
  getStatistics,
  getSystemConfig,
  updateSystemConfig,
  getUserLoginHistory
} from '../controllers/admin.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, isAdmin);

router.get('/users', getUsers);
router.patch('/users/:userId/status', toggleUserStatus);
router.get('/statistics', getStatistics);
router.get('/config', getSystemConfig);
router.put('/config', updateSystemConfig);
router.get('/users/:userId/login-history', getUserLoginHistory);

export default router;

