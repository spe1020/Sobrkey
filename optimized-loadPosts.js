/**
 * Optimized loadPosts function for the Community page
 * 
 * Based on the debug results, this implementation specifically
 * focuses on the tag formats that worked with relay.damus.io and nos.lol.
 */

/**
 * Load community posts with optimized tag format based on debug results
 */
async function loadPosts() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    showLoading(true);
    hideError();
    
    // Initialize Nostr connection
    const initResult = await window.NostrUtils.initialize();
    if (!initResult.success) {
      showError(initResult.message || 'Failed to connect to the Nostr network.');
      return;
    }
    
    // Get app tag (sobrkey)
    const appTag = window.SobrKeyConstants?.TAGS?.APP || 'sobrkey';
    console.log(`Fetching posts with app tag: "${appTag}"`);
    
    // Debug results showed that #t format works best with relay.damus.io and nos.lol
    // We'll directly use that format instead of trying multiple formats
    let fetchResult = await window.NostrUtils.fetchNotes([["#t", appTag]], LOAD_LIMIT);
    
    // If no results with the primary format, try the hashtag variant which worked for one post
    if (!fetchResult.success || (fetchResult.notes && fetchResult.notes.length === 0)) {
      console.log('No posts found with standard #t format, trying hashtag variant...');
      fetchResult = await window.NostrUtils.fetchNotes([["#t", `#${appTag}`]], LOAD_LIMIT);
    }
    
    // If still no results, try a combined approach as a last resort
    if (!fetchResult.success || (fetchResult.notes && fetchResult.notes.length === 0)) {
      console.log('No posts found with single formats, trying combined approach...');
      
      // Apply multiple tag formats simultaneously to maximize compatibility
      const combinedResult = await window.NostrUtils.fetchNotes([
        ["#t", appTag],
        ["#t", `#${appTag}`]
      ], LOAD_LIMIT);
      
      // Only use this result if it found something
      if (combinedResult.success && combinedResult.notes && combinedResult.notes.length > 0) {
        fetchResult = combinedResult;
      }
    }
    
    // Check for success or no posts
    if (!fetchResult.success) {
      showError(fetchResult.message || 'Failed to load community posts.');
      return;
    }
    
    // Store last fetched notes
    lastFetchedNotes = fetchResult.notes || [];
    
    // Display posts
    displayPosts(lastFetchedNotes);
    
    // Subscribe to new posts, ensuring compatibility with working format
    // The debug results showed #t format works best
    setUpSubscription(appTag, "#t");
    
  } catch (error) {
    console.error('Error loading posts:', error);
    await logErrorToServer(error, { context: 'loadPosts' });
    showError('Failed to load community posts. Please try refreshing the page.');
  } finally {
    isLoading = false;
    showLoading(false);
  }
}

/**
 * Set up subscription for new posts with optimized tag format
 * @param {string} appTag - The app tag to subscribe to
 * @param {string} [tagKey="#t"] - The tag key format to use
 */
function setUpSubscription(appTag, tagKey = "#t") {
  // Clear any existing subscription
  if (unsubscribeFunction) {
    try {
      unsubscribeFunction();
      unsubscribeFunction = null;
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }
  
  try {
    console.log(`Setting up subscription with ${tagKey} format: ${appTag}`);
    unsubscribeFunction = window.NostrUtils.subscribeToNotes([[tagKey, appTag]], handleNewPost);
  } catch (error) {
    console.error('Error setting up subscription:', error);
  }
}