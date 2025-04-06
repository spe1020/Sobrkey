/**
 * Sobrkey Community Diagnostics
 * 
 * This is an enhanced debugging version of the loadPosts function
 * for the Community page that provides more visibility into tag issues.
 * 
 * Add this to your community.js file or use as a separate module.
 */

/**
 * Load community posts with enhanced diagnostics
 */
async function loadPostsWithDiagnostics() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    showLoading(true);
    hideError();
    
    // Create diagnostics container
    const diagnosticsContainer = document.createElement('div');
    diagnosticsContainer.className = 'diagnostics-container';
    diagnosticsContainer.style.cssText = `
      padding: 15px;
      margin: 15px 0;
      border: 1px solid #ddd;
      border-radius: 5px;
      background-color: #f9f9f9;
      font-family: monospace;
      white-space: pre-wrap;
      font-size: 14px;
      max-height: 300px;
      overflow-y: auto;
    `;
    
    const postsContainer = document.getElementById('posts-container');
    if (postsContainer) {
      postsContainer.prepend(diagnosticsContainer);
    }
    
    function logDiagnostic(message) {
      console.log(message);
      const line = document.createElement('div');
      line.textContent = message;
      diagnosticsContainer.appendChild(line);
    }
    
    // Initialize Nostr connection
    logDiagnostic(`[${new Date().toISOString()}] Initializing Nostr connection...`);
    const initResult = await window.NostrUtils.initialize();
    
    if (!initResult.success) {
      logDiagnostic(`❌ Init failed: ${initResult.message}`);
      showError(initResult.message || 'Failed to connect to the Nostr network.');
      return;
    }
    
    logDiagnostic(`✓ Nostr initialized`);
    
    // Get the NostrPool object for inspection
    const nostrPool = window.NostrUtils.pool;
    if (nostrPool) {
      logDiagnostic(`✓ NostrPool available: ${typeof nostrPool}`);
      
      // Check available methods
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(nostrPool))
        .filter(item => typeof nostrPool[item] === 'function');
      
      logDiagnostic(`Available methods: ${methods.join(', ')}`);
      
      // Check relays
      const relays = Array.isArray(nostrPool.relays) ? nostrPool.relays : 
        (window.SobrKeyConstants?.DEFAULT_RELAYS || []);
      
      logDiagnostic(`Connected relays: ${relays.join(', ')}`);
    } else {
      logDiagnostic(`❌ NostrPool not available`);
    }
    
    // Get app tag (sobrkey)
    const appTag = window.SobrKeyConstants?.TAGS?.APP || 'sobrkey';
    logDiagnostic(`Using app tag: "${appTag}"`);
    
    // Try all tag variations
    const tagVariations = [
      { name: "Standard format", tags: [["t", appTag]] },
      { name: "Hashtag format", tags: [["t", `#${appTag}`]] },
      { name: "With '#t' key", tags: [["#t", appTag]] },
      { name: "Combined formats", tags: [["t", appTag], ["t", `#${appTag}`], ["#t", appTag]] }
    ];
    
    let combinedNotes = [];
    let foundWorkingVariation = false;
    
    for (const variation of tagVariations) {
      logDiagnostic(`\nTrying ${variation.name}: ${JSON.stringify(variation.tags)}`);
      
      try {
        // Set longer timeout for fetch
        const fetchResult = await Promise.race([
          window.NostrUtils.fetchNotes(variation.tags, LOAD_LIMIT),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Fetch timeout after 20s")), 20000))
        ]);
        
        if (fetchResult.success) {
          logDiagnostic(`✓ Fetch successful: ${fetchResult.notes?.length || 0} notes`);
          
          if (fetchResult.notes && fetchResult.notes.length > 0) {
            // Add unique notes to combined list
            fetchResult.notes.forEach(note => {
              if (!combinedNotes.some(existing => existing.id === note.id)) {
                combinedNotes.push(note);
              }
            });
            
            foundWorkingVariation = true;
            
            // Log tag formats found in the notes
            logDiagnostic(`ℹ️ Found format analysis:`);
            
            const tagFormats = {};
            fetchResult.notes.forEach(note => {
              note.tags.forEach(tag => {
                const key = tag[0];
                const value = tag[1];
                
                // Only interested in topic tags
                if (key === 't' || key === '#t') {
                  const format = `${key}:${value}`;
                  if (!tagFormats[format]) tagFormats[format] = 0;
                  tagFormats[format]++;
                }
              });
            });
            
            // Show tag formats
            Object.entries(tagFormats).forEach(([format, count]) => {
              logDiagnostic(`  - ${format}: ${count} occurrences`);
            });
            
            // Sample content from first note
            if (fetchResult.notes[0]) {
              const preview = fetchResult.notes[0].content.substring(0, 50);
              logDiagnostic(`  Sample: "${preview}..."`);
            }
          } else {
            logDiagnostic(`✓ Fetch successful but no notes found`);
          }
        } else {
          logDiagnostic(`❌ Fetch failed: ${fetchResult.message}`);
        }
      } catch (error) {
        logDiagnostic(`❌ Error: ${error.message}`);
      }
    }
    
    logDiagnostic(`\nTotal unique notes found: ${combinedNotes.length}`);
    
    // Sort by created_at (newest first)
    combinedNotes.sort((a, b) => b.created_at - a.created_at);
    
    // Store last fetched notes
    lastFetchedNotes = combinedNotes;
    
    // Display posts
    displayPosts(combinedNotes);
    
    // Recommendation based on results
    if (foundWorkingVariation) {
      logDiagnostic(`\n✅ SUCCESS: Found working tag format. `+
                    `Update your code to use the format that worked best.`);
    } else {
      logDiagnostic(`\n❌ No working tag format found. Try these approaches:`);
      logDiagnostic(`1. Publish a test note with the #sobrkey tag`);
      logDiagnostic(`2. Check if your relays are correctly connected`);
      logDiagnostic(`3. Try different relays (nos.lol or relay.damus.io)`);
      logDiagnostic(`4. Use broader filters in your query`);
    }
    
    // Try to set up subscription regardless
    try {
      logDiagnostic(`\nSetting up subscription for new posts...`);
      setUpSubscription(appTag);
      logDiagnostic(`✓ Subscription established`);
    } catch (error) {
      logDiagnostic(`❌ Subscription error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error loading posts:', error);
    showError('An error occurred while loading community posts. Please try again.');
  } finally {
    isLoading = false;
    showLoading(false);
  }
}

/**
 * Add debug button to community page
 */
function addDebugButton() {
  const controlsContainer = document.querySelector('.community-controls') || 
                           document.querySelector('.page-header');
  
  if (controlsContainer) {
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug Community';
    debugButton.className = 'debug-button';
    debugButton.style.cssText = `
      background-color: #f0ad4e;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      margin-left: 10px;
      cursor: pointer;
    `;
    
    debugButton.addEventListener('click', () => {
      loadPostsWithDiagnostics();
    });
    
    controlsContainer.appendChild(debugButton);
  }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', () => {
  addDebugButton();
});