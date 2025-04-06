import React from 'react';
import { View, Text } from 'react-native';

// Log to confirm the file is loaded
console.log('This is the web-specific version of the app');

// Directly return a basic HTML-like component for simplicity and maximum visibility
export default function App() {
  console.log('Rendering web-specific component with high contrast colors');
  
  // Using inline styles for simplicity and to avoid any style compilation issues
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: 'black',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{
        fontSize: '48px',
        color: 'red',
        marginBottom: '20px'
      }}>Sobrkey Web</h1>
      
      <p style={{
        fontSize: '24px',
        color: 'yellow',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        If you can see this text, web rendering is working!
      </p>
      
      <button style={{
        backgroundColor: 'green',
        color: 'white',
        padding: '15px 30px',
        fontSize: '20px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer'
      }} onClick={() => alert('Button clicked!')}>
        Click Me
      </button>
    </div>
  );
}
