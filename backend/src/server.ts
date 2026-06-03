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

// Dynamic CORS configuration to allow local development and Vercel deployments
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,
      /\.vercel\.app$/,
      /scheduler-web-nvgs/
    ];
    
    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to MongoDB using Mongoose defaults (queries will buffer during initial connection)
let cachedPromise: Promise<typeof mongoose> | null = null;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  
  if (!cachedPromise) {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/schedule18';
    const maskedUri = mongoUri.replace(/:([^@]+)@/, ':****@');
    console.log('🔌 Connecting to MongoDB URI:', maskedUri);
    
    cachedPromise = mongoose.connect(mongoUri, {
      bufferCommands: false,
    }).then((m) => {
      console.log('✅ MongoDB connection successful');
      return m;
    }).catch((err) => {
      console.error('❌ MongoDB connection error:', err);
      cachedPromise = null; // Reset cached promise on failure to retry later
      throw err;
    });
  }
  
  return cachedPromise;
}

// Database connection middleware for Serverless environment
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({
      message: 'Database connection failed',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

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

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;


