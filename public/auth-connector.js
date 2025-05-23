/**
 * Enhanced Authentication Connector for Myngenda
 * 
 * This file provides a reliable connection between frontend and backend
 * with support for both cookie-based and token-based authentication.
 */

(function() {
  // Create the global MyngendaAuth object
  window.MyngendaAuth = {};

  // Detects the appropriate API base URL based on current environment
  function detectApiBaseUrl() {
    const hostname = window.location.hostname;
    
    // If running on Replit
    if (hostname.includes('replit.app')) {
      return `${window.location.protocol}//${window.location.host}`;
    }
    
    // If running on Netlify or custom domain
    if (hostname.includes('netlify.app') || 
        hostname === 'myngenda.com' || 
        hostname === 'www.myngenda.com') {
      return 'https://myngenda.replit.app'; // Use the correct Replit URL
    }
    
    // If running locally
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Default fallback
    return 'https://myngenda.replit.app';
  }

  // Store authentication data (token and user info)
  function storeAuthData(user, token) {
    localStorage.setItem('myngenda_user', JSON.stringify(user));
    localStorage.setItem('myngenda_token', token);
    
    // Also store in sessionStorage for tab-specific access
    sessionStorage.setItem('myngenda_user', JSON.stringify(user));
    sessionStorage.setItem('myngenda_token', token);
  }

  // Clear authentication data (for logout)
  function clearAuthData() {
    localStorage.removeItem('myngenda_user');
    localStorage.removeItem('myngenda_token');
    sessionStorage.removeItem('myngenda_user');
    sessionStorage.removeItem('myngenda_token');
  }

  // Check if user is authenticated via token
  function isAuthenticated() {
    return !!localStorage.getItem('myngenda_token');
  }

  // Get the current user data from localStorage
  function getCurrentUser() {
    const userJson = localStorage.getItem('myngenda_user');
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  // Make an authenticated API request
  // This automatically adds the auth token if available
  async function apiRequest(endpoint, options = {}) {
    const apiBaseUrl = detectApiBaseUrl();
    const url = `${apiBaseUrl}${endpoint}`;
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add authorization header if token exists
    const token = localStorage.getItem('myngenda_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Create request options
    const requestOptions = {
      ...options,
      headers,
      credentials: 'include' // Always include credentials for cookies
    };
    
    console.log(`Making ${options.method || 'GET'} request to: ${url}`);
    
    try {
      const response = await fetch(url, requestOptions);
      
      // Handle connection errors
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        
        // Special handling for authentication errors
        if (response.status === 401) {
          // Clear auth data on unauthorized
          clearAuthData();
        }
        
        // Try to parse error response
        const errorData = await response.json().catch(() => ({
          message: 'Unknown error occurred'
        }));
        
        return {
          success: false,
          status: response.status,
          message: errorData.message || `Error: ${response.statusText}`
        };
      }
      
      // Parse successful response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Custom error handling for fetch errors
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          message: 'Connection failed. Please check your internet connection and try again.'
        };
      }
      
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Log in a user
  async function login(email, password) {
    try {
      // Log the login attempt (without password)
      console.log(`Login attempt for: ${email}`);
      
      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      console.log('Login result:', result);
      
      if (result.success && result.token) {
        storeAuthData(result.user, result.token);
        return {
          success: true,
          user: result.user
        };
      }
      
      return {
        success: false,
        message: result.message || 'Login failed. Please check your credentials.'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  // Register a new user
  async function register(userData) {
    try {
      console.log('Registration attempt for:', userData.email);
      
      const result = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      console.log('Registration result:', result);
      
      if (result.success && result.token) {
        // Auto-login after registration by storing auth data
        storeAuthData(result.user, result.token);
        return {
          success: true,
          user: result.user
        };
      }
      
      return {
        success: false,
        message: result.message || 'Registration failed. Please try again.'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  // Log out the current user
  async function logout() {
    try {
      // Call logout endpoint
      await apiRequest('/api/auth/logout', {
        method: 'POST'
      });
      
      // Always clear local auth data regardless of server response
      clearAuthData();
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear auth data even if API call fails
      clearAuthData();
      
      return {
        success: true,
        message: 'Logged out locally. Server sync failed.'
      };
    }
  }

  // Get the current authenticated user from the API
  async function fetchCurrentUser() {
    try {
      const result = await apiRequest('/api/auth/current-user');
      
      if (result.success && result.user) {
        // Update stored user data with latest from server
        const token = localStorage.getItem('myngenda_token');
        if (token) {
          storeAuthData(result.user, token);
        }
        
        return {
          success: true,
          user: result.user
        };
      }
      
      return {
        success: false,
        message: result.message || 'Failed to get current user'
      };
    } catch (error) {
      console.error('Fetch current user error:', error);
      return {
        success: false,
        message: 'Failed to get current user. Please try again.'
      };
    }
  }

  // Google authentication
  function googleAuth() {
    const apiBaseUrl = detectApiBaseUrl();
    window.location.href = `${apiBaseUrl}/api/auth/google`;
  }

  // Redirect to the appropriate dashboard based on user role
  function redirectToDashboard() {
    const user = getCurrentUser();
    
    if (!user) {
      console.error('No user found, redirecting to login');
      window.location.href = '/login.html';
      return;
    }
    
    console.log('Redirecting to dashboard for role:', user.role);
    
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

  // Check auth status on page load
  function checkAuthStatus() {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      console.log('User is authenticated:', user);
      
      // Validate token by fetching current user
      fetchCurrentUser().then(result => {
        if (!result.success) {
          console.log('Token validation failed, logging out');
          clearAuthData();
        }
      });
    } else {
      console.log('User is not authenticated');
    }
  }

  // Verify connection to backend
  async function verifyConnection() {
    try {
      const apiBaseUrl = detectApiBaseUrl();
      console.log('Verifying connection to:', apiBaseUrl);
      
      const response = await fetch(`${apiBaseUrl}/api/auth/check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Connection verified:', data);
        return {
          success: true,
          data
        };
      }
      
      return {
        success: false,
        message: `Connection failed: ${response.status} ${response.statusText}`
      };
    } catch (error) {
      console.error('Connection verification failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Export public methods
  window.MyngendaAuth = {
    login,
    register,
    logout,
    getCurrentUser,
    isAuthenticated,
    apiRequest,
    googleAuth,
    redirectToDashboard,
    checkAuthStatus,
    verifyConnection,
    fetchCurrentUser
  };

  // Auto-initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    console.log('MyngendaAuth initialized');
    checkAuthStatus();
    
    // If the URL has ?debug=true, verify connection
    if (window.location.search.includes('debug=true')) {
      verifyConnection().then(result => {
        console.log('Connection test result:', result);
      });
    }
  });
})();