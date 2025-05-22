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
          
          // Get where to redirect from query param or use default
          const returnTo = req.query.returnTo || '/user/home';
          
          // More reliable approach that sends authorization to parent window
          // This prevents the redirect to landing page issue
          const script = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Authentication Successful</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f5f5f5;
                  flex-direction: column;
                }
                .success-card {
                  background: white;
                  border-radius: 8px;
                  padding: 30px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 400px;
                }
                h1 {
                  color: #4CAF50;
                  margin-top: 0;
                }
                .redirect-text {
                  margin: 20px 0;
                  color: #666;
                }
                .spinner {
                  border: 4px solid #f3f3f3;
                  border-top: 4px solid #4CAF50;
                  border-radius: 50%;
                  width: 30px;
                  height: 30px;
                  margin: 20px auto;
                  animation: spin 1s linear infinite;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              </style>
            </head>
            <body>
              <div class="success-card">
                <h1>Successfully Signed In</h1>
                <div class="spinner"></div>
                <p class="redirect-text">Redirecting you to the dashboard...</p>
              </div>
              
              <script>
                // This is the most reliable way to handle Google Auth with JWT tokens
                // Store token in localStorage first
                localStorage.setItem('auth_token', '${token}');
                
                // Notify the opener window if this was opened as a popup
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'AUTH_SUCCESS',
                    token: '${token}'
                  }, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  // If not a popup, redirect directly
                  window.location.href = '${returnTo}';
                }
                
                // Fallback redirect after a delay
                setTimeout(() => {
                  window.location.href = '${returnTo}';
                }, 2000);
              </script>
            </body>
            </html>
          `;
          return res.send(script);
        }
        
        // If somehow we don't have a token, redirect to a static path
        res.redirect('/user/home');
      } catch (error) {
        console.error('Error processing Google callback:', error);
        res.redirect('/login?error=google_callback_error');
      }
    }
  );
}