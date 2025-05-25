# MyNgenda GitHub Deployment Guide

This guide will help you upload the enhanced authentication system to GitHub, which will then automatically deploy to Netlify.

## What's Included in This Package

1. **JWT Authentication Backend**: 
   - Enhanced authentication system that works for both internal and external users
   - Pre-configured test accounts for admin and regular users
   - Server-side JWT token generation and validation

2. **Standalone Authentication Pages**:
   - Beautiful responsive login/registration page
   - Automatic API endpoint detection based on environment
   - Secure token storage and user role-based redirection

## Step 1: Upload to GitHub

### Option 1: Upload Using GitHub Web Interface

1. Go to your GitHub repository
2. Navigate to the appropriate directories 
3. Click "Add file" → "Upload files"
4. Drag and drop the files from this package to their respective locations:
   - `server/jwt-auth/index.ts` → to your repo's server/jwt-auth/ directory
   - `server/jwt-auth/test-page.ts` → to your repo's server/jwt-auth/ directory
   - `server/auth.ts` → to your repo's server/ directory (replace existing file)
   - `public/standalone-auth.html` → to your repo's public/ directory
5. Add a commit message like "Add enhanced JWT authentication system"
6. Click "Commit changes"

### Option 2: Using Git Command Line

```bash
# Clone your repository (if you haven't already)
git clone https://github.com/yourusername/your-repository.git
cd your-repository

# Copy the files from this package to their respective locations
# Make sure you're copying from where you extracted the zip file

# Add the files to git
git add server/jwt-auth/index.ts
git add server/jwt-auth/test-page.ts
git add server/auth.ts
git add public/standalone-auth.html

# Commit the changes
git commit -m "Add enhanced JWT authentication system"

# Push to GitHub
git push origin main
```

## Step 2: Update Your Main Server File

Make sure your main server file (likely `server/index.ts`) imports and uses the JWT authentication routes:

```typescript
// Add this import
import jwtAuthRoutes from './jwt-auth';

// Add this line after other app.use() statements
app.use('/api/auth', jwtAuthRoutes);
```

## Step 3: Add Netlify _redirects File

Create a file named `_redirects` in your Netlify publish directory with the following content:

```
# Netlify redirects file

# API proxy to Replit backend
/api/*  https://myngenda.replit.app/api/:splat  200

# SPA fallback
/*    /index.html   200
```

This will ensure that API requests from your Netlify site are correctly proxied to your Replit backend.

## Step 4: Verify Netlify Deployment

After pushing to GitHub:

1. Go to your Netlify dashboard
2. Verify that a new deployment has started
3. Once deployment is complete, click on the preview URL
4. Test the authentication system by:
   - Opening the standalone-auth.html page
   - Registering a new user
   - Logging in with that user
   - Verifying redirection to the appropriate dashboard

## Accessing Test Accounts

You can use these pre-configured test accounts:

- **Admin Account**: 
  - Email: admin@myngenda.com
  - Password: admin123

- **User Account**:
  - Email: user@myngenda.com
  - Password: user123

## Troubleshooting

### CORS Issues
If you experience CORS errors when your Netlify site tries to access the Replit API:

1. Verify that the CORS configuration in your server is correctly set up
2. Check the browser console for specific CORS error messages
3. Ensure your API base URL detection is working correctly in standalone-auth.html

### Authentication Failures
If users can't log in from Netlify:

1. Check that the API proxy in _redirects is working correctly
2. Verify that the JWT secret is consistent between environments
3. Test the API endpoints directly using tools like Postman or cURL

## Need More Help?

If you encounter any issues during deployment, feel free to reach out for assistance!