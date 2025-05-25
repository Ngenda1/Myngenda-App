# Myngenda Backend Connection Guide

This guide explains how to connect your frontend authentication system to your Replit backend API, allowing users to register real accounts and log in with them.

## Files Included

1. **API-Connected Login**: `api-connected-login.html`
   - Connects to your Replit backend for real user authentication
   - Maintains support for test accounts (admin@myngenda.com/user@myngenda.com)
   - Automatically detects the environment (development vs. production)

2. **API-Connected Registration**: `api-connected-register.html`
   - Sends registration data to your Replit backend API
   - Creates real user accounts in your database
   - Validates form data before submission

## Implementation Steps

### 1. Update Login Page

1. Locate your existing `login.html` file in the `public` folder
2. Replace its contents with the code from `api-connected-login.html`
3. This enables real user authentication while keeping test accounts

### 2. Update Registration Page

1. Locate your existing `register.html` file in the `public` folder
2. Replace its contents with the code from `api-connected-register.html`
3. This allows users to create real accounts in your database

### 3. Ensure Backend API Endpoints Exist

Your Replit backend needs to have these API endpoints:

1. **Login Endpoint**: `/api/auth/login`
   - Method: POST
   - Expects: `{ email, password }`
   - Returns: `{ user, token }`

2. **Registration Endpoint**: `/api/auth/register`
   - Method: POST
   - Expects: `{ firstName, lastName, email, phone, password }`
   - Returns: `{ user, message }`

### 4. Netlify Configuration (Already Set)

Your Netlify configuration already has the correct proxy rules in `_redirects`:

```
# Netlify redirects file - proxies all API requests to Replit
/api/*  https://myngenda-app.replit.app/api/:splat  200!
/*      /index.html                                 200
```

This ensures that API requests from your frontend are properly routed to your Replit backend.

## How It Works

1. **API Base URL Detection**:
   - The code automatically detects if it's running locally or in production
   - Local development: Calls directly to `https://myngenda-app.replit.app/api`
   - Production: Calls to `/api` which is proxied through Netlify

2. **Authentication Flow**:
   - When a user logs in, the system first checks if it's a test account
   - If not, it sends the credentials to your backend API
   - If successful, it stores the user data and token in localStorage
   - Then redirects to the appropriate dashboard based on user role

3. **Registration Flow**:
   - User fills out the registration form
   - Data is validated on the client side
   - On submission, data is sent to your backend API
   - If successful, user is redirected to login page with credentials pre-filled

## Test Credentials

The system still supports your test accounts:

- **Admin**: Email: admin@myngenda.com | Password: admin123
- **User**: Email: user@myngenda.com | Password: user123

## Troubleshooting

If you encounter issues connecting to your backend:

1. **Check Network Requests**: Use browser dev tools to inspect API calls
2. **Verify API Endpoints**: Ensure your backend implements the required endpoints
3. **CORS Issues**: Make sure your Replit backend allows requests from your Netlify domain
4. **API Response Format**: Ensure your API returns data in the expected format