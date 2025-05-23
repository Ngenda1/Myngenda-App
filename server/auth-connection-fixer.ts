/**
 * Authentication Connection Fixer for Myngenda
 * 
 * This file fixes common authentication connection issues by:
 * 1. Setting proper CORS headers
 * 2. Maintaining session state
 * 3. Supporting both cookie and token authentication
 * 4. Providing detailed error handling
 */

import { Express, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Environment fallbacks for development
const JWT_SECRET = process.env.JWT_SECRET || 'myngenda-dev-secret-please-change-in-production';

// Auth connection middleware
export function setupAuthConnection(app: Express) {
  // Log all incoming requests for debugging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const protocol = req.secure ? 'https' : 'http';
    console.log(`[AUTH] ${req.method} ${protocol}://${req.hostname}${req.originalUrl} from ${req.ip}`);
    
    // Set headers for all responses to allow cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Add version header to show auth system is working
    res.setHeader('X-Myngenda-Auth-Version', '1.0.0');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  // Dual authentication support (both session and token)
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Session authentication (handled elsewhere)
    
    // Token authentication
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          // @ts-ignore
          req.tokenUser = decoded;
          console.log('[AUTH] Token authentication successful');
        } catch (err) {
          console.error('[AUTH] Token verification failed:', err);
        }
      }
    }
    
    // Debug endpoint to verify connection
    if (req.path === '/api/auth/check-connection') {
      return res.json({
        success: true,
        message: 'Connection to authentication server successful',
        mode: 'enhanced-connection-fixer-active',
        timestamp: new Date().toISOString(),
        clientIp: req.ip,
        protocol: req.protocol,
        host: req.hostname
      });
    }
    
    next();
  });
  
  // Authentication status debug endpoint
  app.get('/api/auth/debug', (req: Request, res: Response) => {
    console.log('[AUTH-DEBUG] Session:', req.session);
    console.log('[AUTH-DEBUG] Cookies:', req.cookies);
    
    // Return helpful debug information
    res.json({
      hasSession: !!req.session,
      hasToken: !!req.headers.authorization,
      clientInfo: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin || 'unknown'
      },
      serverInfo: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV || 'not-set'
      }
    });
  });

  console.log('[AUTH] Enhanced authentication connection system installed');
}

// Export an error handler for auth connection issues
export function authConnectionErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('[AUTH-ERROR]', err);
  
  // Don't expose error details in production
  const isProd = process.env.NODE_ENV === 'production';
  
  res.status(500).json({
    success: false,
    message: 'Authentication connection error',
    error: isProd ? 'See server logs for details' : err.message,
    // Include debug information in development
    debug: isProd ? undefined : {
      stack: err.stack,
      path: req.path,
      method: req.method,
      headers: req.headers
    }
  });
}