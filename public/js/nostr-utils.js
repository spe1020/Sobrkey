/**
 * Utility functions for working with Nostr
 */

// Global Nostr variables
let nostrPool = null;
let userPubkey = null;
let userPrivkey = null;

/**
 * Initialize the Nostr connection
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function initializeNostr() {
  try {
    console.log("Initializing Nostr connection...");
    
    // Get user keys
    userPubkey = localStorage.getItem('sobrkey_pubkey_raw');
    userPrivkey = localStorage.getItem('sobrkey_privatekey_raw');
    
    if (!userPubkey || !userPrivkey) {
      console.error("Keys not found in localStorage:", {
        pubkeyRaw: !!localStorage.getItem('sobrkey_pubkey_raw'),
        privkeyRaw: !!localStorage.getItem('sobrkey_privatekey_raw'),
        pubkey: localStorage.getItem('sobrkey_pubkey'),
        hasPrivkey: !!localStorage.getItem('sobrkey_privatekey'),
        onboardingComplete: localStorage.getItem('sobrkey_onboarding_complete')
      });
      return { 
        success: false, 
        message: "Couldn't load your keys. Please try signing in again." 
      };
    }
    
    // Check if NostrTools is available
    if (!window.NostrTools) {
      const errorMsg = "NostrTools library is not loaded";
      console.error(errorMsg);
      
      // Log to server if error logger is available
      if (window.ErrorLogger) {
        window.ErrorLogger.logError(new Error(errorMsg), {
          component: "nostr-utils",
          function: "initializeNostr",
          nostrAvailable: false
        });
      }
      
      return { 
        success: false, 
        message: "Nostr library not loaded. Please refresh the page and try again." 
      };
    }
    
    // Detailed debugging of NostrTools
    console.log("NostrTools keys:", Object.keys(window.NostrTools));
    
    // Check if it's a function or object
    console.log("NostrTools SimplePool type:", typeof window.NostrTools.SimplePool);
    console.log("NostrTools getEventHash type:", typeof window.NostrTools.getEventHash);
    console.log("NostrTools signEvent type:", typeof window.NostrTools.signEvent);
    
    // Try to safely extract functions from the NostrTools object
    let simplePool, getEventHash, signEvent;
    
    try {
      // In some cases, the properties might exist but accessing them throws errors
      // or they might be getters that fail when executed
      simplePool = typeof window.NostrTools.SimplePool === 'function' ? window.NostrTools.SimplePool : null;
      getEventHash = typeof window.NostrTools.getEventHash === 'function' ? window.NostrTools.getEventHash : null;
      signEvent = typeof window.NostrTools.signEvent === 'function' ? window.NostrTools.signEvent : null;
      
      console.log("Direct access results:", {
        simplePool: typeof simplePool,
        getEventHash: typeof getEventHash,
        signEvent: typeof signEvent
      });
    } catch (e) {
      console.error("Error accessing NostrTools properties:", e);
      return { 
        success: false, 
        message: "Error accessing Nostr library functions. Please refresh the page and try again." 
      };
    }
    
    if (!simplePool || !getEventHash || !signEvent) {
      console.error("Missing critical Nostr functions:", { 
        hasSimplePool: !!simplePool, 
        hasGetEventHash: !!getEventHash, 
        hasSignEvent: !!signEvent,
        nostrToolsKeys: Object.keys(window.NostrTools)
      });
      
      // Show more detailed information about NostrTools structure
      try {
        console.log("NostrTools properties:", 
          Object.getOwnPropertyNames(window.NostrTools).map(prop => {
            return {
              name: prop,
              type: typeof window.NostrTools[prop]
            };
          })
        );
      } catch (e) {
        console.error("Error inspecting NostrTools:", e);
      }
      
      return { 
        success: false, 
        message: "Nostr library is incomplete. Please refresh the page and try again." 
      };
    }
    
    // Connect to relays
    const relays = window.SobrKeyConstants?.DEFAULT_RELAYS || [
      'wss://relay.damus.io',
      'wss://relay.nostr.band',
      'wss://nostr.wine'
    ];
    
    // Setup pool
    try {
      console.log("Creating SimplePool...");
      if (typeof window.NostrTools.SimplePool === 'function') {
        const SimplePool = window.NostrTools.SimplePool;
        nostrPool = new SimplePool();
        console.log("SimplePool created successfully:", nostrPool);
        
        // Debug available methods
        console.log("SimplePool methods:", 
          Object.getOwnPropertyNames(Object.getPrototypeOf(nostrPool))
            .filter(item => typeof nostrPool[item] === 'function')
        );
      } else {
        console.error("SimplePool is not a constructor function", window.NostrTools.SimplePool);
        throw new Error("SimplePool is not a constructor function");
      }
      
      // Connect to relays with detailed error handling
      console.log("Connecting to relays:", relays);
      const relayPromises = [];
      
      for (const relay of relays) {
        console.log(`Connecting to relay: ${relay}`);
        try {
          // Store the promise returned by ensureRelay
          const relayPromise = nostrPool.ensureRelay(relay).catch(err => {
            console.warn(`Failed to connect to relay ${relay}:`, err);
            return null; // Return null for failed connections
          });
          relayPromises.push(relayPromise);
        } catch (relayError) {
          console.warn(`Error connecting to relay ${relay}:`, relayError);
        }
      }
      
      // Wait for all connections to either succeed or fail
      Promise.allSettled(relayPromises).then(results => {
        const connectedCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        console.log(`Connected to ${connectedCount}/${relays.length} relays`);
        
        if (connectedCount === 0) {
          console.error("Failed to connect to any relays");
        } else {
          console.log("Relay connections established");
        }
      });
    } catch (poolError) {
      console.error("Error creating pool:", poolError);
      
      // Log to server if error logger is available
      if (window.ErrorLogger) {
        window.ErrorLogger.logError(poolError, {
          component: "nostr-utils",
          function: "initializeNostr",
          stage: "pool_creation",
          relays: relays,
          nostrToolsAvailable: !!window.NostrTools,
          simplePoolType: typeof window.NostrTools?.SimplePool
        });
      }
      
      return { 
        success: false, 
        message: `Error creating Nostr connection pool: ${poolError.message}` 
      };
    }
    
    console.log("Successfully connected to Nostr relays!");
    
    return { 
      success: true, 
      message: "Connected to Nostr network" 
    };
    
  } catch (error) {
    console.error("Error initializing Nostr:", error);
    return { 
      success: false, 
      message: `Error connecting to Nostr: ${error.message}` 
    };
  }
}

/**
 * Create and publish a Nostr note
 * @param {string} content - The content of the note
 * @param {Array} tags - Array of tags for the note
 * @returns {Promise<{success: boolean, message: string, event: Object|null}>}
 */
async function publishNote(content, tags = []) {
  try {
    if (!nostrPool) {
      const init = await initializeNostr();
      if (!init.success) return init;
    }
    
    if (!userPubkey || !userPrivkey) {
      return { 
        success: false, 
        message: "Your keys are missing. Please try signing out and back in.",
        event: null
      };
    }
    
    console.log("Creating Nostr event...");
    // Access functions directly from window.NostrTools
    const getEventHash = window.NostrTools.getEventHash;
    const signEvent = window.NostrTools.signEvent;
    
    // Log function access
    console.log("Publishing note - function access:", {
      getEventHash,
      signEvent,
      NostrToolsAvailable: !!window.NostrTools
    });
    
    // Create event
    let event = {
      kind: 1,
      pubkey: userPubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: tags,
      content: content
    };
    
    console.log("Event object before hash:", event);
    
    console.log("Calculating event hash...");
    if (typeof getEventHash === 'function') {
      event.id = getEventHash(event);
    } else if (typeof window.NostrTools.getEventHash === 'function') {
      event.id = window.NostrTools.getEventHash(event);
    } else {
      throw new Error("getEventHash is not a function");
    }
    
    console.log("Signing event...");
    if (typeof signEvent === 'function') {
      event = signEvent(event, userPrivkey);
    } else if (typeof window.NostrTools.signEvent === 'function') {
      event = window.NostrTools.signEvent(event, userPrivkey);
    } else {
      throw new Error("signEvent is not a function");
    }
    
    // Get relays from the pool or use our default list
    const relayUrls = Array.isArray(nostrPool.relays) ? nostrPool.relays : 
      (window.SobrKeyConstants?.DEFAULT_RELAYS || [
        'wss://relay.damus.io',
        'wss://relay.nostr.band',
        'wss://nostr.wine'
      ]);
    
    console.log("Publishing event to relays:", relayUrls);
    const pubs = nostrPool.publish(relayUrls, event);
    
    // Wait for at least one publish confirmation
    try {
      const pub = await Promise.any(pubs);
      console.log("Event published successfully:", pub);
      
      return {
        success: true,
        message: "Note published successfully!",
        event: event
      };
    } catch (pubError) {
      console.error("Failed to publish to any relay:", pubError);
      return {
        success: false,
        message: "Failed to publish to any relay. Please try again.",
        event: null
      };
    }
    
  } catch (error) {
    console.error("Error publishing note:", error);
    
    // Log to server if error logger is available
    if (window.ErrorLogger) {
      window.ErrorLogger.logError(error, {
        component: "nostr-utils",
        function: "publishNote",
        hasNostrPool: !!nostrPool,
        hasTools: !!window.NostrTools,
        hasKeys: !!userPubkey && !!userPrivkey,
        content: content ? content.substring(0, 50) + '...' : null, // Only log part of the content for privacy
        tagCount: tags ? tags.length : 0
      });
    }
    
    return {
      success: false,
      message: `Error publishing note: ${error.message}`,
      event: null
    };
  }
}

/**
 * Fetch notes with specific tags
 * @param {Array} tagFilters - Array of tag filters, e.g. ["t", "sobrkey"]
 * @param {number} limit - Maximum number of notes to fetch
 * @param {number} since - Fetch notes since this timestamp (seconds)
 * @returns {Promise<{success: boolean, message: string, notes: Array}>}
 */
async function fetchNotes(tagFilters = [["t", "sobrkey"]], limit = 100, since = null) {
  try {
    console.log("Fetching notes with tag filters:", tagFilters);
    
    if (!nostrPool) {
      const init = await initializeNostr();
      if (!init.success) return { ...init, notes: [] };
    }
    
    // Create a filter
    const filter = {
      kinds: [1],
      limit: limit
    };
    
    // Add tags filter
    if (tagFilters.length > 0) {
      for (const [key, value] of tagFilters) {
        if (!key || !value) continue;
        
        // Handle keys with or without # prefix
        const tagKey = key.startsWith('#') ? key : `#${key}`;
        if (!filter[tagKey]) filter[tagKey] = [];
        
        // Handle values with or without # prefix
        const tagValue = value.startsWith('#') ? value.substring(1) : value;
        filter[tagKey].push(tagValue);
        
        // Also add direct "t" tag in case some relays use a different format
        if (key === 't' || key === '#t') {
          if (!filter['t']) filter['t'] = [];
          filter['t'].push(tagValue);
        }
      }
    }
    
    // Add since filter if provided
    if (since) {
      filter.since = since;
    } else {
      // Default to last 30 days for better chances of finding content
      filter.since = Math.floor((Date.now() / 1000) - 30 * 24 * 60 * 60);
    }
    
    console.log("Fetching notes with filter:", filter);
    
    // Get relays from the pool or use our default list
    const relayUrls = Array.isArray(nostrPool.relays) ? nostrPool.relays : 
      (window.SobrKeyConstants?.DEFAULT_RELAYS || [
        'wss://relay.damus.io',
        'wss://relay.nostr.band',
        'wss://nostr.wine',
        'wss://nos.lol',
        'wss://relay.snort.social'
      ]);
    
    console.log("Using relays:", relayUrls);
    
    // Create a valid filter for Nostr relays
    const validFilter = {
      kinds: [1], // Note kind
      limit: limit
    };
    
    // Add tag filters properly
    if (tagFilters && tagFilters.length > 0) {
      tagFilters.forEach(([key, value]) => {
        if (key && value) {
          // Handle key with or without # prefix
          const tagKey = key.startsWith("#") ? key : `#${key}`;
          if (!validFilter[tagKey]) {
            validFilter[tagKey] = [];
          }
          
          // Handle value with or without # prefix
          const tagValue = value.startsWith("#") ? value.substring(1) : value;
          validFilter[tagKey].push(tagValue);
          
          // Also add as direct filter for relays that use different format
          if (key === "t" || key === "#t") {
            if (!validFilter.t) validFilter.t = [];
            validFilter.t.push(tagValue);
          }
        }
      });
    }
    
    // Add since filter
    if (since) {
      validFilter.since = since;
    }
    
    console.log("Using valid filter:", validFilter);
    
    // Fetch notes from relays
    let notes = [];
    try {
      if (typeof nostrPool.list === 'function') {
        console.log("Using SimplePool.list method");
        notes = await nostrPool.list(relayUrls, [validFilter]);
      } else if (typeof nostrPool.query === 'function') {
        console.log("Using SimplePool.query method");
        notes = await nostrPool.query(relayUrls, [validFilter]);
      } else {
        console.error("No compatible query method found in nostrPool", 
          Object.getOwnPropertyNames(Object.getPrototypeOf(nostrPool))
            .filter(item => typeof nostrPool[item] === 'function')
        );
        
        // Try the most basic relay implementation: connect to one relay manually
        console.log("Attempting to fetch using low-level relay API");
        
        const { Relay } = window.NostrTools;
        let manualNotes = [];
        
        // Connect to each relay manually with improved error handling
        for (const url of relayUrls) {
          try {
            console.log(`Attempting manual connection to ${url}...`);
            
            // Create the relay connection
            const relay = Relay.connect(url);
            
            // Set up connection timeout
            const connectionPromise = new Promise((resolve, reject) => {
              // Set up connect handler
              relay.on('connect', () => {
                console.log(`Connected to ${url} manually (confirmed)`);
                resolve(relay);
              });
              
              // Set up error handler
              relay.on('error', (err) => {
                console.warn(`Error connecting to ${url}:`, err);
                reject(err);
              });
              
              // Set a timeout
              setTimeout(() => {
                reject(new Error(`Connection timeout for ${url}`));
              }, 5000);
            });
            
            // Wait for connection or timeout
            const connectedRelay = await connectionPromise;
            
            // Request events with timeout
            const events = await new Promise((resolve) => {
              const events = [];
              console.log(`Subscribing to ${url} with filter:`, validFilter);
              
              try {
                const sub = connectedRelay.sub([validFilter]);
                
                sub.on('event', event => {
                  console.log(`Received event from ${url}:`, event);
                  events.push(event);
                });
                
                sub.on('eose', () => {
                  console.log(`End of stored events from ${url}`);
                  setTimeout(() => {
                    try {
                      sub.unsub();
                    } catch (e) {
                      console.warn(`Error unsubscribing from ${url}:`, e);
                    }
                    resolve(events);
                  }, 1000); // Wait a bit after EOSE
                });
                
                // Close after timeout even if no EOSE received
                setTimeout(() => {
                  try {
                    sub.unsub();
                  } catch (e) {
                    console.warn(`Error unsubscribing from ${url} (timeout):`, e);
                  }
                  resolve(events);
                }, 8000);
              } catch (subError) {
                console.warn(`Error creating subscription for ${url}:`, subError);
                resolve([]);
              }
            });
            
            console.log(`Got ${events.length} events from ${url} manually`);
            if (events.length > 0) {
              manualNotes = [...manualNotes, ...events];
            }
            
          } catch (manualError) {
            console.warn(`Manual connection to ${url} failed:`, manualError);
          }
        }
        
        if (manualNotes.length > 0) {
          notes = manualNotes;
        }
      }
    } catch (queryError) {
      console.error("Error during query:", queryError);
    }
    
    console.log(`Retrieved ${notes.length} notes`);
    
    // Sort notes by created_at (newest first)
    notes.sort((a, b) => b.created_at - a.created_at);
    
    return {
      success: true,
      message: `Retrieved ${notes.length} notes`,
      notes: notes
    };
    
  } catch (error) {
    console.error("Error fetching notes:", error);
    return {
      success: false,
      message: `Error fetching notes: ${error.message}`,
      notes: []
    };
  }
}

/**
 * Subscribe to new notes with specific tags
 * @param {Array} tagFilters - Array of tag filters, e.g. ["t", "sobrkey"]
 * @param {Function} callback - Callback function for new notes
 * @returns {Function} Unsubscribe function
 */
function subscribeToNotes(tagFilters = [["t", "sobrkey"]], callback) {
  try {
    if (!nostrPool) {
      console.error("Nostr not initialized");
      return () => {};
    }
    
    // Create a valid filter for Nostr relays
    const validFilter = {
      kinds: [1], // Note kind
      since: Math.floor(Date.now() / 1000) // Only notes from now on
    };
    
    // Add tag filters properly
    if (tagFilters && tagFilters.length > 0) {
      tagFilters.forEach(([key, value]) => {
        if (key && value) {
          // Handle key with or without # prefix
          const tagKey = key.startsWith("#") ? key : `#${key}`;
          if (!validFilter[tagKey]) {
            validFilter[tagKey] = [];
          }
          
          // Handle value with or without # prefix
          const tagValue = value.startsWith("#") ? value.substring(1) : value;
          validFilter[tagKey].push(tagValue);
          
          // Also add as direct filter for relays that use different format
          if (key === "t" || key === "#t") {
            if (!validFilter.t) validFilter.t = [];
            validFilter.t.push(tagValue);
          }
        }
      });
    }
    
    console.log("Using valid subscription filter:", validFilter);
    
    // Get relays from the pool or use our default list
    const relayUrls = Array.isArray(nostrPool.relays) ? nostrPool.relays : 
      (window.SobrKeyConstants?.DEFAULT_RELAYS || [
        'wss://relay.damus.io',
        'wss://relay.nostr.band',
        'wss://nostr.wine',
        'wss://nos.lol',
        'wss://relay.snort.social'
      ]);
    
    console.log("Subscribing to events on relays:", relayUrls);
    
    try {
      // Subscribe to new notes
      const sub = nostrPool.sub(relayUrls, [validFilter]);
      
      sub.on('event', (event) => {
        try {
          console.log("Received new event:", event);
          callback(event);
        } catch (callbackError) {
          console.error("Error in subscription callback:", callbackError);
        }
      });
      
      // Return unsubscribe function
      return () => {
        try {
          sub.unsub();
        } catch (unsubError) {
          console.error("Error unsubscribing:", unsubError);
        }
      };
    } catch (subError) {
      console.error("Error creating subscription:", subError);
      
      // Try manual subscription using Relay API
      try {
        const { Relay } = window.NostrTools;
        const activeSubscriptions = [];
        
        // Connect to each relay manually with improved error handling
        for (const url of relayUrls) {
          try {
            console.log(`Attempting manual subscription connection to ${url}...`);
            
            // Create the relay connection
            const relay = Relay.connect(url);
            
            // Set up connection promise
            const connectionPromise = new Promise((resolve, reject) => {
              // Set up handlers
              relay.on('connect', () => {
                console.log(`Connected to ${url} manually for subscription (confirmed)`);
                resolve(relay);
              });
              
              relay.on('error', (err) => {
                console.warn(`Error connecting to ${url} for subscription:`, err);
                reject(err);
              });
              
              // Set a timeout
              setTimeout(() => {
                reject(new Error(`Connection timeout for ${url}`));
              }, 5000);
            });
            
            // Wait for connection (with timeout)
            connectionPromise.then(connectedRelay => {
              try {
                console.log(`Creating subscription for ${url} with filter:`, validFilter);
                const sub = connectedRelay.sub([validFilter]);
                activeSubscriptions.push({ relay: connectedRelay, sub });
                
                // Listen for events
                sub.on('event', event => {
                  try {
                    console.log(`Received event from ${url} during subscription:`, event);
                    callback(event);
                  } catch (cbError) {
                    console.error(`Error in callback for ${url}:`, cbError);
                  }
                });
                
                // Handle errors
                sub.on('error', (err) => {
                  console.warn(`Subscription error for ${url}:`, err);
                });
              } catch (subError) {
                console.warn(`Error creating subscription for ${url}:`, subError);
              }
            }).catch(err => {
              console.warn(`Failed to connect to ${url} for subscription:`, err);
            });
            
          } catch (relayError) {
            console.warn(`Failed to initialize connection to ${url}:`, relayError);
          }
        }
        
        // Return unsubscribe function for all relays
        return () => {
          activeSubscriptions.forEach(({ relay, sub }) => {
            try {
              sub.unsub();
              relay.close();
            } catch (closeError) {
              console.warn("Error closing subscription:", closeError);
            }
          });
        };
      } catch (manualSubError) {
        console.error("Failed to create manual subscriptions:", manualSubError);
        return () => {};
      }
    }
    
  } catch (error) {
    console.error("Error subscribing to notes:", error);
    return () => {};
  }
}

/**
 * Format a note author's pubkey for display
 * @param {string} pubkey - The raw pubkey
 * @returns {string} Formatted pubkey (npub)
 */
function formatAuthor(pubkey) {
  try {
    const { nip19 } = window.NostrTools;
    const npub = nip19.npubEncode(pubkey);
    return npub.slice(0, 8) + '...' + npub.slice(-4);
  } catch (error) {
    console.error("Error formatting author:", error);
    return pubkey ? pubkey.slice(0, 6) + '...' : 'Unknown';
  }
}

/**
 * Debug the Nostr library availability
 * @returns {Object} Debug information about the Nostr library
 */
function debugNostr() {
  try {
    // Check if library is loaded
    if (!window.NostrTools) {
      return {
        loaded: false,
        message: "NostrTools is not loaded",
        details: null
      };
    }
    
    // Get all keys
    const allKeys = Object.keys(window.NostrTools);
    
    // Check critical functions
    const requiredFunctions = ['SimplePool', 'getEventHash', 'signEvent', 'nip19'];
    const missingFunctions = requiredFunctions.filter(f => !allKeys.includes(f));
    
    // Check function types
    const functionTypes = {};
    for (const key of allKeys) {
      functionTypes[key] = typeof window.NostrTools[key];
    }
    
    // Check state of global variable and LocalStorage
    const storageState = {
      hasPubkeyRaw: !!localStorage.getItem('sobrkey_pubkey_raw'),
      hasPrivkeyRaw: !!localStorage.getItem('sobrkey_privatekey_raw'),
      pubkey: localStorage.getItem('sobrkey_pubkey'),
      hasPrivkey: !!localStorage.getItem('sobrkey_privatekey'),
      onboardingComplete: localStorage.getItem('sobrkey_onboarding_complete')
    };
    
    return {
      loaded: true,
      allKeys,
      missingFunctions,
      functionTypes,
      storageState,
      message: missingFunctions.length > 0 
        ? `Missing required functions: ${missingFunctions.join(', ')}`
        : "All required functions are available"
    };
  } catch (error) {
    return {
      loaded: false,
      message: `Error debugging Nostr: ${error.message}`,
      error: error.toString()
    };
  }
}

// Export utilities
window.NostrUtils = {
  initialize: initializeNostr,
  publishNote,
  fetchNotes,
  subscribeToNotes,
  formatAuthor,
  debugNostr,
  get pool() { return nostrPool; },
  get pubkey() { return userPubkey; },
  get hasKeys() { return !!userPubkey && !!userPrivkey; }
};
