/**
 * Session Type Definitions for Express
 * 
 * This file extends the Express session to include user information
 * which fixes TypeScript errors and ensures proper session handling.
 */

// Extend session interface to include user data
declare module 'express-session' {
  interface SessionData {
    userId: string;
    userRole: string;
  }
}