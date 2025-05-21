/**
 * Registration Fix Helper
 * 
 * This script adds the registration helper to all pages in the application.
 * It automatically detects when registration fails and provides a link to the fixed page.
 */

(function() {
  // Create and add the helper script to the page
  function injectFixRegistrationScript() {
    // Check if script is already loaded
    if (document.getElementById('fix-registration-script')) {
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.id = 'fix-registration-script';
    script.src = '/fix-registration.js';
    script.async = true;
    
    // Add to document
    document.head.appendChild(script);
  }
  
  // Wait for the page to load
  window.addEventListener('DOMContentLoaded', function() {
    injectFixRegistrationScript();
  });
  
  // If the page is already loaded, inject now
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    injectFixRegistrationScript();
  }
})();