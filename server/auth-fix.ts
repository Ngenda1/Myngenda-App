/**
 * Comprehensive Authentication Fix for Myngenda
 * 
 * This file fixes multiple authentication issues:
 * 1. Session persistence across tabs and page reloads
 * 2. Login problems after registration
 * 3. "Failed to fetch" connection errors
 */

import { Express, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Configure JWT for token authentication
const JWT_SECRET = process.env.JWT_SECRET || 'myngenda-jwt-secret-dev';
const TOKEN_EXPIRY = '30d'; // 30 days token expiry

interface UserData {
  id: string;
  email: string;
  password: string;
  role: string;
  [key: string]: any;
}

export function setupAuthenticationFix(app: Express, storage: any) {
  // Add enhanced debugging for all authentication routes
  app.use('/api/auth', (req: Request, res: Response, next: NextFunction) => {
    console.log(`[AUTH-FIX] ${req.method} ${req.path} REQUEST`);
    console.log('[AUTH-FIX] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[AUTH-FIX] Body:', JSON.stringify(req.body, null, 2));
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to log responses
    res.json = function(body: any) {
      console.log('[AUTH-FIX] RESPONSE:', JSON.stringify(body, null, 2));
      return originalJson.call(this, body);
    };
    
    next();
  });
  
  // Enhanced user registration with better password handling
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role = 'user' } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      // Ensure consistent password hashing
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Store raw password temporarily for immediate login
      const tempPassword = password;
      
      // Create user with PROPERLY hashed password
      const newUser = await storage.createUser({
        email,
        password: hashedPassword, // Store hashed password
        firstName: firstName || '',
        lastName: lastName || '',
        role: role,
        verified: true, // Auto-verify for now
        status: 'active',
        createdAt: new Date()
      });
      
      console.log('[AUTH-FIX] User created successfully:', newUser.id);
      
      // Auto login after registration by generating a token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      
      // Store user in session for session-based auth
      if (req.session) {
        req.session.userId = newUser.id;
        req.session.userRole = newUser.role;
        
        req.session.save((err) => {
          if (err) {
            console.error('[AUTH-FIX] Error saving session after registration:', err);
          }
          
          // Return both user data and token
          return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
              id: newUser.id,
              email: newUser.email,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              role: newUser.role
            },
            token
          });
        });
      } else {
        // If no session, just return the token
        return res.status(201).json({
          success: true,
          message: 'User registered successfully',
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role
          },
          token
        });
      }
    } catch (error) {
      console.error('[AUTH-FIX] Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  });
  
  // Enhanced login with proper password comparison and token generation
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      // Debug login attempt
      console.log(`[AUTH-FIX] Login attempt for email: ${email}`);
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log(`[AUTH-FIX] User not found: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      // Debug password verification
      console.log('[AUTH-FIX] Stored password hash:', user.password);
      console.log('[AUTH-FIX] Comparing with provided password');
      
      // Safely compare password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        console.log('[AUTH-FIX] Password invalid');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }
      
      console.log('[AUTH-FIX] Password valid, generating token');
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      
      // Store user in session
      if (req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
        
        req.session.save((err) => {
          if (err) {
            console.error('[AUTH-FIX] Error saving session:', err);
          }
          
          console.log('[AUTH-FIX] Session saved with user ID:', user.id);
          
          // Return user data and token
          return res.json({
            success: true,
            message: 'Login successful',
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            },
            token
          });
        });
      } else {
        // If no session, just return the token
        return res.json({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          token
        });
      }
    } catch (error) {
      console.error('[AUTH-FIX] Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  });
  
  // Enhanced authentication middleware that checks both session and JWT
  const enhancedAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let userId = null;
      
      // First check session
      if (req.session && req.session.userId) {
        userId = req.session.userId;
        console.log('[AUTH-FIX] User authenticated via session:', userId);
      }
      
      // Then check Authorization header for JWT
      if (!userId) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
            userId = decoded.id;
            console.log('[AUTH-FIX] User authenticated via JWT:', userId);
            
            // Sync session with token for consistent auth
            if (req.session) {
              req.session.userId = userId;
              await new Promise<void>((resolve, reject) => {
                req.session.save((err) => {
                  if (err) {
                    console.error('[AUTH-FIX] Error saving session from JWT:', err);
                    reject(err);
                  } else {
                    resolve();
                  }
                });
              });
            }
          } catch (error) {
            console.error('[AUTH-FIX] JWT verification failed:', error);
          }
        }
      }
      
      if (userId) {
        // Get full user data
        const user = await storage.getUser(userId);
        if (user) {
          // @ts-ignore
          req.user = user;
          return next();
        }
      }
      
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    } catch (error) {
      console.error('[AUTH-FIX] Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  };
  
  // Replace or add enhanced authentication middleware
  app.use('/api/protected', enhancedAuthMiddleware);
  
  // Add the current user endpoint
  app.get('/api/auth/current-user', async (req: Request, res: Response) => {
    try {
      let userId = null;
      
      // Check session first
      if (req.session && req.session.userId) {
        userId = req.session.userId;
        console.log('[AUTH-FIX] Current user from session:', userId);
      }
      
      // Then check token
      if (!userId) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
            userId = decoded.id;
            console.log('[AUTH-FIX] Current user from JWT:', userId);
          } catch (error) {
            console.error('[AUTH-FIX] JWT verification failed in current-user:', error);
          }
        }
      }
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Return user data without password
      const { password, ...userData } = user;
      return res.json({
        success: true,
        user: userData
      });
    } catch (error) {
      console.error('[AUTH-FIX] Current user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving current user'
      });
    }
  });
  
  // Add the auth check endpoint
  app.get('/api/auth/check', (req: Request, res: Response) => {
    const userId = req.session?.userId;
    const authHeader = req.headers.authorization;
    
    return res.json({
      success: true,
      authenticated: !!userId || !!authHeader,
      method: userId ? 'session' : (authHeader ? 'token' : 'none')
    });
  });
  
  console.log('[AUTH-FIX] Comprehensive authentication fix installed');
}