/**
 * Session Fix for Myngenda
 * 
 * This file provides enhanced session configuration that resolves the login persistence issues
 * and ensures proper session handling across page reloads and browser tabs.
 */

import session from 'express-session';
import { Express } from 'express';
import connectPg from 'connect-pg-simple';

// Define session data structure
declare module 'express-session' {
  interface SessionData {
    userId: string;
    userRole: string;
  }
}

// Session secret - should be set in environment variables in production
const SESSION_SECRET = process.env.SESSION_SECRET || 'myngenda-session-secret-dev';

export function setupSessionFix(app: Express) {
  console.log('Setting up session middleware with PostgreSQL');
  
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
      // Allow cookies to be sent cross-domain
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const
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
}