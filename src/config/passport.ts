import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import userService from '../services/userService';

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await userService.findByGoogleId(profile.id);

          if (user) {
            return done(null, user);
          }

          // Check if user exists with the same email
          user = await userService.findByEmail(profile.emails?.[0]?.value || '');

          if (user) {
            // Link Google account to existing user
            const updatedUser = await userService.update(user.id, {
              googleId: profile.id,
              avatarUrl: profile.photos?.[0]?.value || null
            });
            return done(null, updatedUser);
          }

          // Create new user
          const newUser = await userService.create({
            email: profile.emails?.[0]?.value || '',
            googleId: profile.id,
            name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
            avatarUrl: profile.photos?.[0]?.value || null
          });

          return done(null, newUser);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, false);
        }
      }
    )
  );
}

// Configure JWT Strategy
if (process.env.JWT_SECRET) {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await userService.findById(payload.userId);
          
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        } catch (error) {
          console.error('JWT Strategy error:', error);
          return done(error, false);
        }
      }
    )
  );
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await userService.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Deserialize user error:', error);
    done(error, null);
  }
});

export default passport;