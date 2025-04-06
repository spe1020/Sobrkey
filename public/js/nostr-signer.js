/**
 * Temporary implementation of signEvent for Nostr compatibility
 * This adds the signEvent function to global NostrTools
 */
(function() {
  // Add signEvent function to window.NostrTools if it doesn't exist
  if (window.NostrTools && typeof window.NostrTools.signEvent !== 'function') {
    console.log("Adding signEvent to NostrTools...");
    
    /**
     * Sign a Nostr event
     * @param {Object} event - Nostr event to sign
     * @param {string} privateKey - Hex private key to sign with
     * @returns {Object} Signed event with signature
     */
    window.NostrTools.signEvent = function(event, privateKey) {
      console.log("signEvent called");
      
      if (!event || !privateKey) {
        console.error("signEvent: Missing event or privateKey");
        throw new Error("Missing required parameters for signing");
      }

      try {
        // Ensure we have getEventHash function
        if (typeof window.NostrTools.getEventHash !== 'function') {
          console.error("signEvent: getEventHash function is missing");
          throw new Error("getEventHash function is required for signing");
        }

        // Check if we have a proper finalizeEvent function to use instead
        if (typeof window.NostrTools.finalizeEvent === 'function') {
          console.log("Using finalizeEvent instead of manual signing");
          // finalizeEvent is a better approach that handles event creation and signing
          return window.NostrTools.finalizeEvent(event, privateKey);
        }

        // Check if we can use nostr-tools utils for schnorr signatures
        if (window.NostrTools.utils && typeof window.NostrTools.utils.schnorrSign === 'function') {
          console.log("Using schnorrSign from NostrTools.utils");
          
          // Make sure the event hash is set
          if (!event.id) {
            event.id = window.NostrTools.getEventHash(event);
          }
          
          // Sign the event hash
          event.sig = window.NostrTools.utils.schnorrSign(event.id, privateKey);
          return event;
        }

        console.error("signEvent: No suitable signing method found");
        throw new Error("No suitable signing method found in NostrTools");
      } catch (error) {
        console.error("Error in signEvent:", error);
        throw error;
      }
    };
    
    console.log("signEvent added to NostrTools");
  } else {
    console.log("NostrTools signEvent already exists or NostrTools is not loaded");
  }
})();