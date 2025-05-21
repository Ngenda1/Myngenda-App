/**
 * Registration Fix Script
 * 
 * This script detects when a user experiences registration failures
 * and provides a link to the fixed registration page.
 */

(function() {
  // Function to check if the user is on the register page
  function isRegisterPage() {
    return window.location.pathname.includes('/register');
  }
  
  // Function to check if we're running as an external user
  function isExternalUser() {
    // Check if we're not on the same domain as the server
    return window.location.hostname !== window.location.hostname.split('.')[0] + '.replit.app';
  }
  
  // Function to add a help message to the page
  function addFixMessage() {
    // Check if there's already a message
    if (document.getElementById('registration-fix-message')) {
      return;
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.id = 'registration-fix-message';
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '10px';
    messageDiv.style.right = '10px';
    messageDiv.style.backgroundColor = '#ffeb3b';
    messageDiv.style.border = '1px solid #f57c00';
    messageDiv.style.borderRadius = '4px';
    messageDiv.style.padding = '10px';
    messageDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.maxWidth = '300px';
    
    messageDiv.innerHTML = `
      <h3 style="margin-top: 0; color: #f57c00;">Registration Issues?</h3>
      <p>If you're having trouble registering, try our fixed registration page:</p>
      <a href="/register-fix.html" style="display: inline-block; background: #4CAF50; color: white; text-decoration: none; padding: 8px 12px; border-radius: 4px; font-weight: bold;">Use Fixed Registration</a>
      <button id="close-fix-message" style="position: absolute; top: 5px; right: 5px; background: none; border: none; cursor: pointer; font-size: 16px;">✕</button>
    `;
    
    // Add to document
    document.body.appendChild(messageDiv);
    
    // Add close button functionality
    document.getElementById('close-fix-message').addEventListener('click', function() {
      messageDiv.style.display = 'none';
    });
  }
  
  // Function to observe the page for error messages
  function watchForErrors() {
    // Create a mutation observer to look for error messages
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            
            // Check if the node is an element
            if (node.nodeType === 1) {
              // Look for error messages
              if (
                (node.textContent && node.textContent.includes('Registration failed')) ||
                (node.innerHTML && node.innerHTML.includes('Registration failed'))
              ) {
                addFixMessage();
                observer.disconnect(); // Stop observing once we've found an error
                return;
              }
              
              // Check all text nodes within this element
              const textNodes = node.querySelectorAll('*');
              for (let j = 0; j < textNodes.length; j++) {
                if (
                  textNodes[j].textContent && 
                  textNodes[j].textContent.includes('Registration failed')
                ) {
                  addFixMessage();
                  observer.disconnect(); // Stop observing once we've found an error
                  return;
                }
              }
            }
          }
        }
      });
    });
    
    // Start observing the entire body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // If we're external users, add the message right away
    if (isExternalUser()) {
      setTimeout(addFixMessage, 1000);
    }
  }
  
  // Initialize when the page is loaded
  window.addEventListener('load', function() {
    if (isRegisterPage()) {
      watchForErrors();
      
      // Also add a click event listener to the registration button
      setTimeout(function() {
        const registerButtons = document.querySelectorAll('button[type="submit"]');
        registerButtons.forEach(function(button) {
          button.addEventListener('click', function() {
            // Add a delayed check for errors after the user clicks register
            setTimeout(addFixMessage, 3000);
          });
        });
      }, 1000);
    }
  });
})();