/**
 * Google Authentication Integration
 * 
 * This file adds Google OAuth support to the Myngenda application
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import { generateToken } from './token-auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.NODE_ENV === 'production' 
  ? 'https://myngenda.com/api/auth/google/callback'
  : 'http://localhost:5000/api/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth credentials not provided. Google authentication will not work.');
}

export function setupGoogleAuth() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return;
  }

  // Configure Google Strategy
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Extract profile information
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const firstName = profile.name?.givenName || profile.displayName.split(' ')[0];
      const lastName = profile.name?.familyName || profile.displayName.split(' ').slice(1).join(' ');
      const profileImage = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
      
      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }
      
      console.log(`Attempting to authenticate Google user: ${email}`);
      
      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with Google profile data
        console.log(`Creating new user from Google profile: ${email}`);
        
        // Generate a random password (user will never use this as they'll login with Google)
        const randomPassword = Math.random().toString(36).slice(-10);
        
        user = await storage.createUser({
          firstName,
          lastName,
          email,
          password: randomPassword, // Will be hashed by the createUser function
          phoneNumber: 'Not provided', // Required field but not provided by Google
          role: 'user',
          status: 'active' // Auto-activate users authenticated through Google
        });
        
        console.log(`Created new user from Google profile: ${user.id}`);
      } else {
        console.log(`Found existing user for Google login: ${user.id}`);
      }
      
      // Generate JWT token for the user
      const token = generateToken(user);
      
      // Add token to user object
      const userWithToken = {
        ...user,
        token
      };
      
      // If we have a session, store user ID
      if (req.session) {
        req.session.userId = user.id;
        await new Promise<void>((resolve) => {
          req.session.save(() => resolve());
        });
      }
      
      return done(null, userWithToken);
    } catch (error) {
      console.error('Google authentication error:', error);
      return done(error, null);
    }
  }));
  
  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

export function setupGoogleRoutes(app: any) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return;
  }
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Google auth routes
  app.get('/api/auth/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account'
    })
  );
  
  // Google auth callback
  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: '/login?error=google_login_failed',
      session: true
    }),
    (req: any, res: any) => {
      try {
        // User has been authenticated and is in req.user
        const { token } = req.user;
        
        // Store token in cookies for web clients
        if (token) {
          res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
        }
        
        // Redirect to dashboard after successful login
        res.redirect('/dashboard');
      } catch (error) {
        console.error('Error processing Google callback:', error);
        res.redirect('/login?error=google_callback_error');
      }
    }
  );
}