import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';

export const getJWTSecret = (): string => {
  return process.env.JWT_SECRET || 'your-secret-key';
};

const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

export const generateToken = (userId: string): string => {
  const JWT_SECRET = getJWTSecret();
  // console.log('🔑 Generating token with JWT_SECRET:', JWT_SECRET ? JWT_SECRET.substring(0, 10) + '...' : 'NOT SET');
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE } as SignOptions
  );
};

export const setTokenCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions: any = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    domain: undefined 
  };
  
  if (isProduction && process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }
  
  res.cookie('token', token, cookieOptions);
  // console.log('✅ Cookie set with options:', {
  //   httpOnly: cookieOptions.httpOnly,
  //   secure: cookieOptions.secure,
  //   sameSite: cookieOptions.sameSite,
  //   path: cookieOptions.path,
  //   maxAge: cookieOptions.maxAge
  // });
};

export const clearTokenCookie = (res: Response): void => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
};

