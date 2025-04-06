/**
 * Sobrkey Nostr Tag Fix
 * 
 * This is an improved implementation of the tag filtering code
 * for fetching Nostr notes with the #sobrkey tag.
 * 
 * Replace the original fetchNotes function in nostr-utils.js with this improved version.
 */

/**
 * Fetch notes with specific tags
 * @param {Array} tagFilters - Array of tag filters, e.g. [["t", "sobrkey"]]
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
    
    // Default to last 30 days for better chances of finding content
    const queryTimestamp = since || Math.floor((Date.now() / 1000) - 30 * 24 * 60 * 60);
    
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
    
    // Build a comprehensive filter that works with different relay implementations
    const filter = {
      kinds: [1],
      limit: limit,
      since: queryTimestamp
    };
    
    // Process tag filters for compatibility with different relay implementations
    if (tagFilters && tagFilters.length > 0) {
      // Create containers for different tag formats
      const tTags = [];
      const hashTTags = [];
      
      // Process each tag filter
      tagFilters.forEach(([key, value]) => {
        if (!key || !value) return;
        
        // Handle the tag key variations
        const normalizedKey = key.toLowerCase().replace(/^#/, '');
        
        // Only process 't' tags (topics/hashtags)
        if (normalizedKey === 't') {
          // Handle value with or without # prefix
          const normalizedValue = value.replace(/^#/, '');
          
          // Add to both formats for maximum compatibility
          tTags.push(normalizedValue);
          hashTTags.push(normalizedValue);
        }
      });
      
      // Add the tag arrays to the filter
      if (tTags.length > 0) {
        filter.t = tTags;
      }
      
      if (hashTTags.length > 0) {
        filter['#t'] = hashTTags;
      }
    }
    
    console.log("Using filter:", filter);
    
    // Fetch notes with proper error handling
    let notes = [];
    let error = null;
    
    try {
      // Try multiple different query methods for compatibility
      
      // Method 1: SimplePool.list (newer nostr-tools versions)
      if (typeof nostrPool.list === 'function') {
        console.log("Using SimplePool.list method");
        try {
          notes = await Promise.race([
            nostrPool.list(relayUrls, [filter]),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Query timeout")), 15000))
          ]);
          console.log(`Retrieved ${notes.length} notes using list method`);
        } catch (e) {
          console.warn("Error using list method:", e.message);
          // Continue to next method
        }
      }
      
      // Method 2: SimplePool.query (some nostr-tools versions)
      if (notes.length === 0 && typeof nostrPool.query === 'function') {
        console.log("Using SimplePool.query method");
        try {
          notes = await Promise.race([
            nostrPool.query(relayUrls, [filter]),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Query timeout")), 15000))
          ]);
          console.log(`Retrieved ${notes.length} notes using query method`);
        } catch (e) {
          console.warn("Error using query method:", e.message);
          // Continue to next method
        }
      }
      
      // Method 3: Try individually with relays (most compatible)
      if (notes.length === 0) {
        console.log("Using individual relay connections");
        notes = await fetchNotesFromIndividualRelays(relayUrls, filter);
        console.log(`Retrieved ${notes.length} notes using individual connections`);
      }
      
    } catch (e) {
      error = e;
      console.error("Error fetching notes:", e);
    }
    
    // Check if we've found any notes
    if (notes.length === 0 && !error) {
      // If no results with the current filter, try a variant with 'tags' instead
      console.log("No notes found, trying alternative tag format...");
      
      // Create an alternative filter that some relays might use
      const alternativeFilter = { ...filter };
      if (filter.t && filter.t.length > 0) {
        alternativeFilter.tags = filter.t;
        delete alternativeFilter.t;
      }
      
      try {
        // Try with alternative filter
        if (typeof nostrPool.list === 'function') {
          notes = await nostrPool.list(relayUrls, [alternativeFilter]);
        } else if (typeof nostrPool.query === 'function') {
          notes = await nostrPool.query(relayUrls, [alternativeFilter]);
        }
        
        console.log(`Retrieved ${notes.length} notes using alternative filter`);
      } catch (e) {
        // If this also fails, we'll return the original empty result
        console.warn("Error using alternative filter:", e.message);
      }
    }
    
    // If we've found notes, return them
    if (notes.length > 0) {
      return {
        success: true,
        message: `Found ${notes.length} notes`,
        notes: notes
      };
    }
    
    // If we've hit an error and have no notes, return the error
    if (error) {
      return {
        success: false,
        message: `Error fetching notes: ${error.message}`,
        notes: []
      };
    }
    
    // Otherwise, return an empty success
    return {
      success: true,
      message: "No notes found with the specified tags",
      notes: []
    };
    
  } catch (error) {
    console.error("Error in fetchNotes:", error);
    return {
      success: false,
      message: `Failed to fetch notes: ${error.message}`,
      notes: []
    };
  }
}

/**
 * Helper function to fetch notes from individual relays
 * @param {Array} relayUrls - Array of relay URLs
 * @param {Object} filter - Filter object
 * @returns {Promise<Array>} - Array of notes
 */
async function fetchNotesFromIndividualRelays(relayUrls, filter) {
  const { Relay } = window.NostrTools;
  const notes = new Map(); // Use a Map to deduplicate notes by ID
  const connectionPromises = [];
  
  // Connect to each relay separately
  for (const url of relayUrls) {
    const connectionPromise = new Promise(async (resolve) => {
      try {
        console.log(`Attempting connection to ${url}...`);
        
        // Create the relay connection
        const relay = Relay.connect(url);
        
        // Wait for connection with timeout
        const connected = await Promise.race([
          new Promise(resolve => {
            relay.on('connect', () => resolve(true));
          }),
          new Promise(resolve => {
            setTimeout(() => resolve(false), 5000);
          })
        ]);
        
        if (!connected) {
          console.log(`Could not connect to ${url} within timeout`);
          resolve();
          return;
        }
        
        console.log(`Connected to ${url}, requesting data...`);
        
        // Set up subscription
        const sub = relay.sub([filter]);
        
        // Handle incoming events
        sub.on('event', event => {
          if (!notes.has(event.id)) {
            notes.set(event.id, event);
          }
        });
        
        // Wait for EOSE or timeout
        await Promise.race([
          new Promise(resolve => {
            sub.on('eose', () => {
              console.log(`Received EOSE from ${url}`);
              resolve();
            });
          }),
          new Promise(resolve => {
            setTimeout(() => {
              console.log(`Timeout waiting for EOSE from ${url}`);
              resolve();
            }, 10000);
          })
        ]);
        
        // Clean up
        sub.unsub();
        relay.close();
        resolve();
        
      } catch (error) {
        console.error(`Error connecting to ${url}:`, error.message);
        resolve();
      }
    });
    
    connectionPromises.push(connectionPromise);
  }
  
  // Wait for all connection attempts to complete
  await Promise.all(connectionPromises);
  
  // Return the deduplicated notes as array
  return Array.from(notes.values());
}