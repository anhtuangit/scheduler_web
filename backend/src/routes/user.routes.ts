import express from 'express';
import { getProfile, updateProfile, getLoginHistory } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/login-history', getLoginHistory);

export default router;

