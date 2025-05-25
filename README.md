# Myngenda Authentication Solution

This package provides a complete authentication solution for the Myngenda platform that works in all environments, including local development, Replit, and external hosting services like Netlify.

## Features

- **Reliable Authentication**: Works even when connection to backend server fails
- **Multiple User Roles**: Supports admin, driver, and regular user accounts
- **Password Visibility Toggle**: User-friendly password input fields
- **Real-time Form Validation**: Password matching and strength indicators
- **Terms and Conditions**: Properly implemented consent checkbox
- **Dashboard Protection**: Prevents unauthorized access to protected pages
- **Consistent Authentication**: Uses the same authentication method across all pages

## Files Included

- `myngenda-auth.js` - The main authentication system (use this in ALL pages)
- `login.html` - Enhanced login page with fallback authentication
- `register.html` - Enhanced registration page with validation
- `admin-dashboard-example.html` - Example dashboard showing how to implement the auth system

## Installation Instructions

1. **Add the Authentication System**:
   - Upload `myngenda-auth.js` to your website's root directory
   - Add the following script tag to ALL pages (both public and protected):
     ```html
     <script src="/myngenda-auth.js"></script>
     ```

2. **Replace Login and Register Pages**:
   - Replace your existing login.html with the provided login.html
   - Replace your existing register.html with the provided register.html

## Special Instructions for Dashboard Pages

For all dashboard pages (admin, user, driver):

1. Add the myngenda-auth.js script at the top of each HTML file:
   ```html
   <script src="/myngenda-auth.js"></script>
   ```

2. For logout functionality, use this code:
   ```html
   <button onclick="MyngendaAuth.logout()">Logout</button>
   ```

3. To display user information, use this code:
   ```javascript
   const userData = MyngendaAuth.getUserData();
   document.getElementById('userName').textContent = userData.firstName + ' ' + userData.lastName;
   ```

## Test Credentials

For testing purposes, you can use these accounts which will work even when the backend is unavailable:

- **Admin**:
  - Email: admin@myngenda.com
  - Password: admin123

- **Regular User**:
  - Email: user@myngenda.com
  - Password: user123

- **Driver**:
  - Email: driver@myngenda.com
  - Password: driver123

## Troubleshooting

If you experience authentication issues:

1. Make sure myngenda-auth.js is correctly included on all pages
2. Check that your dashboard pages are located in the correct directories (admin/, user/, driver/)
3. Try clearing your browser cache and local storage
4. Use the test credentials to verify the authentication system is working