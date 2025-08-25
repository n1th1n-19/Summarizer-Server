import express from 'express';
import passport from '../config/passport';
import authController from '../controllers/authController';
import { authenticateToken, generateToken } from '../middleware/auth';
import { validateRequest, sanitizeInput } from '../middleware/zodValidation';
import { authLimiter } from '../middleware/rateLimiting';
import { 
  registerSchema, 
  loginSchema, 
  updateProfileSchema, 
  changePasswordSchema 
} from '../schemas';
import type { User as PrismaUser } from '@prisma/client';

const router = express.Router();


// @route   POST /auth/register
// @desc    Register new user
// @access  Public
router.post('/register', authLimiter, sanitizeInput, validateRequest(registerSchema), authController.register);

// @route   POST /auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, sanitizeInput, validateRequest(loginSchema), authController.login);

// @route   GET /auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, authController.getProfile);

// @route   PUT /auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, sanitizeInput, validateRequest(updateProfileSchema), authController.updateProfile);

// @route   POST /auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, sanitizeInput, validateRequest(changePasswordSchema), authController.changePassword);

// @route   POST /auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, authController.logout);

// Google OAuth routes
// @route   GET /auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// @route   GET /auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
    session: false 
  }),
  (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Generate JWT token
      const token = generateToken(user);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_callback_failed`);
    }
  }
);

// @route   GET /auth/me
// @desc    Get current user info (alternative to /profile)
// @access  Private
router.get('/me', authenticateToken, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { passwordHash, ...userWithoutPassword } = req.user as PrismaUser;
  res.json({ user: userWithoutPassword });
});

// @route   GET /auth/verify
// @desc    Verify token validity
// @access  Private
router.get('/verify', authenticateToken, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  
  const user = req.user as PrismaUser;
  res.json({ 
    valid: true, 
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});

export default router;