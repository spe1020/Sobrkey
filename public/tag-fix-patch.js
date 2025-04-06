/**
 * Sobrkey Tag Fix Patch
 * 
 * This script patches the Sobrkey application to properly handle #sobrkey tags
 * based on the debugging results. Add this script to your HTML files after
 * the main scripts are loaded.
 */

(function() {
  // Wait for page to load and all scripts to initialize
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Applying Sobrkey tag fixes...');
    
    // 1. Update relay configuration to focus on working relays
    const OPTIMIZED_RELAYS = [
      'wss://relay.damus.io',  // Working well with #t format
      'wss://nos.lol'          // Working well with #t format
      // Removed problematic relays
    ];
    
    // Apply to constants if available
    if (window.SobrKeyConstants) {
      window.SobrKeyConstants.DEFAULT_RELAYS = OPTIMIZED_RELAYS;
      console.log('Updated SobrKeyConstants.DEFAULT_RELAYS');
    }
    
    // Update localStorage
    try {
      localStorage.setItem('sobrkey_relays', JSON.stringify(OPTIMIZED_RELAYS));
      console.log('Updated localStorage relay configuration');
    } catch (e) {
      console.error('Could not update localStorage relays', e);
    }
    
    // 2. Override the fetchNotes function with optimized version
    if (window.NostrUtils) {
      // Store original function as fallback
      const originalFetchNotes = window.NostrUtils.fetchNotes;
      
      // Replace with optimized version
      window.NostrUtils.fetchNotes = async function(tagFilters = [["t", "sobrkey"]], limit = 100, since = null) {
        console.log('Using optimized fetchNotes function');
        
        // If no NostrPool, initialize as normal
        if (!window.NostrUtils.pool) {
          const init = await window.NostrUtils.initialize();
          if (!init.success) return { ...init, notes: [] };
        }
        
        // Default to last 30 days
        const queryTimestamp = since || Math.floor((Date.now() / 1000) - 30 * 24 * 60 * 60);
        
        // Get relays from constants or use optimized list
        const relayUrls = Array.isArray(window.NostrUtils.pool.relays) ? 
          window.NostrUtils.pool.relays.filter(url => 
            OPTIMIZED_RELAYS.includes(url) || 
            url.includes('damus') || 
            url.includes('nos.lol')
          ) : OPTIMIZED_RELAYS;
        
        console.log('Using optimized relays:', relayUrls);
        
        // Use specific filter structure for the relays that work
        // Based on debug results, #t format works on damus and nos.lol
        let primaryFilter = {
          kinds: [1],
          limit: limit,
          since: queryTimestamp,
          "#t": []
        };
        
        // Add fallback filters to try
        let fallbackFilters = [];
        
        // Process tag filters based on debug results
        if (tagFilters && tagFilters.length > 0) {
          // These will be our tag values to use
          const tagValues = [];
          
          // Extract tag values
          tagFilters.forEach(([key, value]) => {
            if (!key || !value) return;
            
            // Normalize the value (remove # if present)
            const normalizedValue = value.replace(/^#/, '');
            tagValues.push(normalizedValue);
            
            // Also try with hashtag for some relays
            if (!normalizedValue.startsWith('#')) {
              tagValues.push(`#${normalizedValue}`);
            }
          });
          
          // Add unique values to primary filter
          primaryFilter["#t"] = [...new Set(tagValues)];
          
          // Create fallback filter with t format
          fallbackFilters.push({
            kinds: [1],
            limit: limit,
            since: queryTimestamp,
            "t": [...new Set(tagValues)]
          });
        }
        
        console.log('Using optimized filter:', primaryFilter);
        if (fallbackFilters.length > 0) {
          console.log('With fallback filters:', fallbackFilters);
        }
        
        // Try to fetch with improved error handling
        try {
          // Get the nostr pool
          const nostrPool = window.NostrUtils.pool;
          
          // Try the primary filter first (most likely to work)
          let notes = [];
          
          // First approach: SimplePool.list (newer versions)
          if (typeof nostrPool.list === 'function') {
            try {
              console.log('Trying SimplePool.list with primary filter');
              notes = await Promise.race([
                nostrPool.list(relayUrls, [primaryFilter]),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Query timeout")), 15000))
              ]);
              console.log(`Retrieved ${notes.length} notes with list method`);
            } catch (e) {
              console.warn('Error using list method:', e.message);
            }
          }
          
          // Second approach: SimplePool.query (some versions)
          if (notes.length === 0 && typeof nostrPool.query === 'function') {
            try {
              console.log('Trying SimplePool.query with primary filter');
              notes = await Promise.race([
                nostrPool.query(relayUrls, [primaryFilter]),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Query timeout")), 15000))
              ]);
              console.log(`Retrieved ${notes.length} notes with query method`);
            } catch (e) {
              console.warn('Error using query method:', e.message);
            }
          }
          
          // Try fallback filters if no results
          if (notes.length === 0 && fallbackFilters.length > 0) {
            for (const fallbackFilter of fallbackFilters) {
              try {
                console.log('Trying fallback filter:', fallbackFilter);
                if (typeof nostrPool.list === 'function') {
                  notes = await nostrPool.list(relayUrls, [fallbackFilter]);
                } else if (typeof nostrPool.query === 'function') {
                  notes = await nostrPool.query(relayUrls, [fallbackFilter]);
                }
                
                if (notes.length > 0) {
                  console.log(`Found ${notes.length} notes using fallback filter`);
                  break;
                }
              } catch (e) {
                console.warn('Error with fallback filter:', e.message);
              }
            }
          }
          
          // Return the results
          if (notes.length > 0) {
            return {
              success: true,
              message: `Found ${notes.length} notes with #sobrkey tag`,
              notes: notes
            };
          }
          
          // If we couldn't find any notes with our improved filters,
          // fall back to the original implementation as a last resort
          console.log('No notes found with optimized filters, trying original implementation');
          return await originalFetchNotes(tagFilters, limit, since);
          
        } catch (error) {
          console.error('Error in optimized fetchNotes:', error);
          // Fall back to original implementation
          return await originalFetchNotes(tagFilters, limit, since);
        }
      };
      
      console.log('✅ Successfully patched NostrUtils.fetchNotes with tag fixes');
      
      // 3. Override the subscribeToNotes function to use the right format
      const originalSubscribe = window.NostrUtils.subscribeToNotes;
      
      window.NostrUtils.subscribeToNotes = function(tagFilters = [["t", "sobrkey"]], callback) {
        console.log('Using optimized subscribeToNotes function');
        
        // Convert tag filters to use #t format which works according to debug results
        const optimizedTagFilters = tagFilters.map(([key, value]) => {
          // Always use #t format for best results
          return ["#t", value.replace(/^#/, '')];
        });
        
        console.log('Optimized subscription filters:', optimizedTagFilters);
        return originalSubscribe(optimizedTagFilters, callback);
      };
      
      console.log('✅ Successfully patched NostrUtils.subscribeToNotes with tag fixes');
      
    } else {
      console.warn('⚠️ Could not apply patches: NostrUtils not available');
    }
    
    // Add an indicator that the patch was applied
    const patchIndicator = document.createElement('div');
    patchIndicator.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; z-index: 9999;';
    patchIndicator.textContent = 'Tag Fix Applied';
    document.body.appendChild(patchIndicator);
    
    // Hide indicator after 5 seconds
    setTimeout(() => {
      patchIndicator.style.display = 'none';
    }, 5000);
    
    console.log('✨ Sobrkey tag fix patch complete');
  });
})();