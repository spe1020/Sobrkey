/**
 * Sobrkey Nostr Tag Debugger
 * 
 * This script specifically tests fetching Nostr notes with the #sobrkey tag
 * using different tag formats and relay configurations to identify why
 * sobrkey-tagged content isn't being retrieved.
 */

const WebSocket = require('ws');
const fs = require('fs');
const crypto = require('crypto');

// Configuration
const LOG_FILE = 'nostr-tag-debug-log.txt';
const TEST_TAG = 'sobrkey';
const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.social',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://nostr.wine'
];

// Initialize log file
fs.writeFileSync(LOG_FILE, `Sobrkey Nostr Tag Debug Log - ${new Date().toISOString()}\n\n`);

// Logging function
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

// Helper to format a Nostr event for display
function formatEvent(event) {
  if (!event) return 'null';
  
  const preview = event.content.length > 100 
    ? event.content.substring(0, 100) + '...' 
    : event.content;
    
  const tags = event.tags
    .filter(t => t[0] === 't' || t[0] === '#t')
    .map(t => `#${t[1]}`).join(', ');
    
  return `
    ID: ${event.id.substring(0, 10)}...
    Tags: ${tags || 'none'}
    Author: ${event.pubkey.substring(0, 8)}...
    Content: ${preview}
    Created: ${new Date(event.created_at * 1000).toLocaleString()}
  `.trim().replace(/^ +/gm, '');
}

// Test different tag formats and query approaches
async function testTagQueries() {
  log('=== TESTING TAG QUERY FORMATS ===');
  
  // Test variations for retrieving notes with tags
  const tagVariations = [
    // Standard tag format
    { label: 'Standard "#t" tag array', filter: { kinds: [1], limit: 20, "#t": [TEST_TAG] } },
    
    // Modified tag formats
    { label: 'Direct "t" tag array', filter: { kinds: [1], limit: 20, "t": [TEST_TAG] } },
    { label: 'Hashtag format', filter: { kinds: [1], limit: 20, "#t": [`#${TEST_TAG}`] } },
    { label: 'Combined tag formats', filter: { kinds: [1], limit: 20, "#t": [TEST_TAG], "t": [TEST_TAG] } },
    
    // Special formats some relays might use
    { label: 'Event tags format', filter: { kinds: [1], limit: 20, "e": [TEST_TAG] } },
    
    // Timestamp adjusted
    { label: 'Last 30 days', filter: { 
        kinds: [1], 
        limit: 20, 
        "#t": [TEST_TAG], 
        since: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60)
      } 
    },
    
    // Search tags
    { label: 'With global search', filter: { kinds: [1], limit: 20, search: TEST_TAG } }
  ];
  
  // Run tests for each relay
  for (const relay of RELAYS) {
    log(`\nTesting relay: ${relay}`);
    log('-'.repeat(50));
    
    for (const variation of tagVariations) {
      log(`\n• Format: ${variation.label}`);
      log(`  Filter: ${JSON.stringify(variation.filter)}`);
      
      try {
        const results = await queryRelay(relay, variation.filter);
        
        log(`  Results: ${results.length} notes found`);
        
        if (results.length > 0) {
          log('  First result:');
          log(`  ${formatEvent(results[0])}`);
          
          // Check all results for the expected tag
          const hasCorrectTag = results.some(event => 
            event.tags.some(tag => 
              (tag[0] === 't' || tag[0] === '#t') && 
              (tag[1] === TEST_TAG || tag[1] === `#${TEST_TAG}`)
            )
          );
          
          log(`  ✓ Has ${TEST_TAG} tag: ${hasCorrectTag ? 'YES' : 'NO'}`);
        }
      } catch (error) {
        log(`  ❌ Error: ${error.message}`);
      }
    }
  }
}

// Test posting a note with the tag and then immediately retrieving it
async function testPostAndRetrieve() {
  log('\n\n=== TESTING POST AND RETRIEVE ===');
  
  // Create a temporary keypair for testing
  const privateKey = crypto.randomBytes(32);
  const publicKey = crypto.randomBytes(32); // This isn't a real derivation, just for testing
  
  // We'll use only the most reliable relay for this test
  const testRelay = RELAYS[0];
  log(`Using relay: ${testRelay}`);
  
  // Create a test note with our tag
  const testContent = `Test message from Sobrkey Tag Debugger at ${new Date().toISOString()}`;
  const testEvent = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['t', TEST_TAG]],
    content: testContent,
    pubkey: publicKey.toString('hex')
  };
  
  // This is a placeholder for actual signing - in a real app you'd use proper signing
  testEvent.id = crypto.createHash('sha256').update(JSON.stringify(testEvent)).digest('hex');
  testEvent.sig = crypto.randomBytes(64).toString('hex');
  
  log('\n• Posting test note with tag...');
  log(`  Content: ${testContent}`);
  log(`  Tags: ${JSON.stringify(testEvent.tags)}`);
  
  try {
    // Publish note
    await publishToRelay(testRelay, testEvent);
    log('  ✓ Note published');
    
    // Wait a moment for propagation
    log('  Waiting 5 seconds for propagation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to retrieve it with different filter variations
    log('\n• Attempting to retrieve posted note...');
    
    const filterVariations = [
      { label: 'Standard "#t" filter', filter: { kinds: [1], limit: 5, "#t": [TEST_TAG] } },
      { label: 'Direct "t" filter', filter: { kinds: [1], limit: 5, "t": [TEST_TAG] } },
      { label: 'Author filter', filter: { kinds: [1], limit: 5, authors: [publicKey.toString('hex')] } }
    ];
    
    for (const variation of filterVariations) {
      log(`\n  Using ${variation.label}:`);
      log(`  ${JSON.stringify(variation.filter)}`);
      
      try {
        const results = await queryRelay(testRelay, variation.filter);
        log(`  Results: ${results.length} notes found`);
        
        const found = results.some(event => 
          event.content === testContent && 
          event.pubkey === publicKey.toString('hex')
        );
        
        log(`  ✓ Found our test note: ${found ? 'YES' : 'NO'}`);
        
        if (results.length > 0) {
          log('  First result:');
          log(`  ${formatEvent(results[0])}`);
        }
      } catch (error) {
        log(`  ❌ Error: ${error.message}`);
      }
    }
  } catch (error) {
    log(`  ❌ Error: ${error.message}`);
  }
}

// Find popular tags on each relay (to see what tags are actually being used)
async function findPopularTags() {
  log('\n\n=== FINDING POPULAR TAGS ===');
  log('This will help determine if relays are using different tag formats\n');
  
  for (const relay of RELAYS) {
    log(`\nChecking popular tags on ${relay}...`);
    
    try {
      // Get recent notes without tag filtering
      const recentNotes = await queryRelay(relay, { kinds: [1], limit: 50 });
      log(`  Retrieved ${recentNotes.length} recent notes`);
      
      if (recentNotes.length === 0) {
        log('  No notes found on this relay');
        continue;
      }
      
      // Extract and count all tags
      const tagCounts = {};
      
      recentNotes.forEach(event => {
        event.tags.forEach(tag => {
          // Only look at 't' tags (for topics/tags)
          if (tag[0] === 't' || tag[0] === '#t') {
            const tagValue = tag[1];
            if (!tagCounts[tagValue]) tagCounts[tagValue] = 0;
            tagCounts[tagValue]++;
          }
        });
      });
      
      // Display most common tags
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      if (sortedTags.length > 0) {
        log('  Most common tags:');
        sortedTags.forEach(([tag, count]) => {
          log(`    #${tag}: ${count} occurrences`);
        });
      } else {
        log('  No tags found in recent notes');
      }
      
      // Look for our specific tag
      const ourTagCount = tagCounts[TEST_TAG] || 0;
      log(`  '${TEST_TAG}' tag found: ${ourTagCount} times`);
      
      // Also check for variant with hash
      const hashTagCount = tagCounts[`#${TEST_TAG}`] || 0;
      if (hashTagCount > 0) {
        log(`  '#${TEST_TAG}' tag found: ${hashTagCount} times`);
      }
      
    } catch (error) {
      log(`  ❌ Error: ${error.message}`);
    }
  }
}

// Query a relay for notes matching a filter
async function queryRelay(relay, filter) {
  return new Promise((resolve, reject) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    const ws = new WebSocket(relay);
    const results = [];
    let isDone = false;
    
    // Set timeout
    const timeout = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        ws.close();
        resolve(results); // Return whatever we got
      }
    }, 10000);
    
    ws.on('open', () => {
      // Send query request
      ws.send(JSON.stringify(["REQ", requestId, filter]));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle EVENT messages (results)
        if (message[0] === "EVENT" && message[1] === requestId) {
          results.push(message[2]);
        }
        // Handle EOSE (end of stored events)
        else if (message[0] === "EOSE" && message[1] === requestId) {
          clearTimeout(timeout);
          isDone = true;
          ws.close();
          resolve(results);
        }
      } catch (error) {
        // Continue if we hit a parsing error
        console.error("Error parsing message:", error);
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      if (!isDone) {
        isDone = true;
        ws.close();
        reject(error);
      }
    });
    
    ws.on('close', () => {
      clearTimeout(timeout);
      if (!isDone) {
        isDone = true;
        resolve(results);
      }
    });
  });
}

// Publish an event to a relay
async function publishToRelay(relay, event) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(relay);
    let isDone = false;
    
    // Set timeout
    const timeout = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        ws.close();
        reject(new Error("Publish timeout"));
      }
    }, 10000);
    
    ws.on('open', () => {
      // Send event to relay
      ws.send(JSON.stringify(["EVENT", event]));
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Check for OK message (successful publish)
        if (message[0] === "OK" && message[1] === event.id) {
          clearTimeout(timeout);
          isDone = true;
          ws.close();
          resolve();
        }
      } catch (error) {
        // Continue if we hit a parsing error
        console.error("Error parsing message:", error);
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      if (!isDone) {
        isDone = true;
        ws.close();
        reject(error);
      }
    });
    
    ws.on('close', () => {
      clearTimeout(timeout);
      if (!isDone) {
        isDone = true;
        reject(new Error("Connection closed without confirmation"));
      }
    });
  });
}

// Run the tests
async function runTests() {
  log('=== SOBRKEY NOSTR TAG DEBUGGER ===');
  log(`Testing tag: #${TEST_TAG}`);
  log(`Date: ${new Date().toISOString()}`);
  log(`Target relays: ${RELAYS.join(', ')}`);
  log('======================================\n');
  
  try {
    // Step 1: Find if there are any notes with our tag
    await testTagQueries();
    
    // Step 2: Check what other tags are popular
    await findPopularTags();
    
    // Step 3: Try to post and retrieve a note with our tag
    // Note: This is commented out because it requires proper signing
    // await testPostAndRetrieve();
    
    log('\n\n=== SUMMARY AND RECOMMENDATIONS ===');
    log('1. Check the log file for which tag format works best with each relay');
    log('2. Update the app code to use the most compatible tag format');
    log('3. Consider using multiple tag formats in queries (both "t" and "#t")');
    log(`4. If "#${TEST_TAG}" tags were found but "${TEST_TAG}" weren't, update your code to use the proper format`);
    log('5. Some relays might need more time to propagate new posts');
    log('\nDetailed log saved to: ' + LOG_FILE);
    
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    log(error.stack);
  }
}

// Run the tests
runTests();