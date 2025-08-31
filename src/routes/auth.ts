import express from 'express';
import passport from '../config/passport';
import authController from '../controllers/authController';
import { authenticateToken, generateToken } from '../middleware/auth';
import { validateRequest, sanitizeInput } from '../middleware/zodValidation';
import { updateProfileSchema } from '../schemas';
import type { User } from '../types/user';

const router = express.Router();

// @route   GET /auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, authController.getProfile);

// @route   PUT /auth/profile
// @desc    Update user profile (name only)
// @access  Private
router.put('/profile', authenticateToken, sanitizeInput, validateRequest(updateProfileSchema), authController.updateProfile);

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
      console.log('📝 OAuth callback received');
      const user = req.user as any;
      console.log('👤 User from OAuth:', user ? `${user.email} (ID: ${user.id})` : 'No user');
      
      if (!user) {
        console.error('❌ No user found in OAuth callback');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Generate JWT token
      console.log('🔑 Generating token for OAuth user...');
      const token = generateToken(user);
      
      // Prepare user data without sensitive info
      const { passwordHash, ...safeUserData } = user as any;
      void passwordHash; // Suppress unused variable warning
      console.log('📦 Prepared safe user data:', { id: safeUserData.id, email: safeUserData.email });
      
      // Redirect to frontend with token and user data
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const encodedUserData = encodeURIComponent(JSON.stringify(safeUserData));
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&user=${encodedUserData}`;
      console.log(`🚀 Redirecting to: ${redirectUrl.substring(0, 100)}...`);
      
      res.redirect(redirectUrl);
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

  const { passwordHash, ...userWithoutPassword } = req.user as User;
  void passwordHash; // Suppress unused variable warning
  res.json({ user: userWithoutPassword });
});

// @route   GET /auth/verify
// @desc    Verify token validity
// @access  Private
router.get('/verify', authenticateToken, (req, res) => {
  if (!req.user) {
    console.log('🔒 Token verification failed - no user found');
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  
  const user = req.user as User;
  console.log(`✅ Token verification successful for user: ${user.email} (ID: ${user.id})`);
  res.json({ 
    valid: true, 
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt
    }
  });
});

export default router;