/**
 * Authentication Fix for Myngenda
 * 
 * This file properly handles user authentication with password hashing and session management.
 * It fixes the issues with registration/login disconnect and session persistence.
 */

import { Express, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

// Configure JWT for token authentication
const JWT_SECRET = process.env.JWT_SECRET || 'myngenda-jwt-secret-dev';
const TOKEN_EXPIRY = '30d'; // 30 days token expiry

export function setupAuthFix(app: Express) {
  console.log('Setting up authentication fix...');

  // Enhanced Login Route
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email and password are required' 
        });
      }
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log('Login failed: User not found', email);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
      
      // Compare password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        console.log('Login failed: Invalid password for user', email);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      
      // Set session data
      if (req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
        
        // Save session before responding
        req.session.save(err => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Session error' 
            });
          }
          
          // Return success with user data and token
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
        // If no session, still return success with token
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
      console.error('Login error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Login failed. Please try again.' 
      });
    }
  });

  // Enhanced Registration Route
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
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create user with hashed password
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        role,
        status: 'active',
        createdAt: new Date()
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );
      
      // Set session data
      if (req.session) {
        req.session.userId = newUser.id;
        req.session.userRole = newUser.role;
        
        // Save session before responding
        req.session.save(err => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Session error' 
            });
          }
          
          // Return success with user data and token
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
        // If no session, still return success with token
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
      console.error('Registration error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Registration failed. Please try again.' 
      });
    }
  });

  // Enhanced Current User Endpoint
  app.get('/api/auth/current-user', async (req: Request, res: Response) => {
    console.log('Current user endpoint called');
    console.log('Session:', req.session);
    
    // Get user ID from session
    const userId = req.session?.userId;
    console.log('Session ID:', req.sessionID);
    console.log('Session user ID:', userId);
    
    // Also check for JWT token in Authorization header
    let tokenUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        tokenUserId = decoded.id;
        console.log('Token user ID:', tokenUserId);
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }
    
    // Use session user ID or token user ID
    const userIdToUse = userId || tokenUserId;
    
    if (!userIdToUse) {
      console.log('No user ID in session or token, returning 401');
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    try {
      // Get user data
      const user = await storage.getUser(userIdToUse);
      
      if (!user) {
        console.log('User not found in database:', userIdToUse);
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Return user data without password
      const { password, ...userData } = user;
      console.log('Returning user data for ID:', userIdToUse);
      
      return res.json({
        success: true,
        user: userData
      });
    } catch (error) {
      console.error('Current user error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error retrieving current user' 
      });
    } finally {
      // Log session data for debugging
      console.log('Response for GET /api/auth/current-user - Session ID:', req.sessionID);
      console.log('Session data:', req.session);
    }
  });

  console.log('Authentication fix applied successfully!');
}