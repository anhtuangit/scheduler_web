import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.model';
import LoginHistory from '../models/LoginHistory.model';
import { generateToken, setTokenCookie, clearTokenCookie } from '../utils/jwt.util';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: 'Google token is required' });
      return;
    }
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: 'Invalid Google token' });
      return;
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      res.status(400).json({ message: 'Email not provided by Google' });
      return;
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name,
        picture,
        googleId,
        role: 'user',
        isActive: true
      });
    } else {
      user.name = name || user.name;
      user.picture = picture || user.picture;
      user.googleId = googleId || user.googleId;
      await user.save();
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Account is locked' });
      return;
    }

    await LoginHistory.create({
      userId: user._id,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    const jwtToken = generateToken(user._id.toString());
    console.log('✅ JWT token generated for user:', user.email);

    setTokenCookie(res, jwtToken);
    
    const cookieString = `token=${jwtToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookieString);
    
    console.log('✅ Cookie set for user:', user.email);
    console.log('✅ Request origin:', req.get('origin'));
    console.log('✅ Cookie string set:', cookieString.substring(0, 50) + '...');

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
        role: req.user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get user' });
  }
};

export const logout = (req: Request, res: Response): void => {
  clearTokenCookie(res);
  res.json({ message: 'Logout successful' });
};

