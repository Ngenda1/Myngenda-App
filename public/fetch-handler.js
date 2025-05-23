/**
 * Myngenda Enhanced Fetch Handler
 * 
 * This module provides enhanced fetch capabilities for making API requests
 * to the Myngenda backend with proper authentication.
 */

// Create a namespace for our fetch utilities
window.MyngendaFetch = (function() {
  // Your Replit backend URL - update this when deploying
  const API_BASE_URL = 'https://myngenda.replit.app';
  
  // Helper function to get auth token
  function getAuthToken() {
    return localStorage.getItem('auth_token') || localStorage.getItem('myngenda_auth_token');
  }
  
  // Fetch helper with authentication
  async function authFetch(endpoint, options = {}) {
    try {
      // Build the full URL
      const url = endpoint.startsWith('http') 
        ? endpoint 
        : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      // Add auth token if available
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make the request
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });
      
      // Handle unauthorized
      if (response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('myngenda_auth_token');
        window.location.href = '/login.html';
        return null;
      }
      
      // Parse JSON if available
      if (response.headers.get('content-type')?.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // Google auth helper
  function googleAuth() {
    // Save current path for redirect after auth
    localStorage.setItem('auth_redirect', window.location.pathname);
    
    // Redirect to Google auth with a returnTo parameter
    window.location.href = `${API_BASE_URL}/api/auth/google?returnTo=${encodeURIComponent(window.location.pathname)}`;
  }
  
  // Logout helper
  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('myngenda_auth_token');
    window.location.href = '/login.html';
  }
  
  // Return public methods
  return {
    fetch: authFetch,
    googleAuth,
    logout
  };
})();