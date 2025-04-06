/**
 * Sobrkey - Community Page Script
 * Handles community post viewing and creation
 */

(function() {
  // Global state
  let unsubscribeFunction = null;
  const LOAD_LIMIT = 100; // Number of posts to load at once
  let isLoading = false;
  let lastFetchedNotes = [];
  
  /**
   * Initialize the community page
   */
  async function initializeCommunityPage() {
    try {
      // Set current date
      updateCurrentDate();
      
      // Check for required user data
      if (!checkUserAuthentication()) {
        return;
      }
      
      // Set up event listeners
      setupEventListeners();
      
      // Load posts
      await loadPosts();
      
    } catch (error) {
      console.error('Failed to initialize community page:', error);
      await logErrorToServer(error, { context: 'initializeCommunityPage' });
      showError('Failed to initialize the community page. Please refresh the page.');
    }
  }

  /**
   * Set up event listeners for the page
   */
  function setupEventListeners() {
    // Toggle sidebar on mobile
    document.getElementById('sidebarToggle').addEventListener('click', function() {
      document.querySelector('.sidebar').classList.toggle('active');
    });
    
    // Publish post button
    document.getElementById('publish-post').addEventListener('click', submitPost);
    
    // Add tag button
    document.getElementById('add-tag').addEventListener('click', addTag);
    
    // Refresh posts buttons
    document.getElementById('refresh-posts')?.addEventListener('click', refreshPosts);
    document.getElementById('refresh-empty')?.addEventListener('click', refreshPosts);
    
    // Time period filter
    document.getElementById('time-filter')?.addEventListener('change', function() {
      filterPostsByTime(this.value);
    });
    
    // Retry connection button
    document.getElementById('retry-connection')?.addEventListener('click', function() {
      loadPosts();
    });
    
    // Debug fetch button 
    document.getElementById('debug-fetch')?.addEventListener('click', function() {
      debugFetchPosts();
    });
    
    // Make post content textarea auto-expand
    const postContent = document.getElementById('post-content');
    if (postContent) {
      postContent.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 300) + 'px';
      });
    }
  }

  /**
   * Debug fetch posts function
   */
  async function debugFetchPosts() {
    try {
      showLoading(true);
      hideError();
      
      // Initialize Nostr connection
      const initResult = await window.NostrUtils.initialize();
      if (!initResult.success) {
        showError("Could not initialize Nostr: " + initResult.message);
        return;
      }
      
      // Try different tag variations
      const tagVariations = [
        [["t", "sobrkey"]],
        [["#t", "sobrkey"]],
        [["t", "#sobrkey"]],
        [["t", "sobrkey"], ["t", "recovery"]],
        [["keyword", "sobrkey"]]
      ];
      
      // Test message
      let debugMessage = "DEBUG RESULTS:\n\n";
      
      // Try each variation
      for (const tags of tagVariations) {
        try {
          debugMessage += `Testing tags: ${JSON.stringify(tags)}\n`;
          const result = await window.NostrUtils.fetchNotes(tags, 20);
          debugMessage += `Success: ${result.success}, Notes: ${result.notes?.length || 0}\n`;
          if (result.notes && result.notes.length > 0) {
            debugMessage += `First note: ${JSON.stringify(result.notes[0].content.slice(0, 50))}...\n`;
          }
        } catch (e) {
          debugMessage += `Error: ${e.message}\n`;
        }
        debugMessage += "\n";
      }
      
      // Try direct query
      try {
        const nostrPool = window.NostrUtils.pool;
        if (nostrPool) {
          debugMessage += "Direct pool query:\n";
          const relays = Array.from(nostrPool.relays.keys()).slice(0, 3);
          debugMessage += `Using relays: ${relays.join(", ")}\n`;
          
          // Get events using direct method
          nostrPool.querySync(
            relays,
            { kinds: [1], "#t": ["sobrkey"] },
            (event) => {
              debugMessage += `Got event: ${event.id.slice(0, 8)}\n`;
            }
          );
        }
      } catch (e) {
        debugMessage += `Direct query error: ${e.message}\n`;
      }
      
      // Display debug info
      alert(debugMessage);
      console.log(debugMessage);
      
    } catch (error) {
      console.error("Debug error:", error);
      alert("Debug error: " + error.message);
    } finally {
      showLoading(false);
    }
  }

  /**
   * Load community posts
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
      
      // First try with the app tag
      let fetchResult = await window.NostrUtils.fetchNotes([["t", appTag]], LOAD_LIMIT);
      
      // If no results, try with hashtag variant
      if (!fetchResult.success || (fetchResult.notes && fetchResult.notes.length === 0)) {
        console.log('No posts found with regular tag, trying hashtag variant...');
        fetchResult = await window.NostrUtils.fetchNotes([["t", `#${appTag}`]], LOAD_LIMIT);
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
      
      // Subscribe to new posts
      setUpSubscription(appTag);
      
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
   * Display posts in the container
   * @param {Array} notes - Array of notes to display
   */
  function displayPosts(notes) {
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = '';
    
    if (!notes || notes.length === 0) {
      // Enhanced empty state with icon and better styling
      postsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div class="empty-state-text">No community posts yet. Be the first to share!</div>
          <button id="refresh-empty" class="btn-outline">Refresh Posts</button>
        </div>
      `;
      
      // Add event listener for the refresh button in empty state
      document.getElementById('refresh-empty')?.addEventListener('click', refreshPosts);
      return;
    }
    
    // Sort posts by timestamp (newest first)
    const sortedNotes = [...notes].sort((a, b) => b.created_at - a.created_at);
    
    // Add posts to container
    sortedNotes.forEach(note => {
      createPostElement(note, postsContainer);
    });
  }
  
  /**
   * Set up subscription for new posts
   * @param {string} appTag - Tag to subscribe to
   */
  function setUpSubscription(appTag) {
    // Unsubscribe from previous subscription if exists
    if (unsubscribeFunction) {
      unsubscribeFunction();
    }
    
    // Subscribe to new posts with regular tag and hashtag variant
    const tagFilters = [["t", appTag]];
    console.log('Setting up subscription with filter:', tagFilters);
    
    unsubscribeFunction = window.NostrUtils.subscribeToNotes(tagFilters, (note) => {
      console.log('New note received:', note);
      // Add to lastFetchedNotes
      lastFetchedNotes.push(note);
      // Add new post to the top of the feed
      const postsContainer = document.getElementById('posts-container');
      createPostElement(note, postsContainer, true);
    });
  }
  
  /**
   * Filter posts by time period
   * @param {string|number} days - Number of days to filter by
   */
  function filterPostsByTime(days) {
    if (!lastFetchedNotes || lastFetchedNotes.length === 0) return;
    
    const daysNum = parseInt(days, 10);
    if (daysNum === 0) {
      // Show all posts
      displayPosts(lastFetchedNotes);
      return;
    }
    
    // Filter posts by time
    const cutoffTime = Math.floor(Date.now() / 1000) - (daysNum * 24 * 60 * 60);
    const filteredNotes = lastFetchedNotes.filter(note => note.created_at >= cutoffTime);
    
    // Display filtered posts
    displayPosts(filteredNotes);
  }

  /**
   * Create and submit a new post
   */
  async function submitPost() {
    const contentInput = document.getElementById('post-content');
    const content = contentInput.value.trim();
    
    if (!content) {
      showToast('Please enter some content for your post.', 'warning');
      contentInput.focus();
      return;
    }
    
    const publishButton = document.getElementById('publish-post');
    const originalText = publishButton.textContent;
    
    try {
      // Update button state
      publishButton.textContent = 'Publishing...';
      publishButton.disabled = true;
      
      // Get tags
      const tags = [];
      
      // Always add the app tag from constants
      const appTag = window.SobrKeyConstants?.TAGS?.APP || 'sobrkey';
      tags.push(["t", appTag]);
      
      // Add other tags
      const tagElements = document.querySelectorAll('.tag:not(#add-tag)');
      tagElements.forEach(tag => {
        const tagText = tag.textContent.trim();
        if (tagText !== 'sobrkey') {
          tags.push(["t", tagText]);
        }
      });
      
      // Publish the post
      const result = await window.NostrUtils.publishNote(content, tags);
      
      if (!result.success) {
        showToast(result.message || 'Failed to publish your post.', 'error');
        return;
      }
      
      // Clear the input and show success
      contentInput.value = '';
      contentInput.style.height = 'auto';
      showToast('Your post has been published!', 'success');
      
      // Clear additional tags (keep the app tag)
      const tagsToRemove = Array.from(tagElements).filter(tag => tag.textContent.trim() !== appTag);
      tagsToRemove.forEach(tag => tag.remove());
      
      // Reload posts after a short delay to show the new post
      setTimeout(() => {
        refreshPosts();
      }, 1000);
      
    } catch (error) {
      console.error('Error publishing post:', error);
      await logErrorToServer(error, { context: 'submitPost' });
      showToast('Failed to publish your post. Please try again.', 'error');
    } finally {
      // Reset button state
      publishButton.textContent = originalText;
      publishButton.disabled = false;
    }
  }
  
  /**
   * Store a post locally for later publishing
   * @param {string} content - Post content
   * @param {Array} tags - Post tags
   */
  function storePostLocally(content, tags) {
    try {
      // Get existing drafts
      let drafts = JSON.parse(localStorage.getItem('sobrkey_post_drafts') || '[]');
      
      // Add new draft
      drafts.push({
        content,
        tags,
        created_at: Math.floor(Date.now() / 1000)
      });
      
      // Store drafts
      localStorage.setItem('sobrkey_post_drafts', JSON.stringify(drafts));
      
    } catch (error) {
      console.error('Error storing post locally:', error);
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type of toast (success, error, warning, info)
   */
  function showToast(message, type = 'info') {
    // Check if toast container exists, create if not
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
      `;
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set background color based on type
    let bgColor = '#4CAF50'; // success (green)
    if (type === 'error') bgColor = '#F44336'; // red
    if (type === 'warning') bgColor = '#FF9800'; // orange
    if (type === 'info') bgColor = '#2196F3'; // blue
    
    toast.style.cssText = `
      padding: 12px 20px;
      margin-bottom: 10px;
      background-color: ${bgColor};
      color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideIn 0.3s ease forwards;
      max-width: 400px;
      min-width: 300px;
    `;
    
    // Add animation keyframes if they don't exist
    if (!document.getElementById('toast-keyframes')) {
      const style = document.createElement('style');
      style.id = 'toast-keyframes';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add message and close button
    toast.innerHTML = `
      <div>${message}</div>
      <button style="background: transparent; border: none; color: white; cursor: pointer; padding: 0; margin-left: 8px; font-size: 18px;">×</button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Add click handler to close button
    const closeButton = toast.querySelector('button');
    closeButton.addEventListener('click', () => {
      closeToast(toast);
    });
    
    // Auto close after 3 seconds
    setTimeout(() => {
      closeToast(toast);
    }, 3000);
  }
  
  /**
   * Close a toast notification with animation
   * @param {HTMLElement} toast - Toast element to close
   */
  function closeToast(toast) {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Create a post element from a Nostr note
   * @param {Object} note - Nostr note object
   * @returns {HTMLElement} The post element
   */
  function createPostElement(note, container, isNew = false) {
    try {
      // Create post element
      const postEl = document.createElement('div');
      postEl.className = 'post';
      if (isNew) postEl.classList.add('new-post');
      
      // Create post content
      const createdAt = new Date(note.created_at * 1000);
      const authorDisplay = window.NostrUtils.formatAuthor(note.pubkey);
      
      // Generate author avatar (first letter of author name or a fallback)
      const avatarLetter = authorDisplay.charAt(0).toUpperCase();
      
      // Format tags
      const tags = formatTags(note.tags);
      
      // Calculate human-readable time ago
      const timeAgo = getTimeAgo(createdAt);
      
      // Get the first two characters of the pubkey for color generation
      const colorSeed = note.pubkey.slice(0, 2);
      
      // Convert the color seed to a hue value (0-360)
      const hue = (parseInt(colorSeed, 16) % 360);
      const avatarBgColor = `hsl(${hue}, 80%, 60%)`;
      
      // Build post HTML with enhanced styling
      postEl.innerHTML = `
        <div class="post-header">
          <div class="post-author">
            <div class="post-author-avatar" style="background-color: ${avatarBgColor}">
              ${avatarLetter}
            </div>
            <span>${authorDisplay}</span>
          </div>
          <span class="post-date" title="${formatDate(createdAt)}">${timeAgo}</span>
        </div>
        <div class="post-content">${escapeHTML(note.content)}</div>
        <div class="post-footer">
          ${tags ? `<div class="post-tags">${tags}</div>` : '<div class="post-tags"></div>'}
          <div class="post-interactions">
            <div class="post-interaction" title="Like" data-action="like" data-note-id="${note.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
              <span class="like-count">0</span>
            </div>
            <div class="post-interaction" title="Share" data-action="share" data-note-id="${note.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8.59 13.51L15.42 17.49" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15.41 6.51L8.59 10.49" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      `;
      
      // Add event listeners for interactions
      postEl.querySelector('[data-action="like"]')?.addEventListener('click', function() {
        handleLike(this, note.id);
      });
      
      postEl.querySelector('[data-action="share"]')?.addEventListener('click', function() {
        handleShare(note);
      });
      
      // Add to container (new posts at top, existing at bottom)
      if (isNew) {
        container.insertBefore(postEl, container.firstChild);
        // Highlight new posts briefly
        setTimeout(() => {
          postEl.classList.remove('new-post');
        }, 3000);
      } else {
        container.appendChild(postEl);
      }
      
      return postEl;
      
    } catch (error) {
      console.error('Error creating post element:', error);
      return null;
    }
  }
  
  /**
   * Handle like action
   * @param {HTMLElement} element - The like button element
   * @param {string} noteId - ID of the note being liked
   */
  function handleLike(element, noteId) {
    const likeCountEl = element.querySelector('.like-count');
    const currentCount = parseInt(likeCountEl.textContent, 10);
    
    // Toggle "liked" class for UI feedback
    if (element.classList.contains('liked')) {
      element.classList.remove('liked');
      likeCountEl.textContent = Math.max(0, currentCount - 1);
      
      // Update like color
      element.querySelector('svg path').setAttribute('fill', 'none');
      element.style.color = '#777';
    } else {
      element.classList.add('liked');
      likeCountEl.textContent = currentCount + 1;
      
      // Update like color
      element.querySelector('svg path').setAttribute('fill', 'currentColor');
      element.style.color = '#F06292';
    }
    
    // In a full implementation, here we would actually send the like event to the Nostr network
    console.log(`Liked note with ID: ${noteId}`);
  }
  
  /**
   * Handle share action
   * @param {Object} note - Note object to share
   */
  function handleShare(note) {
    // Get the author and a preview of the content
    const authorDisplay = window.NostrUtils.formatAuthor(note.pubkey);
    const contentPreview = note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content;
    
    // Create share text
    const shareText = `Post by ${authorDisplay}: "${contentPreview}"`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: 'Sobrkey Post',
        text: shareText,
        url: window.location.href
      }).then(() => {
        console.log('Shared successfully');
      }).catch((error) => {
        console.error('Error sharing:', error);
        copyToClipboard(shareText);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(shareText);
    }
  }
  
  /**
   * Copy text to clipboard and show feedback
   * @param {string} text - Text to copy
   */
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          showToast('Copied to clipboard!', 'success');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          showToast('Failed to copy to clipboard', 'error');
        });
    } else {
      // Fallback method
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          showToast('Copied to clipboard!', 'success');
        } else {
          showToast('Failed to copy to clipboard', 'error');
        }
      } catch (err) {
        console.error('Failed to copy: ', err);
        document.body.removeChild(textarea);
        showToast('Failed to copy to clipboard', 'error');
      }
    }
  }
  
  /**
   * Get human-readable time ago string
   * @param {Date} date - Date to format
   * @returns {string} Time ago string
   */
  function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval === 1 ? '1 year ago' : `${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval === 1 ? '1 month ago' : `${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? '1 day ago' : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
    }
    
    return 'Just now';
  }

  /**
   * Format a date to a readable string
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  function formatDate(date) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format tags from a Nostr note
   * @param {Array} tags - Array of tags
   * @returns {string} HTML string for tags
   */
  function formatTags(tags) {
    if (!tags || !tags.length) return '';
    
    const tagElements = tags
      .filter(tag => tag.length >= 2 && tag[0] === 't')
      .map(tag => `<span class="tag">#${escapeHTML(tag[1])}</span>`)
      .join('');
    
    return tagElements;
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) return;
    
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    
    errorContainer.style.display = 'block';
  }

  /**
   * Hide error message
   */
  function hideError() {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }
  }

  /**
   * Set loading state
   * @param {boolean} isLoading - Whether the page is loading
   */
  function showLoading(isLoading) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    }
  }

  /**
   * Update the current date display
   */
  function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
      const now = new Date();
      dateElement.textContent = now.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Whether user is authenticated
   */
  function checkUserAuthentication() {
    // Check for onboarding completion
    if (localStorage.getItem('sobrkey_onboarding_complete') !== 'true') {
      window.location.href = '/';
      return false;
    }
    
    // Check for public key
    if (!localStorage.getItem('sobrkey_pubkey')) {
      window.location.href = '/';
      return false;
    }
    
    return true;
  }

  /**
   * Add a tag to the post
   */
  function addTag() {
    const tagInput = prompt('Enter a tag for your post:');
    if (!tagInput || tagInput.trim() === '') return;
    
    // Clean the tag (lowercase, alphanumeric and underscores only)
    const cleanTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    if (!cleanTag) {
      showToast('Invalid tag. Please use only letters, numbers, and underscores.', 'warning');
      return;
    }
    
    // Check if tag already exists or is app tag (sobrkey)
    const appTag = window.SobrKeyConstants?.TAGS?.APP || 'sobrkey';
    if (cleanTag === appTag) {
      showToast(`The "${appTag}" tag is already included.`, 'info');
      return;
    }
    
    const existingTags = document.querySelectorAll('.tag:not(#add-tag)');
    for (const tag of existingTags) {
      if (tag.textContent === cleanTag) {
        showToast('This tag already exists.', 'info');
        return;
      }
    }
    
    // Create and add the new tag
    const tagContainer = document.querySelector('.post-tags');
    const addTagButton = document.getElementById('add-tag');
    
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.textContent = cleanTag;
    
    // Add click handler to remove the tag
    tagEl.addEventListener('click', function() {
      if (confirm('Remove this tag?')) {
        this.remove();
      }
    });
    
    // Add tag before the "Add Tag" button
    tagContainer.insertBefore(tagEl, addTagButton);
  }

  /**
   * Refresh posts
   */
  function refreshPosts() {
    loadPosts();
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} html - String that might contain HTML
   * @returns {string} Escaped HTML
   */
  function escapeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', initializeCommunityPage);

})();
