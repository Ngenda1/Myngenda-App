/**
 * Dashboard Protection Script
 * 
 * This simple script verifies if a user is authenticated before
 * allowing access to dashboard pages. If not authenticated,
 * it redirects to the login page.
 * 
 * Usage: Include this script at the top of any dashboard page
 */

(function() {
    // Run immediately when the page loads
    function checkAuth() {
        // Check for authentication token
        const token = localStorage.getItem('myngenda_auth_token');
        const userData = localStorage.getItem('myngenda_user_data');
        
        // If no token or user data, redirect to login
        if (!token || !userData) {
            console.log("No authentication found. Redirecting to login...");
            window.location.href = '/login.html';
            return;
        }
        
        try {
            // Try to parse the user data
            const user = JSON.parse(userData);
            
            // Check if user has a role
            if (!user || !user.role) {
                console.log("Invalid user data. Redirecting to login...");
                window.location.href = '/login.html';
                return;
            }
            
            // For admin pages, check if user is an admin
            if (window.location.pathname.includes('/admin/') && user.role !== 'admin') {
                console.log("User is not an admin. Redirecting to user dashboard...");
                window.location.href = '/user/dashboard.html';
                return;
            }
        } catch (error) {
            console.error("Error parsing user data:", error);
            // Clear invalid data and redirect to login
            localStorage.removeItem('myngenda_auth_token');
            localStorage.removeItem('myngenda_user_data');
            window.location.href = '/login.html';
        }
    }
    
    // Check authentication status when the page loads
    checkAuth();
})();