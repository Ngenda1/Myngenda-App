import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { createServer } from "http";
import tokenRoutes from './token-routes';
import { setupGoogleAuth, setupGoogleRoutes } from './google-auth';
import { fileURLToPath } from 'url';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';
import { setupCors } from './cors-fix';
import jwtAuthRoutes from './jwt-auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const port = process.env.PORT || 5000;

// Setup CORS to allow connections from Netlify
setupCors(app);

// Serve static files first
app.use(express.static(path.join(__dirname, '../dist/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup session middleware with PostgreSQL
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'myngenda-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));
console.log('Setting up session middleware with PostgreSQL');

// Mount token-based authentication routes
app.use('/api/token', tokenRoutes);

// Mount JWT authentication routes for frontend integration
app.use('/api/auth', jwtAuthRoutes);

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

(async () => {
  try {
    const { setupNewAuthSystem } = await import('./new-auth-system/index');
    setupNewAuthSystem(app);
    console.log('Successfully integrated authentication system');
    
    // Set up Google Authentication
    setupGoogleAuth();
    setupGoogleRoutes(app);
    console.log('Google authentication routes set up successfully');
  } catch (error) {
    console.error('Error setting up authentication system:', error);
  }

  await registerRoutes(app);

  // Error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ message: "Internal Server Error" });
  });

  // Setup Vite for development
  if (process.env.NODE_ENV !== 'production') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Also serve standalone auth page directly
  app.get('/standalone-auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/standalone-auth.html'));
  });

  // SPA routing - must be after API routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });

  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
})();
