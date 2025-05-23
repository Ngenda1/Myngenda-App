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

  // Configure CORS to allow credentials and proper headers
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
      } else {
        res.header('Access-Control-Allow-Origin', '*');
      }
    } else {
      // In production, check against the allowed list
      if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      } else if (origin && 
                (origin.includes('netlify.app') || 
                 origin.includes('myngenda.com'))) {
        // Allow Netlify deploy previews and subdomains
        res.header('Access-Control-Allow-Origin', origin);
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
  
  console.log('Enhanced CORS configuration complete');
}