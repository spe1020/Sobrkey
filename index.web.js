// Bare-bones entry point for web platform
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.web';

console.log('Sobrkey web index loaded with web-specific App');
console.log('Using direct ReactDOM.render for maximum compatibility');

// Add more debugging info
console.log('Document ready state:', document.readyState);
console.log('Root element exists:', !!document.getElementById('root'));

// Function to render our app
function renderApp() {
  console.log('Rendering app to DOM');
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    console.log('Found root element, rendering app');
    ReactDOM.render(<App />, rootElement);
  } else {
    console.error('Could not find root element to mount app');
    
    // Fallback - create a root element if it doesn't exist
    console.log('Creating fallback root element');
    const fallbackRoot = document.createElement('div');
    fallbackRoot.id = 'root-fallback';
    fallbackRoot.style.width = '100%';
    fallbackRoot.style.height = '100%';
    document.body.appendChild(fallbackRoot);
    
    ReactDOM.render(<App />, fallbackRoot);
  }
}

// Ensure the DOM is ready before rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}