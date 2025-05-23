/**
 * Enhanced Session Configuration for Myngenda
 * 
 * This file provides a robust session setup that resolves quick logout issues
 * by ensuring session persistence and proper cookie configuration.
 */

import session from 'express-session';
import { Express } from 'express';
import connectPg from 'connect-pg-simple';

// Session secret - should be set in environment variables in production
const SESSION_SECRET = process.env.SESSION_SECRET || 'myngenda-session-secret-dev';

// Define custom session data interface
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

export function setupEnhancedSession(app: Express) {
  // Create PostgreSQL session store
  const PgSession = connectPg(session);
  
  // Configure session with longer duration and proper cookie settings
  const sessionConfig: session.SessionOptions = {
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions',
      createTableIfMissing: true, // Create sessions table if it doesn't exist
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'myngenda.sid', // Custom cookie name to avoid conflicts
    cookie: {
      httpOnly: true,
      // Only use secure cookies in production (https)
      secure: process.env.NODE_ENV === 'production',
      // Set a long expiration time (30 days)
      maxAge: 30 * 24 * 60 * 60 * 1000,
      // Allow cookies to be sent from Netlify to Replit
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
  };
  
  // Special handling for development environment
  if (process.env.NODE_ENV !== 'production') {
    console.log('Configuring session for development environment');
    if (sessionConfig.cookie) {
      sessionConfig.cookie.secure = false;
    }
  }
  
  // Apply session middleware
  app.use(session(sessionConfig));
  
  console.log('Enhanced session configuration applied');
  
  // Add a session debug endpoint
  app.get('/api/auth/session-debug', (req, res) => {
    // Show session info but not sensitive data
    res.json({
      sessionID: req.sessionID,
      hasSession: !!req.session,
      isAuthenticated: req.session && req.session.userId !== undefined,
      cookie: {
        maxAge: req.session?.cookie?.maxAge,
        expires: req.session?.cookie?.expires,
        secure: req.session?.cookie?.secure,
        httpOnly: req.session?.cookie?.httpOnly,
        sameSite: req.session?.cookie?.sameSite
      }
    });
  });
}