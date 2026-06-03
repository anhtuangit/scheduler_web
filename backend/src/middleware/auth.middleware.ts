import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';
import { getJWTSecret } from '../utils/jwt.util';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (!token) {
      console.log('❌ No token in cookies.');
      console.log('❌ All cookies:', Object.keys(req.cookies));
      console.log('❌ Request headers:', {
        cookie: req.headers.cookie,
        origin: req.headers.origin,
        referer: req.headers.referer
      });
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const JWT_SECRET = getJWTSecret();
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      console.log('❌ User not found or inactive:', decoded.userId);
      res.status(401).json({ message: 'User not found or inactive' });
      return;
    }
    req.user = user;
    next();
  } catch (error: any) {
    console.error('❌ Token verification error:', error.message);
    console.error('❌ Error details:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  next();
};

