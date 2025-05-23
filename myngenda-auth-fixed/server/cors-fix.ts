/**
 * CORS Configuration for Myngenda
 * 
 * This file sets up CORS to allow connections from your Netlify domains
 * to your Replit backend.
 */

import cors from 'cors';
import { Express } from 'express';

export function setupCors(app: Express) {
  // Allow these domains to connect to your API
  const allowedOrigins = [
    'https://myngenda.com',
    'https://www.myngenda.com',
    'https://myngenda.netlify.app',
    'https://myngenda-app.netlify.app',
    // Local development
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    // Allow Replit domains too
    'https://myngenda-app.replit.app',
    // Allow Replit webview domains - these have dynamic IDs
    /https:\/\/.*\.riker\.replit\.dev$/,
    // Add any other domains you may be using
  ];

  // Configure CORS
  const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      // Check if the origin is allowed
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        // For development, you might want to log the blocked origin
        console.log(`CORS blocked request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // Allow cookies to be sent
    maxAge: 86400 // Cache preflight request for 1 day
  };

  // Apply CORS to all routes
  app.use(cors(corsOptions));
  
  // Handle preflight requests
  app.options('*', cors(corsOptions));
  
  console.log('CORS configured to allow connections from Netlify domains');
}