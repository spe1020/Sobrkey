/**
 * Optimized relay configuration for Sobrkey
 * 
 * Based on the debug results, we're focusing only on relays that
 * successfully return notes with the #sobrkey tag and removing ones
 * that have issues or don't provide results.
 */

// Use these optimized relay settings in your constants file or where DEFAULT_RELAYS is defined
const OPTIMIZED_RELAYS = [
  'wss://relay.damus.io',  // Worked best with #t format, returned 14 notes
  'wss://nos.lol'          // Also worked well with #t format, returned 13 notes
  
  // The following relays didn't return sobrkey notes or had issues:
  // 'wss://relay.nostr.band' - Returned notes but not with sobrkey tag
  // 'wss://relay.snort.social' - Didn't return any sobrkey notes
  // 'wss://nostr.wine' - Didn't return any sobrkey notes
  // 'wss://relay.nostr.social' - Had SSL certificate issues
];

/**
 * Update the application's relay configuration
 * This function can be called from any initialization point to update the relays
 */
function updateRelayConfiguration() {
  // Check if SobrKeyConstants exists
  if (window.SobrKeyConstants) {
    // Update the DEFAULT_RELAYS property
    window.SobrKeyConstants.DEFAULT_RELAYS = OPTIMIZED_RELAYS;
    console.log('Updated relay configuration to use optimized relays:', OPTIMIZED_RELAYS);
  } else {
    console.warn('SobrKeyConstants not found, relay configuration not updated');
  }
  
  // If you're storing relays in localStorage, update that too
  try {
    localStorage.setItem('sobrkey_relays', JSON.stringify(OPTIMIZED_RELAYS));
    console.log('Updated localStorage relay configuration');
  } catch (error) {
    console.error('Error updating localStorage relay configuration:', error);
  }
  
  return OPTIMIZED_RELAYS;
}

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OPTIMIZED_RELAYS,
    updateRelayConfiguration
  };
}