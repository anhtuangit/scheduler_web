import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import taskRoutes from './routes/task.routes';
import projectRoutes from './routes/project.routes';
import labelRoutes from './routes/label.routes';
import adminRoutes from './routes/admin.routes';

// Load environment variables FIRST before any other imports that might use them
dotenv.config();

// Log JWT_SECRET status on startup
// const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
// console.log('🔑 JWT_SECRET loaded:', jwtSecret ? jwtSecret.substring(0, 10) + '...' : 'NOT SET (using default)');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['https://scheduler-web-nvgs.vercel.app'
];

// Cho phép origin cụ thể
app.use(cors({
  origin: 'https://scheduler-web-nvgs.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schedule18')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

