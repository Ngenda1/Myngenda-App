/**
 * Myngenda Authentication System
 * 
 * This file provides authentication routes for user registration, login,
 * and token validation.
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Create router
const router = Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'myngenda_jwt_secret_key';

// User storage (replace with database queries when database is set up)
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  createdAt: Date;
}

const users: User[] = [];

// Register endpoint
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    
    console.log('Registration attempt:', { firstName, lastName, email, phone });
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date()
    };
    
    // Save user (to in-memory array for now)
    users.push(newUser);
    
    // Log the newly created user (without password)
    console.log('User created:', {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role
    });
    
    // Return success response (without sending the password back)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login endpoint
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    // Find user by email
    const user = users.find(user => user.email === email);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create and sign JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user data
router.get('/auth/user', async (req: Request, res: Response) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    
    // Find user by id
    const user = users.find(user => user.id === decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data (without password)
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// Add test accounts for development
if (process.env.NODE_ENV !== 'production') {
  const addTestAccount = async (email: string, password: string, firstName: string, lastName: string, role: string) => {
    const existingUser = users.find(user => user.email === email);
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      users.push({
        id: Date.now().toString(),
        firstName,
        lastName,
        email,
        phone: '1234567890',
        password: hashedPassword,
        role,
        createdAt: new Date()
      });
      
      console.log(`Test account created: ${email}`);
    }
  };
  
  // Add admin and user test accounts
  addTestAccount('admin@myngenda.com', 'admin123', 'Admin', 'User', 'admin');
  addTestAccount('user@myngenda.com', 'user123', 'Test', 'User', 'user');
}

// Export individual functions for use in routes.ts
export async function registerUser(userData: any) {
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  // Create new user
  const newUser: User = {
    id: Date.now().toString(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phone: userData.phoneNumber || userData.phone || '',
    password: hashedPassword,
    role: userData.role || 'user',
    createdAt: new Date()
  };
  
  // Save user (to in-memory array for now)
  users.push(newUser);
  
  return {
    id: newUser.id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
    phoneNumber: newUser.phone,
    role: newUser.role,
    status: 'active'
  };
}

export async function authenticateUser(email: string, password: string) {
  // Find user by email
  const user = users.find(user => user.email === email);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phone,
    role: user.role,
    status: 'active'
  };
}

export async function verifyUserEmail(userId: string) {
  // Find user by id
  const user = users.find(user => user.id === userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // In a real implementation, we would update user's email verification status
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phone,
    role: user.role,
    status: 'active'
  };
}

export async function approveDriverAccount(userId: string) {
  // Find user by id
  const user = users.find(user => user.id === userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Update user role to driver
  user.role = 'driver';
  
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phone,
    role: user.role,
    status: 'active'
  };
}

export default router;