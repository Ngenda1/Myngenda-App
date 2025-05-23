/**
 * Enhanced CORS Configuration for Myngenda
 * 
 * This file provides a robust CORS setup that allows connections from all Netlify 
 * domains and subdomains, including deploy previews and custom domains.
 */

import cors from 'cors';
import { Express } from 'express';

export function setupCors(app: Express) {
  // List of allowed origins including local development, Netlify, and production domains
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://myngendapp.netlify.app',
    'https://myngenda.netlify.app',
    'https://myngenda.com',
    'https://www.myngenda.com'
  ];

  // Wildcard patterns for allowed origin domains
  const allowedPatterns = [
    /^https:\/\/[a-z0-9-]+--myngendapp\.netlify\.app$/,  // Netlify deploy previews
    /^https:\/\/deploy-preview-[0-9]+--myngendapp\.netlify\.app$/,  // Netlify deploy previews
    /^https:\/\/myngenda-[a-z0-9-]+\.netlify\.app$/  // Other Netlify subdomains
  ];

  // Configure CORS to allow credentials and proper headers
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Log the request origin for debugging
    console.log('Incoming request from origin:', origin);
    
    let allowOrigin = false;
    
    // Check if the origin is in our allowed list
    if (origin) {
      // Check against specific origins first
      if (allowedOrigins.includes(origin)) {
        allowOrigin = true;
      } else {
        // Check against patterns
        for (const pattern of allowedPatterns) {
          if (pattern.test(origin)) {
            allowOrigin = true;
            break;
          }
        }
      }
      
      // If we're in development, we might want to be more permissive
      if (process.env.NODE_ENV === 'development') {
        allowOrigin = true;
        console.log('Development mode: allowing all origins');
      }
      
      if (allowOrigin) {
        res.header('Access-Control-Allow-Origin', origin);
        console.log(`CORS: Allowed origin ${origin}`);
      } else {
        console.log(`CORS: Rejected origin ${origin}`);
      }
    }
    
    // Always set these headers
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  // Apply specific CORS for API endpoints
  const apiCorsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      let allow = false;
      
      // Check against specific origins
      if (allowedOrigins.includes(origin)) {
        allow = true;
      } else {
        // Check against patterns
        for (const pattern of allowedPatterns) {
          if (pattern.test(origin)) {
            allow = true;
            break;
          }
        }
      }
      
      // Allow all in development
      if (process.env.NODE_ENV === 'development') {
        allow = true;
      }
      
      if (allow) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    maxAge: 86400 // Cache preflight for 1 day
  };
  
  // Apply to API routes
  app.use('/api', cors(apiCorsOptions));
  
  // Handle preflight specifically for API routes
  app.options('/api/*', cors(apiCorsOptions));
  
  console.log('Enhanced CORS configuration complete');
}