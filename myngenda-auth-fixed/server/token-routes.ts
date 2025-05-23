/**
 * Token-based Authentication Routes
 * 
 * Adds token-based authentication routes for external users
 */

import { Router, Request, Response } from 'express';
import { registerUser, authenticateUser } from './auth';
import { generateToken, verifyToken, extractTokenFromHeader } from './token-auth';

// Create router
const router = Router();

/**
 * Register a user with token authentication
 * POST /api/token/register
 */
router.post('/register', async (req: Request, res: Response) => {
  console.log('Token registration endpoint called');
  console.log('Request body:', req.body);
  
  try {
    const { firstName, lastName, email, password, phoneNumber, role } = req.body;
    
    // Call the existing registerUser function to handle registration logic
    const user = await registerUser({ 
      firstName, 
      lastName, 
      email, 
      password, 
      phoneNumber, 
      role 
    });
    
    console.log('User created successfully:', user.id);
    
    // Generate JWT token for external users
    const token = generateToken(user);
    
    // Also set session data for internal users if session exists
    if (req.session) {
      req.session.userId = user.id;
      
      // Save session if possible
      await new Promise<void>((resolve, reject) => {
        req.session.save(err => {
          if (err) {
            console.error('Error saving session:', err);
          }
          resolve();
        });
      });
    }
    
    // Return user data with token for external users
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status
      },
      token: token // Include token for external users
    });
  } catch (error: any) {
    console.error('Token registration failed:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Registration failed' 
    });
  }
});

/**
 * Login a user with token authentication
 * POST /api/token/login
 */
router.post('/login', async (req: Request, res: Response) => {
  console.log('Token login endpoint called');
  console.log('Request body:', req.body);
  
  try {
    const { email, password } = req.body;
    console.log('Attempting to authenticate user with email:', email);
    
    // Use the existing authenticateUser function
    const user = await authenticateUser(email, password);
    console.log('User authenticated successfully:', user.id);
    
    // Generate JWT token for external users
    const token = generateToken(user);
    
    // Also set session data for internal users if session exists
    if (req.session) {
      req.session.userId = user.id;
      
      // Save session if possible
      await new Promise<void>((resolve, reject) => {
        req.session.save(err => {
          if (err) {
            console.error('Error saving session:', err);
          }
          resolve();
        });
      });
    }
    
    // Return user data with token for external users
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status
      },
      token: token // Include token for external users
    });
  } catch (error: any) {
    console.error('Token authentication failed:', error.message);
    res.status(401).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Get current user from token
 * GET /api/token/current-user
 */
router.get('/current-user', async (req: Request, res: Response) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  try {
    const result = await verifyToken(token);
    
    if (result.success && result.user) {
      return res.status(200).json({
        success: true,
        message: 'Authentication valid',
        user: result.user
      });
    } else {
      return res.status(401).json({
        success: false,
        message: result.message || 'Invalid token'
      });
    }
  } catch (error: any) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get current user: ' + error.message
    });
  }
});

export default router;