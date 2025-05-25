# Server Integration Guide

This document explains how to integrate the JWT authentication system into your existing server.

## JWT Authentication Integration Steps

### Step 1: Update Your Main Server File

Update your main server file (typically `server/index.ts`) with these changes:

```typescript
// Add this import at the top with other imports
import jwtAuthRoutes from './jwt-auth';

// Add this line after other middleware setup and before your routes
// Usually after CORS and session setup
app.use('/api/auth', jwtAuthRoutes);
```

### Step 2: Verify File Placement

Make sure the JWT authentication files are in these locations:
- `server/jwt-auth/index.ts` - Main JWT authentication routes
- `server/jwt-auth/test-page.ts` - Test page for JWT authentication
- `server/auth.ts` - Updated authentication utilities with exported functions

### Step 3: Install Dependencies (if needed)

Make sure you have these dependencies installed:
```bash
npm install jsonwebtoken bcryptjs
```

### Step 4: Test the Authentication

Once integrated, you can test the JWT authentication by visiting:
- `/api/auth/test` - Test page for registration and login
- `/api/auth/register` - Registration endpoint (POST)
- `/api/auth/login` - Login endpoint (POST)
- `/api/auth/user` - Get current user endpoint (GET with Authorization header)

## API Documentation

### Registration Endpoint

**URL**: `/api/auth/register`
**Method**: `POST`
**Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123"
}
```
**Response**: User object with token

### Login Endpoint

**URL**: `/api/auth/login`
**Method**: `POST`
**Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response**: User object with token

### Get Current User

**URL**: `/api/auth/user`
**Method**: `GET`
**Headers**: 
```
Authorization: Bearer [token]
```
**Response**: User object