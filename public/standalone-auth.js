/**
 * Standalone Authentication Solution for Myngenda
 * 
 * This file contains a complete, self-contained authentication system
 * that works reliably across all browsers.
 */

// Create a self-executing function to avoid polluting the global scope
(function() {
  // Create the global auth object
  window.MyngendaAuth = {};
  
  // Configuration
  const config = {
    apiUrl: 'https://myngenda.replit.app',
    tokenName: 'myngenda_auth_token',
    userData: 'myngenda_user_data'
  };
  
  // Store user data in localStorage
  function storeUserData(userData, token) {
    if (!userData || !token) return false;
    
    try {
      localStorage.setItem(config.userData, JSON.stringify(userData));
      localStorage.setItem(config.tokenName, token);
      return true;
    } catch (error) {
      console.error('Failed to store authentication data:', error);
      return false;
    }
  }
  
  // Get stored user data
  function getUserData() {
    try {
      const data = localStorage.getItem(config.userData);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }
  
  function getToken() {
  return localStorage.getItem(config.tokenName);

  }
  
  // Clear authentication data
  function clearAuthData() {
    localStorage.removeItem(config.userData);
    localStorage.removeItem(config.tokenName);
  }
  
  // Check if user is authenticated
  function isAuthenticated() {
    return !!getToken() && !!getUserData();
  }
  
  // Make an API request with retry capability
  async function apiRequest(endpoint, options = {}) {
    const url = `${config.apiUrl}${endpoint}`;
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add auth token if available
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Request options
    const requestOptions = {
      ...options,
      headers,
      credentials: 'include'
    };
    
    console.log(`Making ${options.method || 'GET'} request to: ${url}`);
    
    // Implement retry logic
    const maxRetries = 3;
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        const response = await fetch(url, requestOptions);
        const data = await response.json().catch(() => ({ 
          success: false, 
          message: 'Invalid response format'
        }));
        
        if (!response.ok) {
          console.error(`API error (${response.status}):`, data.message || response.statusText);
          
          // Handle unauthorized responses
          if (response.status === 401) {
            clearAuthData();
          }
          
          return {
            success: false,
            status: response.status,
            message: data.message || `Error: ${response.statusText}`
          };
        }
        
        return data;
      } catch (error) {
        attempts++;
        console.warn(`Request failed (attempt ${attempts}/${maxRetries}):`, error.message);
        
        if (attempts >= maxRetries) {
          console.error('Max retries reached');
          return {
            success: false,
            message: 'Connection failed. Please check your internet connection and try again.'
          };
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }
  }
  
  // Register a new user
  async function register(userData) {
    try {
      console.log('Attempting to register user:', userData.email);
      
      const result = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (result.success && result.token && result.user) {
        // Store authentication data
        storeUserData(result.user, result.token);
        console.log('Registration successful');
        return { success: true, user: result.user };
      }
      
      return {
        success: false,
        message: result.message || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  }
  
  // Login user
  async function login(email, password) {
    try {
      console.log('Attempting to login user:', email);
      
      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (result.success && result.token && result.user) {
        // Store authentication data
        storeUserData(result.user, result.token);
        console.log('Login successful');
        return { success: true, user: result.user };
      }
      
      return {
        success: false,
        message: result.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  }
  
  // Logout user
  function logout() {
    clearAuthData();
    // Redirect to login page
    window.location.href = '/login.html';
    return { success: true };
  }
  
  // Redirect user to appropriate dashboard based on role
  function redirectToDashboard() {
    const user = getUserData();
    
    if (!user) {
      console.error('No user data found, redirecting to login');
      window.location.href = '/login.html';
      return;
    }
    
    console.log('Redirecting user to dashboard for role:', user.role);
    
    switch (user.role) {
      case 'admin':
        window.location.href = '/admin/dashboard.html';
        break;
      case 'driver':
        window.location.href = '/driver/dashboard.html';
        break;
      case 'user':
      default:
        window.location.href = '/user/home.html';
        break;
    }
  }
  
  // Check authentication on page load
  function checkAuth() {
    // If on a protected page and not authenticated, redirect to login
    const isProtectedPage = window.location.pathname.includes('/admin/') || 
                            window.location.pathname.includes('/user/') ||
                            window.location.pathname.includes('/driver/');
    
    if (isProtectedPage && !isAuthenticated()) {
      console.log('Unauthenticated access to protected page, redirecting to login');
      window.location.href = '/login.html';
      return;
    }
    
    // If on login page but already authenticated, redirect to dashboard
    const isLoginPage = window.location.pathname.includes('/login.html');
    
    if (isLoginPage && isAuthenticated()) {
      console.log('Already authenticated, redirecting to dashboard');
      redirectToDashboard();
      return;
    }
  }
  
  // Public API
  window.MyngendaAuth = {
    register,
    login,
    logout,
    isAuthenticated,
    getUserData,
    redirectToDashboard,
    apiRequest
  };
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    console.log('MyngendaAuth initialized');
    checkAuth();
    
    // Check if debug mode is enabled
    if (window.location.search.includes('debug=true')) {
      console.log('Debug mode enabled');
      console.log('Authentication status:', isAuthenticated() ? 'Authenticated' : 'Not authenticated');
      console.log('User data:', getUserData());
    }
  });
})();
