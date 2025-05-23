/**
 * Myngenda Authentication Connector
 * 
 * This module provides authentication functions for Myngenda
 * that work for both internal and external users:
 * - Internal users on Replit use session cookies
 * - External users on Netlify use token-based authentication
 */

// API base URL - dynamically determined based on environment
const API_BASE_URL = detectApiBaseUrl();

/**
 * Detects the appropriate API base URL based on current environment
 */
function detectApiBaseUrl() {
  // Check if we're on the same domain as the API (Replit hosting)
  if (window.location.hostname.includes('replit.app') || 
      window.location.hostname.includes('replit.dev')) {
    return ''; // Same domain, use relative URLs
  }
  
  // Check for Netlify domain or custom domain
  if (window.location.hostname.includes('netlify.app') || 
      window.location.hostname === 'myngenda.com' ||
      window.location.hostname === 'www.myngenda.com') {
    // Make sure this points to your actual Replit app URL
    return 'https://myngenda-app.replit.app'; 
  }
  
  // Local development
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000'; // Local API server
  }
  
  // Default to Replit production API for unknown environments
  return 'https://myngenda-app.replit.app';
}

/**
 * Store authentication data (token and user info)
 */
function storeAuthData(user, token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  }
  localStorage.setItem('user_data', JSON.stringify(user));
}

/**
 * Clear authentication data (for logout)
 */
function clearAuthData() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}

/**
 * Check if user is authenticated via token
 */
function isAuthenticated() {
  return !!localStorage.getItem('auth_token');
}

/**
 * Get the current user data from localStorage
 */
function getCurrentUser() {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
}

/**
 * Make an authenticated API request
 * This automatically adds the auth token if available
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  
  // Ensure headers object exists
  options.headers = options.headers || {};
  
  // Add token if available
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add content type for JSON requests
  if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
  }
  
  // Build full URL (handle both absolute and relative endpoints)
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  try {
    console.log('Making API request to:', url);
    const response = await fetch(url, options);
    
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      clearAuthData();
      window.location.href = '/login.html';
      return null;
    }
    
    // Parse JSON response
    if (response.headers.get('content-type')?.includes('application/json')) {
      return await response.json();
    }
    
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Log in a user (works for both internal and external users)
 */
async function login(email, password) {
  try {
    console.log('Attempting to log in with:', email);
    
    // First try token-based login (for external users)
    const tokenUrl = `${API_BASE_URL}/api/token/login`;
    console.log('Trying token login at:', tokenUrl);
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Token login response:', tokenData);
    
    if (tokenData.success) {
      // Store token and user data
      storeAuthData(tokenData.user, tokenData.token);
      return { success: true, user: tokenData.user };
    }
    
    // If token login fails, try session-based login (for internal users)
    const sessionUrl = `${API_BASE_URL}/api/auth/login`;
    console.log('Trying session login at:', sessionUrl);
    
    const sessionResponse = await fetch(sessionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Include cookies for session auth
    });
    
    const sessionData = await sessionResponse.json();
    console.log('Session login response:', sessionData);
    
    if (sessionData.success) {
      // Store user data (no token for session auth)
      storeAuthData(sessionData.user);
      return { success: true, user: sessionData.user };
    }
    
    // Both login methods failed
    return { 
      success: false, 
      message: sessionData.message || tokenData.message || 'Login failed' 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Connection error. Please try again.' };
  }
}

/**
 * Register a new user (works for both internal and external users)
 */
async function register(userData) {
  try {
    console.log('Attempting to register with:', userData.email);
    
    // First try token-based registration (for external users)
    const tokenUrl = `${API_BASE_URL}/api/token/register`;
    console.log('Trying token registration at:', tokenUrl);
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Token registration response:', tokenData);
    
    if (tokenData.success) {
      // Store token and user data
      storeAuthData(tokenData.user, tokenData.token);
      return { success: true, user: tokenData.user };
    }
    
    // If token registration fails, try session-based registration (for internal users)
    const sessionUrl = `${API_BASE_URL}/api/auth/register`;
    console.log('Trying session registration at:', sessionUrl);
    
    const sessionResponse = await fetch(sessionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
      credentials: 'include' // Include cookies for session auth
    });
    
    const sessionData = await sessionResponse.json();
    console.log('Session registration response:', sessionData);
    
    if (sessionData.success) {
      // Store user data (no token for session auth)
      storeAuthData(sessionData.user);
      return { success: true, user: sessionData.user };
    }
    
    // Both registration methods failed
    return { 
      success: false, 
      message: sessionData.message || tokenData.message || 'Registration failed' 
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Connection error. Please try again.' };
  }
}

/**
 * Log out the current user (works for both internal and external users)
 */
async function logout() {
  try {
    // For session-based auth, call logout endpoint
    await fetch(`${API_BASE_URL}/api/auth/logout`, { 
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage data
    clearAuthData();
    window.location.href = '/login.html';
  }
}

/**
 * Redirect to the appropriate dashboard based on user role
 */
function redirectToDashboard() {
  // Check if user is authenticated
  if (isAuthenticated() || document.cookie.includes('connect.sid')) {
    // Get user data
    const userData = getCurrentUser();
    
    // Redirect based on role
    if (userData && userData.role === 'admin') {
      console.log('Redirecting admin to dashboard');
      window.location.href = '/admin/dashboard.html';
    } else {
      console.log('Redirecting user to home');
      window.location.href = '/user/home.html';
    }
  }
}

// Export all functions for use in the application
window.MyngendaAuth = {
  login,
  register,
  logout,
  isAuthenticated,
  getCurrentUser,
  apiRequest,
  redirectToDashboard
};