import { Request, Response } from 'express';
import userService from '../services/userService';
import { User } from '../types/user';

export class AuthController {

  // Get current user profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;
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

  // Update user profile (name only, email managed by Google)
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;
      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      const { name } = req.body;
      
      if (!name || name === user.name) {
        res.status(400).json({
          error: 'No changes provided',
          message: 'No valid fields to update'
        });
        return;
      }

      // Update user
      const updatedUser = await userService.update(user.id, { name });
      if (!updatedUser) {
        res.status(404).json({
          error: 'User not found',
          message: 'User could not be updated'
        });
        return;
      }

      // Return updated user data
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

  // Logout (client-side token removal)
  async logout(_req: Request, res: Response): Promise<void> {
    res.json({
      message: 'Logged out successfully'
    });
  }
}

export default new AuthController();