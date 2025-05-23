/**
 * Direct Authentication Handler for Myngenda
 * 
 * This connects directly to the Replit backend for actual account persistence.
 */

// Create a namespace for our authentication system
window.MyngendaAPI = (function() {
  // Storage keys
  const TOKEN_KEY = 'myngenda_auth_token';
  const USER_KEY = 'myngenda_user_data';
  
  // Your Replit backend URL
  const API_BASE_URL = 'https://myngenda.replit.app';
  
  // Store user data and token
  function storeAuthData(user, token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { user, token };
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
  
  // API request helper
  async function apiRequest(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      
      // Default options
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        mode: 'cors'
      };
      
      // Merge options
      const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...(options.headers || {})
        }
      };
      
      // Add auth token if available
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        mergedOptions.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Add abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      mergedOptions.signal = controller.signal;
      
      console.log(`Making API request to: ${url}`, mergedOptions);
      
      // Make the request
      const response = await fetch(url, mergedOptions);
      clearTimeout(timeoutId);
      
      // Handle response
      if (response.ok) {
        return await response.json();
      }
      
      // Handle error responses
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API request failed');
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
  
  // Login function
  async function login(email, password) {
    try {
      const result = await apiRequest('/api/token/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (result.success && result.token) {
        return storeAuthData(result.user, result.token);
      }
      
      throw new Error('Login failed');
    } catch (error) {
      clearAuthData();
      throw error;
    }
  }
  
  // Register function
  async function register(userData) {
    try {
      const result = await apiRequest('/api/token/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (result.success && result.token) {
        return storeAuthData(result.user, result.token);
      }
      
      throw new Error('Registration failed');
    } catch (error) {
      clearAuthData();
      throw error;
    }
  }
  
  // Logout function
  function logout() {
    clearAuthData();
    window.location.href = '/login.html';
  }
  
  // Google auth function
  function googleAuth() {
    // Store the return URL for after auth
    localStorage.setItem('auth_redirect', window.location.pathname);
    // Redirect to Google auth
    window.location.href = `${API_BASE_URL}/api/auth/google`;
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
