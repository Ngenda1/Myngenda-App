/**
 * Token-based Authentication System
 * 
 * This file adds JWT token support to work alongside session-based auth
 * for better support of external users.
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { pool } from './db';

// Secret key for JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || 'myngenda-jwt-secret-key';

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: any): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<{ success: boolean; user?: any; message?: string }> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, phone_number, role, status FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    const user = result.rows[0];
    
    // Convert from snake_case to camelCase for response
    return { 
      success: true, 
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phoneNumber: user.phone_number,
        role: user.role,
        status: user.status
      }
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, message: 'Invalid or expired token' };
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(header?: string): string | null {
  if (!header) return null;
  
  const parts = header.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  
  return null;
}

/**
 * Authentication middleware that works with both sessions and tokens
 */
export function authenticate(req: any, res: Response, next: NextFunction) {
  // First check for session authentication (for internal users)
  if (req.session && req.session.userId) {
    return next();
  }
  
  // If no session, check for token authentication (for external users)
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  // Verify token
  verifyToken(token)
    .then(result => {
      if (!result.success) {
        return res.status(401).json({ 
          success: false,
          message: result.message || 'Invalid token' 
        });
      }
      
      // Set user in request for use in protected routes
      req.user = result.user;
      
      next();
    })
    .catch(error => {
      console.error('Token authentication error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Authentication error' 
      });
    });
}