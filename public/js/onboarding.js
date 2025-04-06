/**
 * Sobrkey Onboarding JavaScript
 * Handles the interactive welcome flow and Nostr key generation
 */

// Store the current step
let currentStep = 1;

// Store generated keys
let userKeys = {
  publicKey: null,
  privateKey: null,
  publicKeyRaw: null,
  privateKeyRaw: null
};

/**
 * Navigate to the next step in the onboarding process
 * @param {number} step - The step number to move to
 */
function nextStep(step) {
  // Hide current step
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  
  // Show new step
  document.getElementById(`step-${step}`).classList.add('active');
  
  // Update current step
  currentStep = step;
}

/**
 * Go back to the previous step
 * @param {number} step - The step number to move back to
 */
function prevStep(step) {
  // Hide current step
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  
  // Show new step
  document.getElementById(`step-${step}`).classList.add('active');
  
  // Update current step
  currentStep = step;
}

/**
 * Generate a simulated Nostr keypair for demo purposes
 */
async function generateKeys() {
  try {
    // Show loading state
    const generateBtn = document.getElementById('generate-keys-btn');
    const originalBtnText = generateBtn.textContent;
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    generateBtn.classList.add('generating');
    
    console.log('Starting key generation process...');
    
    // Generate a random private key (32 bytes)
    const privateKeyBytes = new Uint8Array(32);
    window.crypto.getRandomValues(privateKeyBytes);
    const privateKey = Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    console.log('Private key generated');
    
    // For demo purposes, derive a simple public key
    // In a real app, this would use secp256k1
    const publicKeyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      publicKeyBytes[i] = privateKeyBytes[31 - i]; // Simple reversing for demo
    }
    const publicKey = Array.from(publicKeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    console.log('Public key derived');
    
    // Create NIP-19 formatted keys (simulated for demo)
    // Convert to Base64 and format properly for NIP-19
    const privateKeyEncoded = 'nsec1' + btoa(privateKey).replace(/=/g, '').replace(/\+/g, 'P').replace(/\//g, 'S');
    const publicKeyEncoded = 'npub1' + btoa(publicKey).replace(/=/g, '').replace(/\+/g, 'P').replace(/\//g, 'S');
    
    // Store the keys
    userKeys.privateKey = privateKeyEncoded;
    userKeys.publicKey = publicKeyEncoded;
    userKeys.privateKeyRaw = privateKey;
    userKeys.publicKeyRaw = publicKey;
    
    // Save to local storage
    localStorage.setItem('sobrkey_privatekey', privateKeyEncoded);
    localStorage.setItem('sobrkey_privatekey_raw', privateKey);
    localStorage.setItem('sobrkey_pubkey', publicKeyEncoded);
    localStorage.setItem('sobrkey_pubkey_raw', publicKey);
    localStorage.setItem('sobrkey_keys_created', 'true');
    
    // Display the keys
    document.getElementById('public-key-text').textContent = publicKeyEncoded;
    document.getElementById('private-key-text').textContent = privateKeyEncoded;
    
    // Show the key display area
    document.getElementById('keys-display').style.display = 'block';
    
    // Show the continue button
    document.getElementById('continue-after-generation').style.display = 'inline-block';
    
    console.log('Keys generated and stored successfully');
  } catch (error) {
    console.error('Error generating keys:', error);
    console.error('Stack trace:', error.stack);
    alert('There was a problem generating your keys: ' + error.message);
  } finally {
    // Reset button state
    const generateBtn = document.getElementById('generate-keys-btn');
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate My Keys';
    generateBtn.classList.remove('generating');
  }
}

// The switchTab and importExistingKey functions have been removed since they're now handled via separate pages

/**
 * Copy text to clipboard
 * @param {string} elementId - The ID of the element containing text to copy
 */
function copyToClipboard(elementId) {
  const text = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(text).then(
    function() {
      // Success feedback - could show a tooltip or change button text temporarily
      const btn = event.target;
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
      console.log('Copying to clipboard was successful!');
    }, 
    function(err) {
      console.error('Could not copy text: ', err);
      alert('Failed to copy to clipboard. Please select and copy the text manually.');
    }
  );
}

/**
 * Enter the main application
 */
function enterApp() {
  // Save the onboarding completion status
  localStorage.setItem('sobrkey_onboarding_complete', 'true');
  
  // Redirect to the journal page
  window.location.href = '/journal';
}

// Check if user has already completed onboarding
document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('sobrkey_onboarding_complete') === 'true') {
    // User has completed onboarding before
    if (confirm('It looks like you\'ve already set up Sobrkey. Would you like to continue where you left off?')) {
      // Try to get the stored public key
      const storedPubkey = localStorage.getItem('sobrkey_pubkey');
      const storedPubkeyRaw = localStorage.getItem('sobrkey_pubkey_raw');
      
      if (storedPubkey) {
        userKeys.publicKey = storedPubkey;
        
        // Store raw key if available for potential future use
        if (storedPubkeyRaw) {
          userKeys.publicKeyRaw = storedPubkeyRaw;
        }
        
        enterApp();
      } else {
        // If key not found, restart onboarding
        localStorage.removeItem('sobrkey_onboarding_complete');
      }
    } else {
      // User wants to restart
      localStorage.removeItem('sobrkey_onboarding_complete');
      localStorage.removeItem('sobrkey_pubkey');
      localStorage.removeItem('sobrkey_pubkey_raw');
      localStorage.removeItem('sobrkey_keys_created');
    }
  } else {
    // Show step 1 by default
    document.querySelectorAll('.onboarding-step').forEach(step => {
      step.classList.remove('active');
    });
    document.getElementById('step-1').classList.add('active');
  }
});
