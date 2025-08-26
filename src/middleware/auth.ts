import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import userService from '../services/userService';
import type { User as PrismaUser } from '@prisma/client';

export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

// JWT Authentication Middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || req.query.token as string; // Bearer TOKEN or query param

    if (!token) {
      res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined');
      res.status(500).json({ 
        error: 'Internal server error', 
        message: 'Authentication configuration error' 
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    console.log(`🔍 JWT decoded - looking for user ID: ${decoded.userId}`);
    
    // Get user from database
    let user;
    try {
      user = await userService.findById(decoded.userId);
    } catch (dbError) {
      console.error(`❌ Database error when looking for user ${decoded.userId}:`, dbError);
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Database connection error' 
      });
      return;
    }
    
    if (!user) {
      console.error(`❌ User ${decoded.userId} not found during token validation`);
      res.status(401).json({ 
        error: 'Access denied', 
        message: 'Invalid token - user not found' 
      });
      return;
    }
    
    console.log(`✅ Authentication successful for user: ${user.email}`);

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: 'Access denied', 
        message: 'Invalid token' 
      });
      return;
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Authentication failed' 
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || req.query.token as string;

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    const user = await userService.findById(decoded.userId);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

// Admin role check middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      error: 'Access denied', 
      message: 'Authentication required' 
    });
    return;
  }

  // Note: Add admin role field to user model if needed
  // For now, check if user email contains admin domain
  const adminDomains = process.env.ADMIN_DOMAINS?.split(',') || [];
  const isAdmin = adminDomains.some(domain => (req.user as PrismaUser)!.email.endsWith(domain));

  if (!isAdmin) {
    res.status(403).json({ 
      error: 'Access denied', 
      message: 'Admin privileges required' 
    });
    return;
  }

  next();
};

// Generate JWT token
export const generateToken = (user: PrismaUser): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email
  };

  console.log(`🔑 Generating JWT for user: ${user.email} (ID: ${user.id})`);
  const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);
  console.log(`✅ JWT generated successfully`);
  
  return token;
};

// Verify JWT token (utility function)
export const verifyToken = (token: string): JWTPayload => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, jwtSecret) as JWTPayload;
};