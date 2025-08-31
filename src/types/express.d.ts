import { User } from './user';
import { Express } from 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};