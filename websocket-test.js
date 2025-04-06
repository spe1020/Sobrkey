// Save this as websocket-test.js
const WebSocket = require('ws');

// Test connection to popular relays
const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social'
];

relays.forEach(relay => {
  console.log(`Testing connection to ${relay}...`);
  const ws = new WebSocket(relay);
  
  ws.on('open', () => {
    console.log(`✅ Connected to ${relay}`);
    // Test subscription
    ws.send(JSON.stringify(["REQ", "test-sub", {"kinds": [1], "limit": 5}]));
  });
  
  ws.on('message', (data) => {
    console.log(`Received from ${relay}:`, data.toString().substring(0, 100) + '...');
    // Close after receiving some data
    setTimeout(() => ws.close(), 1000);
  });
  
  ws.on('error', (error) => {
    console.error(`❌ Error connecting to ${relay}:`, error.message);
  });
  
  ws.on('close', () => {
    console.log(`Connection to ${relay} closed`);
  });
});