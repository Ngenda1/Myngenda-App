/**
 * Standalone Authentication System for Myngenda
 * 
 * This is a completely independent authentication system that works
 * without requiring complex backend connections.
 */

// Create a namespace for our authentication system
window.MyngendaAuth = (function() {
  // Storage keys
  const TOKEN_KEY = 'myngenda_auth_token';
  const USER_KEY = 'myngenda_user_data';
  
  // Demo credentials for testing
  const DEMO_USERS = [
    {
      id: 1,
      email: 'admin@myngenda.com',
      password: 'admin123', // In a real system, this would be hashed
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      profileImageUrl: '/icons/myngenda-icon.png'
    },
    {
      id: 2,
      email: 'driver@myngenda.com',
      password: 'driver123',
      firstName: 'Sample',
      lastName: 'Driver',
      role: 'driver',
      profileImageUrl: '/icons/myngenda-icon.png'
    },
    {
      id: 3,
      email: 'user@myngenda.com',
      password: 'user123',
      firstName: 'Sample',
      lastName: 'Customer',
      role: 'user',
      profileImageUrl: '/icons/myngenda-icon.png'
    }
  ];
  
  // Generate a simple token
  function generateToken(userId) {
    return btoa(`${userId}:${Date.now()}:myngenda-auth`);
  }
  
  // Store user data and token
  function storeAuthData(user, token) {
    localStorage.setItem(TOKEN_KEY, token);
    
    // Store user data without the password
    const userData = { ...user };
    delete userData.password;
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    
    return { user: userData, token };
  }
  
  // Clear auth data
  function clearAuthData() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  
  // Check if user is authenticated
  function isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
  
  // Get current user
  function getCurrentUser() {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.error('Error parsing user data', e);
      return null;
    }
  }
  
  // Login function
  async function login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Find user
          const user = DEMO_USERS.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === password
          );
          
          if (!user) {
            return reject({ message: 'Invalid email or password' });
          }
          
          // Generate and store token
          const token = generateToken(user.id);
          const result = storeAuthData(user, token);
          
          resolve(result);
        } catch (error) {
          reject({ message: 'Login failed. Please try again.' });
        }
      }, 800); // Simulate network delay
    });
  }
  
  // Register function
  async function register(userData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Check if email already exists
          if (DEMO_USERS.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            return reject({ message: 'Email is already registered' });
          }
          
          // Create new user (in a real system, this would be saved to DB)
          const newUser = {
            id: DEMO_USERS.length + 1,
            ...userData
          };
          
          // In this demo, we're not actually saving to DEMO_USERS array
          // since it would reset on page reload
          
          // Generate and store token
          const token = generateToken(newUser.id);
          const result = storeAuthData(newUser, token);
          
          resolve(result);
        } catch (error) {
          reject({ message: 'Registration failed. Please try again.' });
        }
      }, 1000); // Simulate network delay
    });
  }
  
  // Logout function
  function logout() {
    clearAuthData();
    window.location.href = '/login.html';
  }
  
  // Google auth simulation
  function googleAuth() {
    // Simulate Google login (in a real app this would redirect to Google)
    setTimeout(() => {
      // Use the first demo user for the simulation
      const user = DEMO_USERS[2]; // Regular user
      const token = generateToken(user.id);
      storeAuthData(user, token);
      
      // Redirect to dashboard
      window.location.href = '/user/home';
    }, 1500); // Simulate delay for Google auth
  }
  
  // Return public methods
  return {
    login,
    register,
    logout,
    googleAuth,
    isAuthenticated,
    getCurrentUser
  };
})();