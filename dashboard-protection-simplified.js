/**
 * Myngenda Dashboard Protection
 * Works with the simplified standalone login system
 */

// Check if user is authenticated
function isAuthenticated() {
    try {
        const userData = localStorage.getItem('myngenda_user_data');
        const token = localStorage.getItem('myngenda_auth_token');
        return !!userData && !!token;
    } catch (error) {
        return false;
    }
}

// Get user data
function getUserData() {
    try {
        const userData = localStorage.getItem('myngenda_user_data');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        return null;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('myngenda_user_data');
    localStorage.removeItem('myngenda_auth_token');
    window.location.href = '/login.html';
}

// Check access immediately
(function checkAccess() {
    // Check if authenticated
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }
    
    // Get user data
    const userData = getUserData();
    if (!userData) {
        window.location.href = '/login.html';
        return;
    }
    
    // Check role for admin pages
    const isAdminPage = window.location.pathname.toLowerCase().includes('/admin/');
    if (isAdminPage && userData.role !== 'admin') {
        window.location.href = '/';
        return;
    }
})();

// Add global logout function
window.logoutUser = logout;