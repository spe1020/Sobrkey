/**
 * Sobrkey Nostr Relay Analyzer
 * 
 * This tool analyzes your application's Nostr relay connection code
 * and helps diagnose WebSocket connection issues specific to the app.
 */

const WebSocket = require('ws');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Default relay list from your application
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social'
  // Add any other relays your app is using
];

// Create log file
const LOG_FILE = 'sobrkey-relay-analysis.txt';
fs.writeFileSync(LOG_FILE, `Sobrkey Relay Analysis - ${new Date().toISOString()}\n\n`);

function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

// Test publishing a simple Nostr event
async function testPublishEvent(relay, eventData) {
  return new Promise((resolve, reject) => {
    let timeoutId;
    const ws = new WebSocket(relay);
    
    const timeout = setTimeout(() => {
      log(`  Timeout publishing to ${relay}`);
      ws.close();
      resolve({ success: false, error: 'Timeout' });
    }, 10000);
    
    ws.on('open', () => {
      log(`  Connected to ${relay}, attempting to publish...`);
      
      // Send the EVENT message
      ws.send(JSON.stringify(["EVENT", eventData]));
    });
    
    ws.on('message', (data) => {
      const msg = data.toString();
      log(`  Received: ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`);
      
      // Look for confirmation of event (OK message)
      if (msg.includes('OK') && msg.includes(eventData.id)) {
        clearTimeout(timeout);
        log(`  ✅ Event published successfully to ${relay}`);
        ws.close();
        resolve({ success: true });
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      log(`  ❌ Error publishing to ${relay}: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    ws.on('close', () => {
      clearTimeout(timeout);
      log(`  Connection to ${relay} closed`);
      resolve({ success: false, error: 'Connection closed without confirmation' });
    });
  });
}

// Create a simple test event
function createTestEvent() {
  const id = Math.random().toString(36).substring(2, 15);
  const now = Math.floor(Date.now() / 1000);
  
  return {
    id: id,
    pubkey: '0000000000000000000000000000000000000000000000000000000000000001', // Dummy public key
    created_at: now,
    kind: 1,
    tags: [['t', 'sobrkey'], ['t', 'test']],
    content: 'This is a test event from Sobrkey Relay Analyzer',
    sig: '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' // Dummy signature
  };
}

// Test a basic subscription
async function testSubscription(relay) {
  return new Promise((resolve, reject) => {
    let messageReceived = false;
    const ws = new WebSocket(relay);
    
    const timeout = setTimeout(() => {
      log(`  Timeout subscribing to ${relay}`);
      ws.close();
      resolve({ success: false, error: 'Timeout' });
    }, 10000);
    
    ws.on('open', () => {
      log(`  Connected to ${relay}, sending subscription...`);
      
      // Subscribe to recent notes
      ws.send(JSON.stringify(["REQ", "sub1", { kinds: [1], limit: 3 }]));
    });
    
    ws.on('message', (data) => {
      if (!messageReceived) {
        messageReceived = true;
        clearTimeout(timeout);
        
        const msg = data.toString();
        log(`  📨 First message: ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`);
        
        // Wait a moment for more messages
        setTimeout(() => {
          log(`  ✅ Subscription working on ${relay}`);
          ws.close();
          resolve({ success: true });
        }, 2000);
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      log(`  ❌ Error subscribing to ${relay}: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    ws.on('close', () => {
      clearTimeout(timeout);
      if (!messageReceived) {
        log(`  Connection closed without receiving messages`);
        resolve({ success: false, error: 'Connection closed without receiving messages' });
      }
    });
  });
}

// Analyze the handshake process in detail
async function analyzeHandshake(relay) {
  log(`Analyzing WebSocket handshake for ${relay}...`);
  
  return new Promise((resolve) => {
    const startTime = performance.now();
    const ws = new WebSocket(relay, {
      handshakeTimeout: 15000
    });
    
    let connectTime = null;
    
    ws.on('open', () => {
      connectTime = performance.now() - startTime;
      log(`  ✅ Handshake completed in ${connectTime.toFixed(2)}ms`);
      ws.close();
    });
    
    ws.on('error', (error) => {
      log(`  ❌ Handshake error: ${error.message}`);
      resolve({
        success: false,
        error: error.message,
        connectTime: null
      });
    });
    
    ws.on('unexpected-response', (req, res) => {
      log(`  ⚠️ Unexpected response during handshake: HTTP ${res.statusCode}`);
      log(`  Headers: ${JSON.stringify(res.headers)}`);
      
      res.on('data', (chunk) => {
        log(`  Response body: ${chunk.toString()}`);
      });
      
      resolve({
        success: false,
        error: `Unexpected HTTP response: ${res.statusCode}`,
        connectTime: null
      });
    });
    
    ws.on('close', () => {
      resolve({
        success: connectTime !== null,
        connectTime: connectTime,
        error: connectTime === null ? 'Connection closed during handshake' : null
      });
    });
  });
}

// Run the full analysis
async function analyzeRelays() {
  log('=== SOBRKEY NOSTR RELAY ANALYSIS ===');
  log(`Date: ${new Date().toISOString()}`);
  log(`Node.js: ${process.version}`);
  log(`WebSocket Library: ws@${require('ws/package.json').version}`);
  log('=======================================\n');
  
  const results = {
    handshakes: 0,
    subscriptions: 0,
    publishes: 0,
    total: DEFAULT_RELAYS.length,
    relayResults: {}
  };
  
  for (const relay of DEFAULT_RELAYS) {
    log(`\nTesting relay: ${relay}`);
    log('-------------------------------------------');
    
    // Test 1: Analyze handshake
    log('\n• Testing WebSocket handshake...');
    const handshakeResult = await analyzeHandshake(relay);
    
    // Test 2: Test subscription
    log('\n• Testing subscription capability...');
    const subscriptionResult = await testSubscription(relay);
    if (subscriptionResult.success) results.subscriptions++;
    
    // Test 3: Test publishing (using a dummy event)
    log('\n• Testing event publishing capability...');
    const testEvent = createTestEvent();
    const publishResult = await testPublishEvent(relay, testEvent);
    if (publishResult.success) results.publishes++;
    
    // Store results for this relay
    results.relayResults[relay] = {
      handshake: handshakeResult,
      subscription: subscriptionResult,
      publish: publishResult
    };
    
    if (handshakeResult.success) results.handshakes++;
  }
  
  // Output summary
  log('\n\n=== SUMMARY ===');
  log(`Relays tested: ${DEFAULT_RELAYS.length}`);
  log(`Successful handshakes: ${results.handshakes}/${results.total}`);
  log(`Successful subscriptions: ${results.subscriptions}/${results.total}`);
  log(`Successful publishes: ${results.publishes}/${results.total}`);
  
  if (results.handshakes === 0) {
    log('\n❌ CRITICAL ISSUE: Unable to establish WebSocket connections');
    log('Possible causes:');
    log('  - Network connectivity issues');
    log('  - WebSocket protocol blocked by firewall');
    log('  - DNS resolution problems');
    log('  - SSL/TLS certificate issues');
  } else if (results.handshakes < results.total) {
    log('\n⚠️ CONNECTION ISSUES: Some relays could not be contacted');
  }
  
  if (results.subscriptions === 0 && results.handshakes > 0) {
    log('\n❌ PROTOCOL ISSUE: WebSocket connects but Nostr protocol fails');
    log('Possible causes:');
    log('  - Relay requires authentication');
    log('  - Malformed subscription request');
    log('  - Relay not accepting new connections');
  }
  
  log('\nDetailed results written to: ' + LOG_FILE);
  return results;
}

// Run the analysis
analyzeRelays().catch(err => {
  log(`\n❌ ERROR: ${err.message}`);
  log(err.stack);
});