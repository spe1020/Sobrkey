// Main entry point (for native)
import { registerRootComponent } from 'expo';
import App from './App';

console.log('Sobrkey main index.js loaded');
console.log('This should only be used for native platforms');

// Register the main app component
registerRootComponent(App);