/**
 * Myngenda Redirect Handler
 * 
 * This file handles redirects for authentication and dashboard access
 */

(function() {
  // Use the correct Replit URL
  const API_BASE_URL = 'https://myngenda.replit.app';
  
  // Check if the user is authenticated
  function checkAuthentication() {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('myngenda_auth_token');
    return !!token;
  }
  
  // Get the current user's role
  function getUserRole() {
    const userData = localStorage.getItem('user_data') || localStorage.getItem('myngenda_user_data');
    if (!userData) return null;
    
    try {
      const user = JSON.parse(userData);
      return user.role;
    } catch (e) {
      console.error('Error parsing user data', e);
      return null;
    }
  }
  
  // Handle the redirect to the appropriate dashboard
  function handleRedirect() {
    // Check if user is authenticated
    if (checkAuthentication()) {
      const role = getUserRole();
      
      if (role === 'admin') {
        // Redirect to admin dashboard
        window.location.href = '/admin/dashboard.html';
      } else {
        // Redirect to user dashboard
        window.location.href = '/user/home.html';
      }
    } else {
      // Not authenticated, redirect to login
      window.location.href = '/login.html';
    }
  }
  
  // Google authentication redirect
  function googleAuth() {
    // Store current path for after authentication
    localStorage.setItem('auth_redirect', window.location.pathname);
    
    // Redirect to Google auth endpoint with the correct URL
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  }
  
  // Expose methods
  window.MyngendaRedirect = {
    handleRedirect,
    googleAuth
  };
})();