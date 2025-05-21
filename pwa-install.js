// PWA Installation Script
let deferredPrompt;
const installButton = document.createElement('button');
installButton.style.display = 'none';
installButton.classList.add('pwa-install-button');
installButton.textContent = 'Install MyNgenda';

// Wait for the page to load
window.addEventListener('load', () => {
  // Attach the install button to the DOM
  document.body.appendChild(installButton);
  
  // Check if the app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App is already installed');
    return;
  }
  
  // Create install banner when appropriate
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67+ from automatically showing the prompt
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show the install button
    installButton.style.display = 'block';
    installButton.style.position = 'fixed';
    installButton.style.bottom = '20px';
    installButton.style.right = '20px';
    installButton.style.zIndex = '9999';
    installButton.style.padding = '10px 15px';
    installButton.style.backgroundColor = '#4CAF50';
    installButton.style.color = 'white';
    installButton.style.border = 'none';
    installButton.style.borderRadius = '4px';
    installButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    installButton.style.cursor = 'pointer';
    
    // Log that the app can be installed
    console.log('App can be installed');
  });
  
  // Install the app when button is clicked
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      return;
    }
    
    // Show the installation prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clear the deferredPrompt variable
    deferredPrompt = null;
    
    // Hide the install button
    installButton.style.display = 'none';
  });
  
  // Handle app installed event
  window.addEventListener('appinstalled', (e) => {
    console.log('App was installed');
    
    // Hide the install button
    installButton.style.display = 'none';
    
    // You could show a success message or trigger a special animation here
  });
});