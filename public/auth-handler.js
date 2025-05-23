/**
 * Enhanced Authentication Handler for Myngenda
 * 
 * This system ensures reliable authentication across both Replit and Netlify deployments
 * by supporting both token-based and session-based auth.
 */

// Create a namespace for our enhanced authentication system
window.MyngendaAPI = (function() {
  // Storage keys
  const TOKEN_KEY = 'myngenda_auth_token';
  const USER_KEY = 'myngenda_user_data';
  
  // Your Replit backend URL - update this to match your actual deployment
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
  
  // Enhanced API request helper with better error handling and connection reliability
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
      
      console.log(`Making API request to: ${url}`, {
        method: mergedOptions.method,
        headers: mergedOptions.headers
      });
      
      // Make the request
      const response = await fetch(url, mergedOptions);
      clearTimeout(timeoutId);
      
      // Handle response
      if (response.ok) {
        return await response.json();
      }
      
      // Handle error responses
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed with status: ${response.status}`);
    } catch (error) {
      console.error('API request error:', error);
      
      // Handle network errors more gracefully
      if (error.name === 'AbortError') {
        throw new Error('Connection timeout. Please check your internet connection and try again.');
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  }
  
  // Login function with retry capability
  async function login(email, password) {
    try {
      // First try token login
      let result = await apiRequest('/api/token/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (result.success && result.token) {
        console.log('Token login successful');
        return storeAuthData(result.user, result.token);
      }
      
      throw new Error('Login failed');
    } catch (error) {
      console.error('Login attempt failed:', error);
      
      // If first login attempt fails, try fallback method
      try {
        console.log('Trying fallback login method...');
        const result = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        
        if (result.success && result.user) {
          // Generate a temporary token for this session
          const tempToken = `temp_${Date.now()}`;
          return storeAuthData(result.user, tempToken);
        }
      } catch (fallbackError) {
        console.error('Fallback login failed:', fallbackError);
      }
      
      clearAuthData();
      throw new Error('Login failed. Please check your credentials and try again.');
    }
  }
  
  // Register function with enhanced error handling
  async function register(userData) {
    try {
      // First try token registration
      const result = await apiRequest('/api/token/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (result.success && result.token) {
        console.log('Token registration successful');
        return storeAuthData(result.user, result.token);
      }
      
      throw new Error('Registration failed');
    } catch (error) {
      console.error('Registration attempt failed:', error);
      
      // If first registration attempt fails, try fallback method
      try {
        console.log('Trying fallback registration method...');
        const result = await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData)
        });
        
        if (result.success && result.user) {
          // Generate a temporary token for this session
          const tempToken = `temp_${Date.now()}`;
          return storeAuthData(result.user, tempToken);
        }
      } catch (fallbackError) {
        console.error('Fallback registration failed:', fallbackError);
      }
      
      clearAuthData();
      
      // Better user-facing error messages
      if (error.message.includes('already exists')) {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      }
      
      throw new Error('Registration failed. Please check your information and try again.');
    }
  }
  
  // Logout function
  function logout() {
    // Try to call logout endpoint (won't block if it fails)
    apiRequest('/api/auth/logout', { method: 'POST' })
      .catch(error => console.log('Logout endpoint error, continuing with local logout', error));
    
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
  
  // Redirect to dashboard function
  function redirectToDashboard() {
    // Check if we're already on the dashboard
    if (window.location.pathname.includes('/user/home')) {
      return; // Already on dashboard
    }
    
    // Redirect to dashboard - with HTML extension for Netlify static hosting
    window.location.href = '/user/home.html';
  }
  
  // Check authentication status and redirect appropriately
  function checkAuthStatus() {
    const isAuth = isAuthenticated();
    const isLoginPage = window.location.pathname.includes('login.html');
    const isRegisterPage = window.location.pathname.includes('register.html');
    const isPublicPage = isLoginPage || isRegisterPage || window.location.pathname === '/' 
                         || window.location.pathname === '/index.html';
    
    if (isAuth && isPublicPage && !isLoginPage && !isRegisterPage) {
      // User is authenticated and on public page - redirect to dashboard
      redirectToDashboard();
    } else if (!isAuth && !isPublicPage) {
      // User is not authenticated and trying to access protected page
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }
  
  // Initialize the auth system
  function init() {
    console.log('Initializing Myngenda authentication system...');
    
    // Check authentication on page load
    checkAuthStatus();
    
    // Look for token in URL (for Google auth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(atob(userData));
        storeAuthData(user, token);
        
        // Get redirect URL from localStorage or default to dashboard
        const redirectUrl = localStorage.getItem('auth_redirect') || '/user/home.html';
        localStorage.removeItem('auth_redirect');
        
        // Redirect to the appropriate page
        window.location.href = redirectUrl;
      } catch (e) {
        console.error('Error processing auth callback', e);
      }
    }
  }
  
  // Run initialization
  init();
  
  // Return public methods
  return {
    login,
    register,
    logout,
    googleAuth,
    isAuthenticated,
    getCurrentUser,
    redirectToDashboard,
    checkAuthStatus
  };
})();