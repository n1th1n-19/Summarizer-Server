import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
});

// Authentication rate limiter (stricter for sensitive operations)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour per IP
  message: {
    error: 'Upload rate limit exceeded',
    message: 'Too many file uploads. Please wait before uploading more files.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI operations rate limiter (for summarization, chat, embeddings)
export const aiOperationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI operations per hour per IP
  message: {
    error: 'AI operations rate limit exceeded',
    message: 'Too many AI requests. Please wait before making more AI-powered requests.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search rate limiter
export const searchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 searches per hour per IP
  message: {
    error: 'Search rate limit exceeded',
    message: 'Too many search requests. Please wait before searching again.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a custom key generator for authenticated users (use user ID instead of IP)
export const createUserBasedLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
}) => {
  return rateLimit({
    ...options,
    keyGenerator: (req: Request): string => {
      // Use user ID if authenticated, otherwise fall back to IP
      const user = (req as any).user;
      return user ? `user_${user.id}` : req.ip || 'anonymous';
    },
    message: {
      error: 'Rate limit exceeded',
      message: options.message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// User-specific rate limiters
export const userAIOperationsLimiter = createUserBasedLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 AI operations per hour per user
  message: 'Too many AI requests from your account. Please wait before making more requests.',
});

export const userUploadLimiter = createUserBasedLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour per user
  message: 'Too many file uploads from your account. Please wait before uploading more files.',
});

// Rate limit handler for custom responses
export const rateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    error: 'Rate limit exceeded',
    message: 'Too many requests, please try again later.',
    timestamp: new Date().toISOString(),
  });
};

// Middleware to add rate limit info to response headers
export const addRateLimitHeaders = (
  _req: Request,
  res: Response,
  next: () => void
) => {
  // Add custom rate limit headers
  res.setHeader('X-RateLimit-Policy', 'General: 100/15min, Auth: 5/15min, Upload: 10/1h, AI: 50/1h');
  next();
};