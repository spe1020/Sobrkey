/**
 * Debug utility to check the nostr-tools library structure
 */
(function() {
  // Wait for the window to load
  window.addEventListener('DOMContentLoaded', function() {
    console.log("🔍 Nostr Debug: Running nostr-debug.js");
    
    // Check script load order
    console.log("🔍 Nostr Debug: Script load order check");
    const scripts = Array.from(document.getElementsByTagName('script')).map(s => s.src);
    console.log("🔍 Nostr Debug: Loaded scripts:", scripts);
    
    // Create debug container
    const debugContainer = document.createElement('div');
    debugContainer.id = 'nostr-debug-container';
    debugContainer.style.display = 'none'; // Hidden by default
    debugContainer.style.position = 'fixed';
    debugContainer.style.bottom = '0';
    debugContainer.style.right = '0';
    debugContainer.style.width = '400px';
    debugContainer.style.maxHeight = '80%';
    debugContainer.style.overflowY = 'auto';
    debugContainer.style.backgroundColor = '#f8f9fa';
    debugContainer.style.border = '1px solid #ddd';
    debugContainer.style.borderRadius = '5px 0 0 0';
    debugContainer.style.padding = '15px';
    debugContainer.style.zIndex = '9999';
    debugContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    
    // Add debug panel toggle
    const debugToggle = document.createElement('button');
    debugToggle.textContent = '🛠️ Debug Tools';
    debugToggle.style.position = 'fixed';
    debugToggle.style.bottom = '0';
    debugToggle.style.right = '0';
    debugToggle.style.zIndex = '10000';
    debugToggle.style.padding = '5px 10px';
    debugToggle.style.backgroundColor = '#007bff';
    debugToggle.style.color = 'white';
    debugToggle.style.border = 'none';
    debugToggle.style.borderRadius = '5px 0 0 0';
    debugToggle.style.cursor = 'pointer';
    
    debugToggle.addEventListener('click', function() {
      const container = document.getElementById('nostr-debug-container');
      if (container.style.display === 'none') {
        container.style.display = 'block';
        this.textContent = '❌ Close Debug';
      } else {
        container.style.display = 'none';
        this.textContent = '🛠️ Debug Tools';
      }
    });
    
    // Now run all our checks and populate debug info
    let debugOutput = '<h3>Nostr Debug Information</h3>';
    let errorMessages = [];
    
    // Check if NostrTools exists
    if (typeof window.NostrTools === 'undefined') {
      console.error("🔍 Nostr Debug: NostrTools is not defined in window");
      errorMessages.push("NostrTools library is not loaded correctly.");
      debugOutput += '<div class="debug-error"><strong>❌ ERROR:</strong> NostrTools not found in window object</div>';
    } else {
      // Log available NostrTools functions
      const nostrKeys = Object.keys(window.NostrTools);
      console.log("🔍 Nostr Debug: NostrTools properties:", nostrKeys);
      
      // Check for critical functions and their types
      // Define critical components and their expected types
      const criticalComponents = [
        { name: 'SimplePool', type: 'function' },
        { name: 'getEventHash', type: 'function' },
        { name: 'signEvent', type: 'function' },
        { name: 'nip19', type: 'object' }
      ];
      
      const componentStatus = criticalComponents.map(comp => ({
        name: comp.name, 
        exists: nostrKeys.includes(comp.name),
        expectedType: comp.type,
        actualType: typeof window.NostrTools[comp.name]
      }));
      
      const missingComponents = componentStatus.filter(comp => 
        !comp.exists || comp.actualType !== comp.expectedType);
      
      if (missingComponents.length > 0) {
        console.error(`🔍 Nostr Debug: Missing critical Nostr components:`, missingComponents);
        errorMessages.push(`Missing or incorrect Nostr components: ${missingComponents.map(c => c.name).join(', ')}`);
        debugOutput += '<div class="debug-error"><strong>❌ ERROR:</strong> Missing critical Nostr components:</div>';
        debugOutput += '<ul>' + missingComponents.map(c => 
          `<li>${c.name}: ${c.exists ? 'exists' : 'missing'}, expected type: ${c.expectedType}, actual type: ${c.actualType}</li>`
        ).join('') + '</ul>';
      } else {
        console.log("🔍 Nostr Debug: All critical Nostr components are available");
        debugOutput += '<div class="debug-success"><strong>✅ SUCCESS:</strong> All critical Nostr components are available</div>';
      }
      
      // Add NostrTools properties to debug output
      debugOutput += '<div class="debug-section"><strong>NostrTools Properties:</strong>';
      debugOutput += '<ul>' + nostrKeys.map(key => 
        `<li>${key}: ${typeof window.NostrTools[key]}</li>`
      ).join('') + '</ul></div>';
    }
    
    // Check local storage keys
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sobrkey_'));
    console.log("🔍 Nostr Debug: Local storage keys:", keys);
    
    debugOutput += '<div class="debug-section"><strong>LocalStorage Keys:</strong>';
    debugOutput += '<ul>' + keys.map(key => `<li>${key}</li>`).join('') + '</ul></div>';
    
    // Check if we have the necessary keys
    const hasRawPubkey = !!localStorage.getItem('sobrkey_pubkey_raw');
    const hasRawPrivkey = !!localStorage.getItem('sobrkey_privatekey_raw');
    const hasPubkey = !!localStorage.getItem('sobrkey_pubkey');
    const hasPrivkey = !!localStorage.getItem('sobrkey_privatekey');
    
    if (!hasRawPubkey || !hasRawPrivkey) {
      console.error("🔍 Nostr Debug: Missing required raw keys in localStorage");
      errorMessages.push("Your Nostr keys are missing. Please go to the welcome page to create or import keys.");
      debugOutput += '<div class="debug-error"><strong>❌ ERROR:</strong> Missing required raw keys in localStorage</div>';
    } else {
      console.log("🔍 Nostr Debug: Required raw keys are present in localStorage");
      debugOutput += '<div class="debug-success"><strong>✅ SUCCESS:</strong> Required raw keys present in localStorage</div>';
    }
    
    // Display key info
    debugOutput += '<div class="debug-section"><strong>Key Status:</strong><ul>';
    debugOutput += `<li>Raw Public Key: ${hasRawPubkey ? '✅ Present' : '❌ Missing'}</li>`;
    debugOutput += `<li>Raw Private Key: ${hasRawPrivkey ? '✅ Present' : '❌ Missing'}</li>`;
    debugOutput += `<li>Public Key: ${hasPubkey ? '✅ Present' : '❌ Missing'}</li>`;
    debugOutput += `<li>Private Key: ${hasPrivkey ? '✅ Present' : '❌ Missing'}</li>`;
    debugOutput += '</ul></div>';
    
    // Attempt to decode and validate the keys if present
    if (hasRawPubkey && window.NostrTools && window.NostrTools.nip19) {
      try {
        const rawPubkey = localStorage.getItem('sobrkey_pubkey_raw');
        // Validate if the public key is properly formatted
        if (rawPubkey && rawPubkey.length === 64) {
          debugOutput += '<div class="debug-success"><strong>✅ SUCCESS:</strong> Public key has correct format (64 hex chars)</div>';
          
          // Try to encode as npub to validate as a proper key
          try {
            const npub = window.NostrTools.nip19.npubEncode(rawPubkey);
            debugOutput += `<div class="debug-success"><strong>✅ SUCCESS:</strong> Public key encodes as valid npub: ${npub.slice(0, 10)}...${npub.slice(-4)}</div>`;
          } catch (e) {
            debugOutput += `<div class="debug-error"><strong>❌ ERROR:</strong> Public key fails to encode as npub: ${e.message}</div>`;
            errorMessages.push("Public key validation failed. Key may be corrupt.");
          }
        } else {
          debugOutput += `<div class="debug-error"><strong>❌ ERROR:</strong> Public key has incorrect format (should be 64 hex chars, got ${rawPubkey ? rawPubkey.length : 0})</div>`;
          errorMessages.push("Public key has incorrect format. It should be 64 hexadecimal characters.");
        }
      } catch (e) {
        debugOutput += `<div class="debug-error"><strong>❌ ERROR:</strong> Error validating keys: ${e.message}</div>`;
      }
    }
    
    // Add tools section
    debugOutput += '<div class="debug-section"><strong>Debug Tools:</strong><ul>';
    debugOutput += '<li><button id="debug-console-log" style="margin: 5px;">Log Debug Info to Console</button></li>';
    debugOutput += '<li><button id="debug-clear-keys" style="margin: 5px;">Clear Local Storage Keys</button></li>';
    debugOutput += '<li><button id="debug-test-nostr" style="margin: 5px;">Test Nostr Initialization</button></li>';
    debugOutput += '</ul></div>';
    
    // Add CSS for debug panel
    const style = document.createElement('style');
    style.textContent = `
      #nostr-debug-container {
        font-family: monospace;
        font-size: 12px;
      }
      .debug-error {
        background-color: #ffeeee;
        color: red;
        padding: 8px;
        margin: 5px 0;
        border-radius: 3px;
      }
      .debug-success {
        background-color: #eeffee;
        color: green;
        padding: 8px;
        margin: 5px 0;
        border-radius: 3px;
      }
      .debug-section {
        background-color: #f0f0f0;
        padding: 8px;
        margin: 10px 0;
        border-radius: 3px;
      }
      #nostr-debug-container button {
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        cursor: pointer;
      }
      #nostr-debug-container button:hover {
        background-color: #0069d9;
      }
    `;
    
    document.head.appendChild(style);
    
    // Set debug container content
    debugContainer.innerHTML = debugOutput;
    
    // Add container and toggle to page
    document.body.appendChild(debugContainer);
    document.body.appendChild(debugToggle);
    
    // Add event listeners to debug tools
    setTimeout(() => {
      // Add event listeners after the container is in the DOM
      document.getElementById('debug-console-log')?.addEventListener('click', function() {
        console.log("🔍 Nostr Debug: Manual debug info dump", {
          nostrToolsExists: !!window.NostrTools,
          nostrToolsKeys: window.NostrTools ? Object.keys(window.NostrTools) : [],
          localStorage: keys.map(k => ({ key: k, exists: !!localStorage.getItem(k) })),
          rawPubkey: hasRawPubkey,
          rawPrivkey: hasRawPrivkey,
          pubkey: hasPubkey,
          privkey: hasPrivkey
        });
        alert("Debug info logged to console. Press F12 to view.");
      });
      
      document.getElementById('debug-clear-keys')?.addEventListener('click', function() {
        if (confirm("⚠️ WARNING: This will clear all your Nostr keys from this browser. You will lose access to your account unless you have backed up your private key. Continue?")) {
          keys.forEach(k => localStorage.removeItem(k));
          alert("Keys cleared. Refresh the page to see changes.");
          location.reload();
        }
      });
      
      document.getElementById('debug-test-nostr')?.addEventListener('click', function() {
        try {
          if (!window.NostrUtils || !window.NostrUtils.initialize) {
            alert("NostrUtils not found. Make sure nostr-utils.js is loaded.");
            return;
          }
          
          window.NostrUtils.initialize().then(result => {
            alert(`Nostr test result: ${result.success ? 'SUCCESS' : 'FAILED'}\n${result.message}`);
            console.log("Nostr initialization test result:", result);
          }).catch(err => {
            alert(`Nostr test error: ${err.message}`);
            console.error("Nostr initialization test error:", err);
          });
        } catch (e) {
          alert(`Test error: ${e.message}`);
          console.error("Error running Nostr test:", e);
        }
      });
    }, 500);
    
    // Display error messages at the top of the page if there are any
    if (errorMessages.length > 0) {
      const errorContainer = document.createElement('div');
      errorContainer.style.padding = '20px';
      errorContainer.style.backgroundColor = '#ffeeee';
      errorContainer.style.color = 'red';
      errorContainer.style.margin = '20px';
      errorContainer.style.borderRadius = '5px';
      
      errorContainer.innerHTML = `
        <h2>Nostr Errors Detected</h2>
        <ul>${errorMessages.map(msg => `<li>${msg}</li>`).join('')}</ul>
        <p>Click the "🛠️ Debug Tools" button at the bottom right for more details.</p>
      `;
      
      document.body.insertBefore(errorContainer, document.body.firstChild);
    }
  });
})();