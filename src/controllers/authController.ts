import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import userService from '../services/userService';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';
import { generateToken } from '../middleware/auth';
import type { User as PrismaUser } from '@prisma/client';

export class AuthController {
  // Register new user
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          error: 'User already exists',
          message: 'A user with this email already exists'
        });
        return;
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          error: 'Password validation failed',
          details: passwordValidation.errors
        });
        return;
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const newUser = await userService.create({
        email,
        passwordHash: hashedPassword,
        name
      });

      // Generate token
      const token = generateToken(newUser);

      // Return user data (without password hash)
      const userResponse = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatarUrl: newUser.avatarUrl,
        createdAt: newUser.createdAt
      };

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to register user'
      });
    }
  }

  // Login user
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await userService.findByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
        return;
      }

      // Compare password
      const isPasswordValid = await comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
        return;
      }

      // Generate token
      const token = generateToken(user);

      // Return user data (without password hash)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      };

      res.json({
        message: 'Login successful',
        user: userResponse,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to login'
      });
    }
  }

  // Get current user profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as PrismaUser;
      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      // Return user data (without password hash)
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({
        user: userResponse
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user profile'
      });
    }
  }

  // Update user profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as PrismaUser;
      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { name, email } = req.body;
      const updateData: any = {};

      if (name && name !== user.name) {
        updateData.name = name;
      }

      if (email && email !== user.email) {
        // Check if email is already taken
        const existingUser = await userService.findByEmail(email);
        if (existingUser && existingUser.id !== user.id) {
          res.status(409).json({
            error: 'Email already taken',
            message: 'Another user is already using this email'
          });
          return;
        }
        updateData.email = email;
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          error: 'No changes provided',
          message: 'No valid fields to update'
        });
        return;
      }

      // Update user
      const updatedUser = await userService.update(user.id, updateData);
      if (!updatedUser) {
        res.status(404).json({
          error: 'User not found',
          message: 'User could not be updated'
        });
        return;
      }

      // Return updated user data (without password hash)
      const userResponse = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
        updatedAt: updatedUser.updatedAt
      };

      res.json({
        message: 'Profile updated successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update profile'
      });
    }
  }

  // Change password
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as PrismaUser;
      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Verify current password
      if (!user.passwordHash) {
        res.status(400).json({
          error: 'Cannot change password',
          message: 'This account uses social login only'
        });
        return;
      }

      const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Current password is incorrect'
        });
        return;
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          error: 'Password validation failed',
          details: passwordValidation.errors
        });
        return;
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password in database
      await userService.update(user.id, {
        passwordHash: hashedNewPassword
      });

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to change password'
      });
    }
  }

  // Logout (client-side token removal)
  async logout(_req: Request, res: Response): Promise<void> {
    res.json({
      message: 'Logged out successfully'
    });
  }
}

export default new AuthController();