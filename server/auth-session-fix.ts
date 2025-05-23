/**
 * Authentication Session Fix for Myngenda
 * 
 * This file provides fixes for the automatic logout issue by ensuring
 * that the user ID is properly stored in the session.
 */

import { Express, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT secret - should be environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'myngenda-jwt-secret-dev';

export function setupAuthSessionFix(app: Express) {
  // Middleware to properly store user ID in session
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Log all requests for debugging
    console.log(`[SESSION-FIX] ${req.method} ${req.path}`);
    
    // Skip for static assets to reduce noise
    if (req.path.startsWith('/public/') || req.path.endsWith('.js') || req.path.endsWith('.css')) {
      return next();
    }
    
    // Check for auth token in authorization header
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          // Store user info in session when token is valid
          if (req.session && typeof decoded === 'object' && decoded.id) {
            // Check if session userId is already set
            if (!req.session.userId) {
              console.log(`[SESSION-FIX] Setting userId in session: ${decoded.id}`);
              req.session.userId = decoded.id;
              req.session.userRole = decoded.role || 'user';
              req.session.save((err) => {
                if (err) console.error('[SESSION-FIX] Error saving session:', err);
              });
            }
          }
        } catch (err) {
          console.error('[SESSION-FIX] Token verification failed:', err);
        }
      }
    }
    
    next();
  });
  
  // Patch login route to ensure session is saved properly
  const originalLoginHandler = app._router.stack.find(
    (layer: any) => layer.route && layer.route.path === '/api/auth/login'
  );
  
  if (originalLoginHandler && originalLoginHandler.route) {
    console.log('[SESSION-FIX] Patching login route to ensure session persistence');
    
    const originalHandlers = originalLoginHandler.route.stack
      .filter((layer: any) => layer.method === 'post')
      .map((layer: any) => layer.handle);
    
    if (originalHandlers.length > 0) {
      // Clear existing handlers
      originalLoginHandler.route.stack = originalLoginHandler.route.stack
        .filter((layer: any) => layer.method !== 'post');
      
      // Add enhanced handler
      originalLoginHandler.route.post(async (req: Request, res: Response) => {
        try {
          // Call original handler but don't send response yet
          // @ts-ignore
          req.enhancedAuth = true; // Flag to prevent original handler from sending response
          
          // Capture original res.json to intercept it
          const originalJson = res.json;
          let responseData: any = null;
          
          res.json = function(data: any) {
            responseData = data;
            return res; // Don't actually send the response yet
          };
          
          // Call the original handler
          await originalHandlers[0](req, res, () => {});
          
          // Restore original res.json
          res.json = originalJson;
          
          // If login was successful and user data is in response
          if (responseData && responseData.success && responseData.user) {
            // Store user ID in session
            req.session.userId = responseData.user.id;
            req.session.userRole = responseData.user.role || 'user';
            
            // Ensure session is saved before sending response
            req.session.save((err) => {
              if (err) {
                console.error('[SESSION-FIX] Error saving session:', err);
                return res.status(500).json({ 
                  success: false, 
                  message: 'Session error. Please try again.' 
                });
              }
              
              console.log('[SESSION-FIX] Session saved successfully with userId:', req.session.userId);
              
              // Now send the original response
              return res.json(responseData);
            });
          } else {
            // For failed logins, just pass through the response
            return res.json(responseData);
          }
        } catch (error) {
          console.error('[SESSION-FIX] Error in enhanced login handler:', error);
          return res.status(500).json({
            success: false,
            message: 'Internal server error during login'
          });
        }
      });
    }
  }
  
  // Add a session verification endpoint
  app.get('/api/auth/verify-session', (req: Request, res: Response) => {
    const userId = req.session.userId;
    const userRole = req.session.userRole;
    
    console.log('[SESSION-FIX] Verifying session:', {
      sessionID: req.sessionID,
      userId: userId,
      userRole: userRole
    });
    
    if (userId) {
      res.json({
        authenticated: true,
        userId: userId,
        role: userRole,
        sessionID: req.sessionID
      });
    } else {
      res.json({
        authenticated: false,
        sessionID: req.sessionID
      });
    }
  });
  
  console.log('[SESSION-FIX] Authentication session fix installed');
}