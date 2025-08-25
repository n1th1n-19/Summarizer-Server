import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace req objects with parsed and transformed data
      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.code === 'invalid_type' ? undefined : req.body?.[err.path[1]] || req.query?.[err.path[1]] || req.params?.[err.path[1]]
        }));

        res.status(400).json({
          error: 'Validation failed',
          message: 'The request contains invalid data',
          details: errors
        });
        return;
      }

      // Handle unexpected errors
      console.error('Unexpected validation error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation'
      });
    }
  };
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  // Sanitize string inputs by trimming whitespace
  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return obj.trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};