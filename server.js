const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

// Import Mira AI integration (powered by Anthropic)
const { getTherapeuticResponse } = require('./anthropic');

// Add body parser middleware for JSON 
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve documentation files
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// Serve the nostr-tools library from node_modules
app.use('/lib/nostr-tools', express.static(path.join(__dirname, 'node_modules/nostr-tools/lib')));

// Specifically serve the bundled nostr file for direct script access
app.get('/nostr-bundle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules/nostr-tools/lib/nostr.bundle.js'));
});

// Client-side error logging endpoint
app.post('/api/log-error', (req, res) => {
  const { message, source, lineNo, colNo, error, context } = req.body;
  
  console.error('Client-side error:', {
    timestamp: new Date().toISOString(),
    message,
    source,
    lineNo,
    colNo,
    stack: error?.stack || 'No stack trace',
    context: context || {}
  });
  
  res.status(200).json({ received: true });
});

// API endpoint for Mira AI therapeutic responses
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = await getTherapeuticResponse(message, history);
    
    res.json({ 
      response,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      message: error.message 
    });
  }
});

// Simple ping endpoint for health checks
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Main route - welcome page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Onboarding page route
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'onboarding.html'));
});

// Journal page route
app.get('/journal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'journal.html'));
});

// Login page route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Chat with Mira page route
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Community page route
app.get('/community', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'community.html'));
});

// Meetings page route
app.get('/meetings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'meetings.html'));
});

// Support page route
app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'support.html'));
});

// Emergency page route
app.get('/emergency', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'emergency.html'));
});

// Settings page route
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sobrkey server running at http://localhost:${PORT}`);
});
