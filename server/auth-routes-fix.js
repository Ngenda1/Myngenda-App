/**
 * Authentication Routes Fix for Myngenda
 * 
 * This module provides enhanced authentication routes that properly handle
 * user registration, login, and session management.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Add this function to your server/index.js or server/index.ts file
function setupAuthRoutes(app, storage) {
  // Enhanced Login Route - Properly maintains session
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('Login attempt:', req.body.email);
      
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
        console.log('Login failed: User not found:', email);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
      
      // Compare password
      let isPasswordValid = false;
      
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } catch (error) {
        console.error('Password comparison error:', error);
        // Fallback comparison for development/testing
        isPasswordValid = (password === user.password);
      }
      
      if (!isPasswordValid) {
        console.log('Login failed: Invalid password for user:', email);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'myngenda-jwt-secret',
        { expiresIn: '30d' }
      );
      
      // Store user ID in session
      if (req.session) {
        req.session.userId = user.id;
        req.session.userRole = user.role;
        
        // Save session explicitly
        req.session.save(err => {
          if (err) {
            console.error('Session save error:', err);
          } else {
            console.log('Session saved successfully for user:', user.id);
          }
        });
      }
      
      // Return user data with token
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
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Login failed. Please try again.' 
      });
    }
  });

  // Enhanced Registration Route - Properly hashes passwords
  app.post('/api/auth/register', async (req, res) => {
    try {
      console.log('Registration attempt:', req.body.email);
      
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
        process.env.JWT_SECRET || 'myngenda-jwt-secret',
        { expiresIn: '30d' }
      );
      
      // Store user ID in session
      if (req.session) {
        req.session.userId = newUser.id;
        req.session.userRole = newUser.role;
        
        // Save session explicitly
        req.session.save(err => {
          if (err) {
            console.error('Session save error:', err);
          } else {
            console.log('Session saved successfully for user:', newUser.id);
          }
        });
      }
      
      // Return user data with token
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
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Registration failed. Please try again.' 
      });
    }
  });

  // Enhanced Current User Endpoint - Supports both session and token auth
  app.get('/api/auth/current-user', async (req, res) => {
    try {
      console.log('Current user endpoint called');
      
      // Get user ID from session
      let userId = req.session?.userId;
      console.log('Session user ID:', userId);
      
      // If not in session, check for token
      if (!userId) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(
              token, 
              process.env.JWT_SECRET || 'myngenda-jwt-secret'
            );
            userId = decoded.id;
            console.log('Token user ID:', userId);
            
            // Sync session with token
            if (req.session) {
              req.session.userId = userId;
              req.session.userRole = decoded.role;
              req.session.save(err => {
                if (err) console.error('Session save error:', err);
              });
            }
          } catch (error) {
            console.error('Token verification failed:', error);
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
      console.error('Current user error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error retrieving current user' 
      });
    }
  });

  console.log('Enhanced authentication routes configured');
}

module.exports = { setupAuthRoutes };