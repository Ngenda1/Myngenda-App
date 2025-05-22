/**
 * Myngenda API Connection Handler
 * 
 * This script creates a reliable connection bridge between the frontend and backend
 * to solve persistent authentication issues with fetch() requests.
 */

// This script is injected into all HTML pages to provide a global connection handler
window.myngendaAPI = {
  // Main fetch handler that works in all environments
  fetch: async function(endpoint, options = {}) {
    try {
      // Ensure we get the base URL correctly
      const baseUrl = window.location.origin;
      const url = endpoint.startsWith('/') 
        ? `${baseUrl}${endpoint}` 
        : `${baseUrl}/${endpoint}`;
      
      // Default options with better credentials handling
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        mode: 'cors'
      };
      
      // Merge options with defaults
      const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...(options.headers || {})
        }
      };
      
      // Add auth token from localStorage if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        mergedOptions.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Add abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      mergedOptions.signal = controller.signal;
      
      console.log(`Making API request to: ${url}`, mergedOptions);
      
      // Make the actual fetch request
      const response = await fetch(url, mergedOptions);
      clearTimeout(timeoutId);
      
      // Log the response status
      console.log(`API response status: ${response.status}`);
      
      // Return the response
      return response;
    } catch (error) {
      // Handle network errors better
      console.error('API connection error:', error);
      
      // Convert AbortError into a more user-friendly message
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. The server is taking too long to respond.');
      }
      
      throw error;
    }
  },
  
  // Login helper
  login: async function(email, password) {
    const response = await this.fetch('/api/token/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    
    return { response, data };
  },
  
  // Registration helper
  register: async function(userData) {
    const response = await this.fetch('/api/token/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    
    return { response, data };
  },
  
  // Google auth helper
  googleAuth: function() {
    // Store the current page to redirect back after auth
    localStorage.setItem('auth_redirect', window.location.pathname);
    
    // Redirect to Google auth with a returnTo parameter
    window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(window.location.pathname)}`;
  },
  
  // Logout helper
  logout: function() {
    localStorage.removeItem('auth_token');
    window.location.href = '/login.html';
  }
};

// Listen for messages from the Google auth callback
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'AUTH_SUCCESS' && event.data.token) {
    localStorage.setItem('auth_token', event.data.token);
    
    // Get stored redirect or default to dashboard
    const redirect = localStorage.getItem('auth_redirect') || '/user/home';
    localStorage.removeItem('auth_redirect');
    
    window.location.href = redirect;
  }
});