/**
 * Myngenda Dashboard Protection
 * 
 * This script protects dashboard pages to ensure only authenticated users can access them.
 * Include this script at the top of any protected page.
 */

(function() {
    // Constants
    const TOKEN_NAME = 'myngenda_auth_token';
    const USER_DATA = 'myngenda_user_data';
    const LOGIN_PAGE = '/login.html';
    
    // Get authentication data
    function getUserData() {
        try {
            const data = localStorage.getItem(USER_DATA);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }
    
    // Check if user is authenticated
    function isAuthenticated() {
        const token = localStorage.getItem(TOKEN_NAME);
        const userData = getUserData();
        return !!token && !!userData;
    }
    
    // Check access and redirect if needed
    function checkAccess() {
        if (!isAuthenticated()) {
            // Not authenticated - redirect to login
            window.location.href = LOGIN_PAGE;
            return;
        }
        
        // Check user role for role-specific pages
        const currentPath = window.location.pathname;
        const userData = getUserData();
        
        if (currentPath.includes('/admin/') && userData.role !== 'admin') {
            // Not an admin - redirect to home
            window.location.href = '/';
            return;
        }
        
        if (currentPath.includes('/driver/') && userData.role !== 'driver') {
            // Not a driver - redirect to home
            window.location.href = '/';
            return;
        }
    }
    
    // Run access check immediately
    checkAccess();
})();