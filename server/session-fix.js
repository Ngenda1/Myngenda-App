/**
 * Session Configuration Fix for Myngenda
 * 
 * This module enhances your session configuration to prevent the automatic logout issue.
 * Add this to your server's main file to fix the admin dashboard logout issue.
 */

const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');

// Add this function to your server/index.js or server/index.ts file
function setupEnhancedSession(app) {
  console.log('Setting up session middleware with PostgreSQL');
  
  // Create PostgreSQL session store
  const PgSession = connectPgSimple(session);
  
  // Enhanced session configuration
  const sessionConfig = {
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'myngenda-session-secret',
    resave: false,
    saveUninitialized: false,
    name: 'myngenda.sid', // Custom cookie name
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax'
    }
  };
  
  // In development, allow non-secure cookies
  if (process.env.NODE_ENV !== 'production') {
    sessionConfig.cookie.secure = false;
  }
  
  // Apply session middleware
  app.use(session(sessionConfig));
  
  console.log('Enhanced session configuration applied');
}

module.exports = { setupEnhancedSession };