/**
 * Optimized fetchNotes function for Sobrkey
 * 
 * Based on the debug log results, this implementation specifically
 * focuses on the tag formats that work with relay.damus.io and nos.lol.
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
    
    // Only use the relays that we know work with our tag format
    // Based on debug results, relay.damus.io and nos.lol work with #t format
    const workingRelays = [
      'wss://relay.damus.io',
      'wss://nos.lol'
    ];
    
    // Get relays from the pool or use our filtered reliable list
    const relayUrls = Array.isArray(nostrPool.relays) ? 
      nostrPool.relays.filter(url => workingRelays.includes(url)) : 
      workingRelays;
    
    console.log("Using reliable relays:", relayUrls);
    
    // Create a filter specifically optimized for the relays that work
    const filter = {
      kinds: [1],
      limit: limit,
      since: queryTimestamp
    };
    
    // Process tag filters based on debug results
    if (tagFilters && tagFilters.length > 0) {
      // We need to emphasize the #t format since that's what works on damus and nos.lol
      tagFilters.forEach(([key, value]) => {
        if (!key || !value) return;
        
        // Debug logs show #t format works best
        if (!filter['#t']) {
          filter['#t'] = [];
        }
        
        // Normalize the value (remove # if present)
        const normalizedValue = value.replace(/^#/, '');
        filter['#t'].push(normalizedValue);
        
        // Also try the hashtag format for the one post that used it
        if (!filter['#t'].includes(`#${normalizedValue}`)) {
          filter['#t'].push(`#${normalizedValue}`);
        }
      });
    }
    
    console.log("Using optimized filter:", filter);
    
    // Fetch notes with proper error handling
    let notes = [];
    let error = null;
    
    try {
      // Try list method first (most common in newer versions)
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
        }
      }
      
      // If list didn't work, try query method
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
        }
      }
    } catch (e) {
      error = e;
      console.error("Error fetching notes:", e);
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
      message: "No notes found with the #sobrkey tag",
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