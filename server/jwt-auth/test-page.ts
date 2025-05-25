/**
 * Test page for JWT authentication
 * 
 * This file provides a simple HTML page to test the JWT authentication endpoints
 */

import { Request, Response } from 'express';

export function serveTestPage(req: Request, res: Response) {
  const htmlPage = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JWT Authentication Test</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        color: #43a047;
      }
      .card {
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
      }
      .form-group {
        margin-bottom: 15px;
      }
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      button {
        background: #43a047;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
      }
      button:hover {
        background: #2e7d32;
      }
      .tabs {
        display: flex;
        margin-bottom: 20px;
        border-bottom: 1px solid #ddd;
      }
      .tab {
        padding: 10px 15px;
        cursor: pointer;
      }
      .tab.active {
        border-bottom: 2px solid #43a047;
        font-weight: bold;
      }
      .tab-content {
        display: none;
      }
      .tab-content.active {
        display: block;
      }
      #userInfo {
        display: none;
      }
      .message {
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
      }
      .success {
        background: #d4edda;
        color: #155724;
      }
      .error {
        background: #f8d7da;
        color: #721c24;
      }
      pre {
        background: #f5f5f5;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
      }
    </style>
  </head>
  <body>
    <h1>JWT Authentication Test</h1>
    <p>This page tests the JWT authentication system that works with the frontend app.</p>
    
    <div class="tabs">
      <div class="tab active" onclick="showTab('register')">Register</div>
      <div class="tab" onclick="showTab('login')">Login</div>
      <div class="tab" onclick="showTab('user')">User Info</div>
    </div>
    
    <div id="message" class="message" style="display:none;"></div>
    
    <div id="registerTab" class="tab-content active">
      <h2>Register</h2>
      <div class="card">
        <form id="registerForm">
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input type="text" id="firstName" required>
          </div>
          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input type="text" id="lastName" required>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" required>
          </div>
          <div class="form-group">
            <label for="phone">Phone</label>
            <input type="text" id="phone" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
    
    <div id="loginTab" class="tab-content">
      <h2>Login</h2>
      <div class="card">
        <form id="loginForm">
          <div class="form-group">
            <label for="loginEmail">Email</label>
            <input type="email" id="loginEmail" required>
          </div>
          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input type="password" id="loginPassword" required>
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
      <div class="card">
        <h3>Test Accounts</h3>
        <button onclick="loginWithTestAccount('admin@myngenda.com', 'admin123')">Login as Admin</button>
        <button onclick="loginWithTestAccount('user@myngenda.com', 'user123')">Login as User</button>
      </div>
    </div>
    
    <div id="userTab" class="tab-content">
      <h2>User Info</h2>
      <div class="card">
        <p>This section tests getting the current user info using the JWT token.</p>
        <button onclick="getUserInfo()">Get User Info</button>
        <button onclick="clearAuth()">Logout</button>
      </div>
      <div id="userInfo" class="card">
        <h3>User Data</h3>
        <pre id="userData"></pre>
      </div>
    </div>
    
    <script>
      // Show a message
      function showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = 'message ' + type;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
          messageEl.style.display = 'none';
        }, 5000);
      }
      
      // Show a tab
      function showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Deactivate all tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // Show the selected tab
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        // Activate the tab button
        document.querySelectorAll('.tab').forEach(tab => {
          if (tab.textContent.toLowerCase() === tabName) {
            tab.classList.add('active');
          }
        });
      }
      
      // Store auth token
      function storeToken(token) {
        localStorage.setItem('myngenda_auth_token', token);
      }
      
      // Get auth token
      function getToken() {
        return localStorage.getItem('myngenda_auth_token');
      }
      
      // Clear auth token
      function clearAuth() {
        localStorage.removeItem('myngenda_auth_token');
        localStorage.removeItem('myngenda_user_data');
        document.getElementById('userInfo').style.display = 'none';
        showMessage('Logged out successfully', 'success');
      }
      
      // Register form handler
      document.getElementById('registerForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              firstName: document.getElementById('firstName').value,
              lastName: document.getElementById('lastName').value,
              email: document.getElementById('email').value,
              phone: document.getElementById('phone').value,
              password: document.getElementById('password').value
            })
          });
          
          const result = await response.json();
          
          if (response.ok) {
            showMessage('Registration successful!', 'success');
            document.getElementById('registerForm').reset();
            showTab('login');
          } else {
            showMessage(result.message || 'Registration failed', 'error');
          }
        } catch (error) {
          console.error('Registration error:', error);
          showMessage('Error connecting to server', 'error');
        }
      });
      
      // Login form handler
      document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        loginWithTestAccount(
          document.getElementById('loginEmail').value,
          document.getElementById('loginPassword').value
        );
      });
      
      // Login with test account
      async function loginWithTestAccount(email, password) {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email,
              password
            })
          });
          
          const result = await response.json();
          
          if (response.ok) {
            showMessage('Login successful!', 'success');
            document.getElementById('loginForm').reset();
            
            // Store the token
            storeToken(result.token);
            
            // Store the user data
            localStorage.setItem('myngenda_user_data', JSON.stringify(result.user));
            
            // Display user info
            getUserInfo();
            
            // Show the user tab
            showTab('user');
          } else {
            showMessage(result.message || 'Login failed', 'error');
          }
        } catch (error) {
          console.error('Login error:', error);
          showMessage('Error connecting to server', 'error');
        }
      }
      
      // Get user info
      async function getUserInfo() {
        try {
          const token = getToken();
          
          if (!token) {
            showMessage('Not authenticated', 'error');
            return;
          }
          
          const response = await fetch('/api/auth/user', {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + token
            }
          });
          
          const result = await response.json();
          
          if (response.ok) {
            // Display user info
            document.getElementById('userData').textContent = JSON.stringify(result, null, 2);
            document.getElementById('userInfo').style.display = 'block';
            showMessage('User info retrieved successfully', 'success');
          } else {
            showMessage(result.message || 'Failed to get user info', 'error');
          }
        } catch (error) {
          console.error('User info error:', error);
          showMessage('Error connecting to server', 'error');
        }
      }
      
      // Check if user is already logged in
      const token = getToken();
      if (token) {
        getUserInfo();
        showTab('user');
      }
    </script>
  </body>
  </html>
  `;
  
  res.send(htmlPage);
}