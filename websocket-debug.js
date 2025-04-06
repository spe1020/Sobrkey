/**
 * Sobrkey WebSocket Debugging Tool
 * 
 * This script tests WebSocket connectivity with Nostr relays
 * and provides detailed diagnostics about connection issues.
 */

const WebSocket = require('ws');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Configuration
const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol', 
  'wss://relay.snort.social',
  'wss://relay.nostr.band',
  'wss://nostr.fmt.wiz.biz'
];

const TIMEOUT_MS = 8000;
const LOG_FILE = 'websocket-debug-log.txt';

// Initialize log file
fs.writeFileSync(LOG_FILE, `Sobrkey WebSocket Debug Log - ${new Date().toISOString()}\n\n`);

// Log function that writes to console and file
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

// Environment information
log('=== ENVIRONMENT INFO ===');
log(`Node.js version: ${process.version}`);
log(`Platform: ${process.platform}`);
log(`Current directory: ${process.cwd()}`);
log(`WebSocket module version: ${require('ws/package.json').version}`);
log('\n=== CONNECTION TESTS ===\n');

// Test each relay
async function testRelays() {
  const results = {
    successful: 0,
    failed: 0,
    details: []
  };

  // Test connection to each relay
  for (const relay of RELAYS) {
    log(`Testing connection to ${relay}...`);
    
    // Connection stats
    const stats = {
      relay,
      connectTime: null,
      firstMessageTime: null,
      error: null,
      success: false,
      messages: 0
    };
    
    // Create a promise that resolves when connection succeeds or fails
    await new Promise(resolve => {
      const startTime = performance.now();
      let messageReceived = false;
      let timeoutId;
      
      try {
        const ws = new WebSocket(relay);
        
        // Set timeout
        timeoutId = setTimeout(() => {
          log(`❌ Timeout connecting to ${relay} after ${TIMEOUT_MS}ms`);
          stats.error = 'Connection timeout';
          ws.close();
          resolve();
        }, TIMEOUT_MS);
        
        // Connection opened
        ws.on('open', () => {
          const connectTime = performance.now() - startTime;
          stats.connectTime = connectTime.toFixed(2);
          log(`✅ Connected to ${relay} in ${connectTime.toFixed(2)}ms`);
          
          // Test subscription - request 5 recent notes
          ws.send(JSON.stringify(["REQ", "test-sub", {"kinds": [1], "limit": 5}]));
          log(`  Sent test subscription request...`);
        });
        
        // Message received
        ws.on('message', (data) => {
          if (!messageReceived) {
            messageReceived = true;
            const msgTime = performance.now() - startTime;
            stats.firstMessageTime = msgTime.toFixed(2);
            log(`  First message received in ${msgTime.toFixed(2)}ms`);
          }
          
          stats.messages++;
          
          // Log message preview
          const msgStr = data.toString();
          const preview = msgStr.length > 100 ? msgStr.substring(0, 100) + '...' : msgStr;
          log(`  📨 Received: ${preview}`);
          
          // Close after receiving some messages or timeout
          if (stats.messages >= 3) {
            clearTimeout(timeoutId);
            stats.success = true;
            results.successful++;
            ws.close();
            log(`  ✓ Connection test successful - ${stats.messages} messages received`);
            resolve();
          }
        });
        
        // Error handling
        ws.on('error', (error) => {
          clearTimeout(timeoutId);
          stats.error = error.message;
          results.failed++;
          log(`❌ Error connecting to ${relay}: ${error.message}`);
          resolve();
        });
        
        // Connection closed
        ws.on('close', (code, reason) => {
          clearTimeout(timeoutId);
          log(`  Connection to ${relay} closed${reason ? ': ' + reason : ''} (Code: ${code})`);
          if (!messageReceived && !stats.error) {
            stats.error = 'Closed without receiving data';
            results.failed++;
          }
          if (!stats.success && !stats.error) {
            results.failed++;
          }
          resolve();
        });
      } catch (err) {
        clearTimeout(timeoutId);
        stats.error = err.message;
        results.failed++;
        log(`❌ Exception testing ${relay}: ${err.message}`);
        resolve();
      }
    });
    
    // Add stats to results
    results.details.push(stats);
    log(`----------------------------------\n`);
  }

  return results;
}

// Run the tests and display summary
async function runTests() {
  log('Starting WebSocket relay tests...\n');
  const startTime = performance.now();
  
  const results = await testRelays();
  
  const duration = ((performance.now() - startTime) / 1000).toFixed(2);
  
  log('\n=== TEST SUMMARY ===');
  log(`Tests completed in ${duration} seconds`);
  log(`Successful connections: ${results.successful}/${RELAYS.length}`);
  log(`Failed connections: ${results.failed}/${RELAYS.length}`);
  
  if (results.successful === 0) {
    log('\n❌ MAJOR ISSUE: Could not connect to any relays!');
    log('Possible causes:');
    log('  - Network connectivity issues');
    log('  - Firewall blocking WebSocket connections');
    log('  - DNS resolution problems');
    log('  - Proxy server interfering with WebSocket traffic');
  } else if (results.failed > 0) {
    log('\n⚠️ PARTIAL CONNECTIVITY: Some relays could not be reached');
  } else {
    log('\n✅ SUCCESS: All relay connections succeeded');
  }
  
  log('\nConnection details by relay:');
  results.details.forEach(stat => {
    if (stat.success) {
      log(`  ✓ ${stat.relay}: Connected in ${stat.connectTime}ms, first message in ${stat.firstMessageTime}ms`);
    } else {
      log(`  ✗ ${stat.relay}: Failed - ${stat.error || 'Unknown error'}`);
    }
  });
  
  log(`\nDetailed logs written to: ${LOG_FILE}`);
}

// Run the tests
runTests().catch(err => {
  log(`\n❌ FATAL ERROR: ${err.message}`);
  log(err.stack);
});