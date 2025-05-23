/**
 * Myngenda Authentication Debug Tool
 * 
 * This file provides tools to diagnose and fix authentication connection issues.
 * Include this script in your HTML to access the debug functions.
 */

// Create the debug namespace
window.MyngendaDebug = {};

// Store the original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

// Override console methods to add timestamps and prefixes
if (getQueryParam('debug') === 'true') {
  console.log = function(...args) {
    originalConsole.log(`[${new Date().toISOString()}] [LOG]`, ...args);
  };
  
  console.error = function(...args) {
    originalConsole.error(`[${new Date().toISOString()}] [ERROR]`, ...args);
  };
  
  console.warn = function(...args) {
    originalConsole.warn(`[${new Date().toISOString()}] [WARN]`, ...args);
  };
  
  console.info = function(...args) {
    originalConsole.info(`[${new Date().toISOString()}] [INFO]`, ...args);
  };
  
  console.log('Myngenda Debug Mode Activated');
}

// Helper function to get query parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Detect environment based on hostname
function detectEnvironment() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('replit.app')) {
    return 'Replit';
  } else if (hostname.includes('netlify.app')) {
    return 'Netlify';
  } else if (hostname === 'myngenda.com' || hostname === 'www.myngenda.com') {
    return 'Production';
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'Local';
  } else {
    return 'Unknown';
  }
}

// Get API base URL based on environment
function getApiBaseUrl() {
  const environment = detectEnvironment();
  
  switch (environment) {
    case 'Replit':
      return `${window.location.protocol}//${window.location.host}`;
    case 'Netlify':
    case 'Production':
      return 'https://myngenda.replit.app';
    case 'Local':
      return 'http://localhost:5000';
    default:
      return 'https://myngenda.replit.app';
  }
}

// Check connection to authentication server
async function checkAuthConnection() {
  try {
    const apiBaseUrl = getApiBaseUrl();
    console.log(`Checking connection to auth server at: ${apiBaseUrl}`);
    
    const response = await fetch(`${apiBaseUrl}/api/auth/check-connection`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Auth connection check result:', data);
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    console.error('Auth connection check failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get detailed auth debug information
async function getAuthDebugInfo() {
  try {
    const apiBaseUrl = getApiBaseUrl();
    console.log(`Getting auth debug info from: ${apiBaseUrl}`);
    
    const response = await fetch(`${apiBaseUrl}/api/auth/debug`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Auth debug info:', data);
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    console.error('Failed to get auth debug info:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test login with provided credentials
async function testLogin(email, password) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    console.log(`Testing login at: ${apiBaseUrl}/api/auth/login`);
    
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Login test result:', data);
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    console.error('Login test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Display debug information on the page
function showDebugInfo() {
  if (getQueryParam('debug') !== 'true') return;
  
  // Create debug panel
  const debugPanel = document.createElement('div');
  debugPanel.style.position = 'fixed';
  debugPanel.style.bottom = '0';
  debugPanel.style.right = '0';
  debugPanel.style.backgroundColor = '#f8f9fa';
  debugPanel.style.border = '1px solid #ddd';
  debugPanel.style.borderRadius = '4px 0 0 0';
  debugPanel.style.padding = '10px';
  debugPanel.style.zIndex = '9999';
  debugPanel.style.maxHeight = '50vh';
  debugPanel.style.overflowY = 'auto';
  debugPanel.style.width = '300px';
  debugPanel.style.fontSize = '12px';
  debugPanel.style.fontFamily = 'monospace';
  
  // Add debug content
  debugPanel.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 10px;">Myngenda Debug</h3>
    <p><strong>Environment:</strong> ${detectEnvironment()}</p>
    <p><strong>API Base URL:</strong> ${getApiBaseUrl()}</p>
    <p><strong>Hostname:</strong> ${window.location.hostname}</p>
    <button id="checkAuthBtn" style="margin: 5px 0; padding: 5px; width: 100%;">Check Auth Connection</button>
    <button id="getAuthDebugBtn" style="margin: 5px 0; padding: 5px; width: 100%;">Get Auth Debug Info</button>
    <div id="debugOutput" style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;"></div>
  `;
  
  document.body.appendChild(debugPanel);
  
  // Add event listeners
  document.getElementById('checkAuthBtn').addEventListener('click', async () => {
    const result = await checkAuthConnection();
    document.getElementById('debugOutput').innerHTML = `
      <pre>${JSON.stringify(result, null, 2)}</pre>
    `;
  });
  
  document.getElementById('getAuthDebugBtn').addEventListener('click', async () => {
    const result = await getAuthDebugInfo();
    document.getElementById('debugOutput').innerHTML = `
      <pre>${JSON.stringify(result, null, 2)}</pre>
    `;
  });
}

// Export debug functions
window.MyngendaDebug = {
  checkAuthConnection,
  getAuthDebugInfo,
  testLogin,
  detectEnvironment,
  getApiBaseUrl
};

// Initialize debug panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  showDebugInfo();
});