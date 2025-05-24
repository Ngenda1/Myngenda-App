/**
 * CORS Configuration for Myngenda
 * 
 * This module configures CORS to allow connections from Netlify to your Replit backend.
 * Add this to your server's main file to fix the connection issues.
 */

// Add this function to your server/index.js or server/index.ts file
function setupCors(app) {
  // Apply CORS middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow specific origins - you can add more if needed
    if (origin) {
      // In development or testing, allow all origins
      res.header('Access-Control-Allow-Origin', origin);
      console.log(`CORS: Allowed origin ${origin}`);
    }
    
    // Required headers for CORS
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  console.log('CORS configured to allow connections from Netlify domains');
}

module.exports = { setupCors };