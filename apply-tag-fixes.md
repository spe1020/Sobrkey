# Sobrkey Tag Fixes Implementation Guide

Based on the debug results, we've identified exactly why your app can't retrieve notes with the #sobrkey tag and created several optimized solutions. Here's how to apply them to your codebase:

## 1. Update the fetchNotes function in nostr-utils.js

Replace the current `fetchNotes` function in `/public/js/nostr-utils.js` with the optimized version in `optimized-fetchNotes.js`. This version specifically targets the working relay and tag format combinations.

Key improvements:
- Uses `#t` format that works with relay.damus.io and nos.lol
- Focuses only on relays that actually return #sobrkey tags
- Handles multiple tag formats for maximum compatibility

## 2. Update the loadPosts function in community.js

Replace the current `loadPosts` function in `/public/js/community.js` with the version in `optimized-loadPosts.js`. Also add the new `setUpSubscription` function that takes the tag format parameter.

This updates:
- Directly uses the `#t` format that worked in debug results
- Tries multiple formats in sequence to maximize results
- Updates the subscription to use the correct format

## 3. Update your relay configuration

Use the relay configuration from `optimized-relays.js` to update your constants or relay list. 

You can either:
- Update your constants file directly, or
- Add the `updateRelayConfiguration()` function to run on page initialization

## 4. (Optional) Add the debugging enhancements

If you want to continue debugging in the browser:
- Add the code from `community-debug.js` to your community page

## A single patch approach

Alternatively, you can create a patch script that applies all these fixes at once. Here's a simplified example:

```javascript
// Add this to the bottom of your main JS file or as a separate script loaded after other scripts

(function() {
  // Wait for page to load
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Applying Sobrkey tag fixes...');
    
    // 1. Update relay configuration to focus on working relays
    const OPTIMIZED_RELAYS = [
      'wss://relay.damus.io',
      'wss://nos.lol'
    ];
    
    // Apply to constants if available
    if (window.SobrKeyConstants) {
      window.SobrKeyConstants.DEFAULT_RELAYS = OPTIMIZED_RELAYS;
    }
    
    // Update localStorage
    try {
      localStorage.setItem('sobrkey_relays', JSON.stringify(OPTIMIZED_RELAYS));
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
        
        // Default to last 30 days
        const queryTimestamp = since || Math.floor((Date.now() / 1000) - 30 * 24 * 60 * 60);
        
        // Create optimized filter using #t format based on debug results
        const filter = {
          kinds: [1],
          limit: limit,
          since: queryTimestamp,
          "#t": []
        };
        
        // Process tags for #t format (which works on damus and nos.lol)
        if (tagFilters && tagFilters.length > 0) {
          tagFilters.forEach(([key, value]) => {
            if (!key || !value) return;
            
            // Normalize the value (remove # if present)
            const normalizedValue = value.replace(/^#/, '');
            filter["#t"].push(normalizedValue);
          });
        }
        
        // Using the original function but with our optimized parameters
        try {
          const result = await originalFetchNotes([["#t", "sobrkey"]], limit, since);
          return result;
        } catch (error) {
          console.error('Error in optimized fetchNotes:', error);
          // Fall back to original implementation if needed
          return await originalFetchNotes(tagFilters, limit, since);
        }
      };
      
      console.log('Successfully applied tag fix patches');
    } else {
      console.warn('Could not apply patches: NostrUtils not available');
    }
  });
})();
```

## Verification

After applying these changes:
1. Navigate to your community page
2. Check the browser console for messages indicating the fixes were applied
3. Verify that notes with the #sobrkey tag are now visible on the page
4. If issues persist, try the debugging tools to further diagnose

Let me know if you need any clarification or help implementing these fixes!
