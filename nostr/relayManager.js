import { SimplePool } from 'nostr-tools';
import * as storage from '../lib/storage';
import { DEFAULT_RELAYS } from '../lib/constants';

let pool = null;
let relayList = [];

/**
 * Initialize the relay pool
 * @returns {Promise<void>}
 */
export async function initializeRelayPool() {
  try {
    if (!pool) {
      pool = new SimplePool();
    }
    
    // Get saved relays or use defaults
    const savedRelays = await storage.getRelays();
    relayList = savedRelays && savedRelays.length > 0 ? savedRelays : DEFAULT_RELAYS;
    
    // Connect to all relays
    await connectToRelays();
  } catch (error) {
    console.error('Error initializing relay pool:', error);
    throw new Error('Failed to initialize relay connection');
  }
}

/**
 * Connect to all relays in the relay list
 * @returns {Promise<void>}
 */
async function connectToRelays() {
  if (!pool) {
    await initializeRelayPool();
  }
  
  // SimplePool handles connections automatically
  console.log('Connected to relays:', relayList);
}

/**
 * Get the current list of relays
 * @returns {Promise<Array<string>>} List of relay URLs
 */
export async function getAllRelays() {
  if (relayList.length === 0) {
    const savedRelays = await storage.getRelays();
    relayList = savedRelays && savedRelays.length > 0 ? savedRelays : DEFAULT_RELAYS;
  }
  return relayList;
}

/**
 * Add a relay to the list
 * @param {string} relayUrl - URL of the relay to add
 * @returns {Promise<void>}
 */
export async function addRelay(relayUrl) {
  if (!relayUrl.startsWith('wss://')) {
    throw new Error('Relay URL must start with wss://');
  }
  
  // Check if relay is already in the list
  if (relayList.includes(relayUrl)) {
    return;
  }
  
  // Add relay to the list
  relayList.push(relayUrl);
  
  // Save updated list
  await storage.saveRelays(relayList);
  
  // Connect to the new relay
  if (pool) {
    // SimplePool will connect as needed
    console.log('Added relay:', relayUrl);
  }
}

/**
 * Remove a relay from the list
 * @param {string} relayUrl - URL of the relay to remove
 * @returns {Promise<void>}
 */
export async function removeRelay(relayUrl) {
  // Remove relay from the list
  relayList = relayList.filter(url => url !== relayUrl);
  
  // Save updated list
  await storage.saveRelays(relayList);
  
  // Disconnect from the relay
  if (pool) {
    // SimplePool will handle this automatically
    console.log('Removed relay:', relayUrl);
  }
}

/**
 * Publish an event to all relays
 * @param {Object} event - The event to publish
 * @returns {Promise<string[]>} Array of relay URLs that accepted the event
 */
export async function publishEvent(event) {
  if (!pool) {
    await initializeRelayPool();
  }
  
  try {
    // Publish to all relays in the pool
    const pubs = pool.publish(relayList, event);
    
    // Wait for at least one relay to accept the event
    const pubStatus = await Promise.race([
      Promise.all(pubs),
      new Promise((resolve) => setTimeout(() => resolve([]), 5000))
    ]);
    
    if (pubStatus.length === 0) {
      console.warn('Event not accepted by any relay in time');
    }
    
    return pubStatus;
  } catch (error) {
    console.error('Error publishing event:', error);
    throw new Error('Failed to publish event');
  }
}

/**
 * Get events from relays based on filters
 * @param {Object|Array} filters - Filter or array of filters
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<Array>} Array of events
 */
export async function getEvents(filters, timeout = 5000) {
  if (!pool) {
    await initializeRelayPool();
  }
  
  try {
    // Use list() to get events from all relays that match the filters
    const events = await pool.list(relayList, filters, { timeout });
    return events;
  } catch (error) {
    console.error('Error getting events:', error);
    throw new Error('Failed to get events from relays');
  }
}

/**
 * Subscribe to events from relays
 * @param {Object|Array} filters - Filter or array of filters
 * @param {Function} onEvent - Callback for new events
 * @param {number} [maxDelayMs=3000] - Maximum delay for relays to respond
 * @returns {Function} Unsubscribe function
 */
export function subscribeToEvents(filters, onEvent, maxDelayMs = 3000) {
  if (!pool) {
    initializeRelayPool().catch(error => {
      console.error('Error initializing relay pool for subscription:', error);
    });
    return () => {}; // Return empty unsubscribe function if we couldn't initialize
  }
  
  // Create subscription
  const sub = pool.sub(relayList, filters);
  
  // Set event handler
  sub.on('event', event => {
    onEvent(event);
  });
  
  // Return unsubscribe function
  return () => {
    sub.unsub();
  };
}

/**
 * Disconnect from all relays
 */
export function disconnectFromRelays() {
  if (pool) {
    // SimplePool handles this automatically
    pool = null;
  }
}
