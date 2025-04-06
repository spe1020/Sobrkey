import { getEventHash, signEvent, nip04 } from 'nostr-tools';
import { getPrivateKey, getPublicKey } from './keyManager';
import { publishEvent, subscribeToEvents, getEvents } from './relayManager';

/**
 * Create and sign a basic Nostr event
 * @param {number} kind - Event kind
 * @param {string} content - Content of the event
 * @param {Array} tags - Tags for the event
 * @returns {Promise<Object>} The signed event
 */
async function createSignedEvent(kind, content, tags = []) {
  try {
    const privateKey = await getPrivateKey();
    const publicKey = await getPublicKey();
    
    if (!privateKey || !publicKey) {
      throw new Error('No keys available');
    }
    
    const event = {
      kind,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content,
    };
    
    event.id = getEventHash(event);
    event.sig = signEvent(event, privateKey);
    
    return event;
  } catch (error) {
    console.error('Error creating signed event:', error);
    throw new Error('Failed to create and sign event');
  }
}

/**
 * Save a journal entry (encrypted note to self)
 * @param {string} content - Journal entry content
 * @returns {Promise<Object>} The published event
 */
export async function saveJournalEntry(content) {
  try {
    const publicKey = await getPublicKey();
    const privateKey = await getPrivateKey();
    
    // Encrypt the content with our own pubkey (note to self)
    const encryptedContent = await nip04.encrypt(privateKey, publicKey, content);
    
    // Use a replaceable event with a specific "d" tag for the date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const event = await createSignedEvent(
      30, // Encrypted/general note
      encryptedContent,
      [['d', dateString], ['journal', 'entry']]
    );
    
    await publishEvent(event);
    return event;
  } catch (error) {
    console.error('Error saving journal entry:', error);
    throw new Error('Failed to save journal entry');
  }
}

/**
 * Get journal entries
 * @returns {Promise<Array>} Array of decrypted journal entries
 */
export async function getJournalEntries() {
  try {
    const publicKey = await getPublicKey();
    const privateKey = await getPrivateKey();
    
    // Query for all journal entries by this user
    const filter = {
      kinds: [30],
      authors: [publicKey],
      '#journal': ['entry']
    };
    
    const events = await getEvents(filter);
    
    // Decrypt each entry
    const decryptedEvents = await Promise.all(
      events.map(async (event) => {
        try {
          const decryptedContent = await nip04.decrypt(privateKey, publicKey, event.content);
          return {
            ...event,
            content: decryptedContent
          };
        } catch (error) {
          console.error('Error decrypting journal entry:', error);
          return {
            ...event,
            content: '[Failed to decrypt entry]'
          };
        }
      })
    );
    
    return decryptedEvents;
  } catch (error) {
    console.error('Error getting journal entries:', error);
    throw new Error('Failed to retrieve journal entries');
  }
}

/**
 * Get a journal entry for a specific date
 * @param {Date} date - The date to get the entry for
 * @returns {Promise<Object|null>} The journal entry or null if not found
 */
export async function getJournalEntryForDate(date) {
  try {
    const publicKey = await getPublicKey();
    const privateKey = await getPrivateKey();
    
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const filter = {
      kinds: [30],
      authors: [publicKey],
      '#d': [dateString],
      '#journal': ['entry']
    };
    
    const events = await getEvents(filter);
    
    if (events.length === 0) {
      return null;
    }
    
    // Sort by created_at and take the latest
    const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
    
    // Decrypt the content
    const decryptedContent = await nip04.decrypt(privateKey, publicKey, latestEvent.content);
    
    return {
      ...latestEvent,
      content: decryptedContent
    };
  } catch (error) {
    console.error('Error getting journal entry for date:', error);
    throw new Error('Failed to retrieve journal entry');
  }
}

/**
 * Send a direct message to another user
 * @param {string} recipientPubkey - Public key of the recipient
 * @param {string} content - Message content
 * @returns {Promise<Object>} The published event
 */
export async function sendDirectMessage(recipientPubkey, content) {
  try {
    const publicKey = await getPublicKey();
    const privateKey = await getPrivateKey();
    
    // Encrypt the content
    const encryptedContent = await nip04.encrypt(privateKey, recipientPubkey, content);
    
    const event = await createSignedEvent(
      4, // Direct message
      encryptedContent,
      [['p', recipientPubkey]]
    );
    
    await publishEvent(event);
    return event;
  } catch (error) {
    console.error('Error sending direct message:', error);
    throw new Error('Failed to send direct message');
  }
}

/**
 * Get direct messages with a specific user
 * @param {string} [otherPubkey] - Public key of the other user
 * @returns {Promise<Array>} Array of decrypted messages
 */
export async function getDirectMessages(otherPubkey = null) {
  try {
    const publicKey = await getPublicKey();
    const privateKey = await getPrivateKey();
    
    let filters = [];
    
    if (otherPubkey) {
      // Messages sent to the other user
      filters.push({
        kinds: [4],
        authors: [publicKey],
        '#p': [otherPubkey]
      });
      
      // Messages received from the other user
      filters.push({
        kinds: [4],
        authors: [otherPubkey],
        '#p': [publicKey]
      });
    } else {
      // All DMs sent by the user
      filters.push({
        kinds: [4],
        authors: [publicKey]
      });
      
      // All DMs received by the user
      filters.push({
        kinds: [4],
        '#p': [publicKey]
      });
    }
    
    const events = await getEvents(filters);
    
    // Decrypt each message
    const decryptedEvents = await Promise.all(
      events.map(async (event) => {
        try {
          const sender = event.pubkey;
          const recipient = event.tags.find(tag => tag[0] === 'p')?.[1];
          
          if (!sender || !recipient) {
            throw new Error('Invalid DM event');
          }
          
          // Determine which key to use for decryption
          const otherKey = sender === publicKey ? recipient : sender;
          
          const decryptedContent = await nip04.decrypt(privateKey, otherKey, event.content);
          
          return {
            ...event,
            content: decryptedContent
          };
        } catch (error) {
          console.error('Error decrypting message:', error);
          return {
            ...event,
            content: '[Failed to decrypt message]'
          };
        }
      })
    );
    
    return decryptedEvents;
  } catch (error) {
    console.error('Error getting direct messages:', error);
    throw new Error('Failed to retrieve direct messages');
  }
}

/**
 * Subscribe to direct messages with a specific user
 * @param {string} otherPubkey - Public key of the other user
 * @param {Function} callback - Callback for new messages
 * @returns {Function} Unsubscribe function
 */
export function subscribeToDirectMessages(otherPubkey, callback) {
  try {
    const filters = [
      {
        kinds: [4],
        authors: [otherPubkey],
        since: Math.floor(Date.now() / 1000)
      }
    ];
    
    return subscribeToEvents(filters, async (event) => {
      try {
        const privateKey = await getPrivateKey();
        const publicKey = await getPublicKey();
        
        // Only process if the message is intended for us
        const recipient = event.tags.find(tag => tag[0] === 'p')?.[1];
        if (recipient !== publicKey) {
          return;
        }
        
        const decryptedContent = await nip04.decrypt(privateKey, otherPubkey, event.content);
        
        callback({
          ...event,
          content: decryptedContent
        });
      } catch (error) {
        console.error('Error processing subscribed DM:', error);
      }
    });
  } catch (error) {
    console.error('Error subscribing to direct messages:', error);
    throw new Error('Failed to subscribe to direct messages');
  }
}

/**
 * Post a daily check-in event
 * @returns {Promise<Object>} The published event
 */
export async function dailyCheckIn() {
  try {
    const publicKey = await getPublicKey();
    const privateKey = await getPrivateKey();
    
    // Create a simple encrypted check-in event
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const content = `Checked in on ${dateString}`;
    const encryptedContent = await nip04.encrypt(privateKey, publicKey, content);
    
    const event = await createSignedEvent(
      30, // Encrypted note
      encryptedContent,
      [['d', dateString], ['check-in', 'daily']]
    );
    
    await publishEvent(event);
    return event;
  } catch (error) {
    console.error('Error posting daily check-in:', error);
    throw new Error('Failed to post daily check-in');
  }
}

/**
 * Get check-ins for the user
 * @param {string} [userPubkey] - Public key of the user
 * @returns {Promise<Array>} Array of check-in events
 */
export async function getCheckInsForUser(userPubkey = null) {
  try {
    const myPubkey = await getPublicKey();
    const privateKey = await getPrivateKey();
    
    const pubkey = userPubkey || myPubkey;
    
    const filter = {
      kinds: [30],
      authors: [pubkey],
      '#check-in': ['daily']
    };
    
    const events = await getEvents(filter);
    
    // If these are our own check-ins, decrypt them
    if (pubkey === myPubkey) {
      return await Promise.all(
        events.map(async (event) => {
          try {
            const decryptedContent = await nip04.decrypt(privateKey, myPubkey, event.content);
            return {
              ...event,
              content: decryptedContent
            };
          } catch (error) {
            console.error('Error decrypting check-in:', error);
            return event;
          }
        })
      );
    }
    
    return events;
  } catch (error) {
    console.error('Error getting check-ins:', error);
    throw new Error('Failed to retrieve check-ins');
  }
}

/**
 * Send a message to a meeting
 * @param {string} meetingId - ID of the meeting
 * @param {string} content - Message content
 * @returns {Promise<Object>} The published event
 */
export async function sendMeetingMessage(meetingId, content) {
  try {
    // For simplicity, we're using kind 42 (general purpose) with a d-tag for the meeting ID
    // In a real app, you'd use a proper shared encryption setup
    const event = await createSignedEvent(
      42, // General purpose
      content,
      [['d', meetingId], ['meeting', 'message']]
    );
    
    await publishEvent(event);
    return event;
  } catch (error) {
    console.error('Error sending meeting message:', error);
    throw new Error('Failed to send meeting message');
  }
}

/**
 * Get messages for a specific meeting
 * @param {string} meetingId - ID of the meeting
 * @returns {Promise<Array>} Array of meeting messages
 */
export async function getMeetingMessages(meetingId) {
  try {
    const filter = {
      kinds: [42],
      '#d': [meetingId],
      '#meeting': ['message']
    };
    
    return await getEvents(filter);
  } catch (error) {
    console.error('Error getting meeting messages:', error);
    throw new Error('Failed to retrieve meeting messages');
  }
}

/**
 * Subscribe to messages for a specific meeting
 * @param {string} meetingId - ID of the meeting
 * @param {Function} callback - Callback for new messages
 * @returns {Function} Unsubscribe function
 */
export function subscribeMeetingMessages(meetingId, callback) {
  try {
    const filter = {
      kinds: [42],
      '#d': [meetingId],
      '#meeting': ['message'],
      since: Math.floor(Date.now() / 1000)
    };
    
    return subscribeToEvents(filter, callback);
  } catch (error) {
    console.error('Error subscribing to meeting messages:', error);
    throw new Error('Failed to subscribe to meeting messages');
  }
}

/**
 * Send an emergency alert to trusted contacts
 * @param {string} message - Alert message
 * @param {Array<string>} trustedContacts - Array of trusted contact pubkeys
 * @returns {Promise<Array>} Array of published events
 */
export async function sendEmergencyAlert(message, trustedContacts) {
  try {
    const privateKey = await getPrivateKey();
    
    const events = await Promise.all(
      trustedContacts.map(async (contactPubkey) => {
        const encryptedContent = await nip04.encrypt(privateKey, contactPubkey, message);
        
        const event = await createSignedEvent(
          4, // Direct message
          encryptedContent,
          [
            ['p', contactPubkey],
            ['emergency', 'alert']
          ]
        );
        
        await publishEvent(event);
        return event;
      })
    );
    
    return events;
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    throw new Error('Failed to send emergency alert');
  }
}

/**
 * Get trusted contacts
 * @returns {Promise<Array<string>>} Array of trusted contact pubkeys
 */
export async function getTrustedContacts() {
  try {
    const publicKey = await getPublicKey();
    
    // In a real app, you'd store this in a kind 3 (contacts) event
    // For simplicity, we'll just return a mock list
    return [
      '884704bd421721e292edbff42eb77547fe115c6ff9825b08fc366be4cd69e9f6',
      '91c9a5e1a9744114c6fe2d61ae4de82629eaaa0fb52f48288093c7e7e036f832'
    ];
  } catch (error) {
    console.error('Error getting trusted contacts:', error);
    throw new Error('Failed to retrieve trusted contacts');
  }
}

/**
 * Add a trusted contact
 * @param {string} contactPubkey - Public key of the contact to add
 * @returns {Promise<boolean>} Success status
 */
export async function addTrustedContact(contactPubkey) {
  // In a real app, you'd update a kind 3 (contacts) event
  // For simplicity, we'll just return success
  return true;
}

/**
 * Remove a trusted contact
 * @param {string} contactPubkey - Public key of the contact to remove
 * @returns {Promise<boolean>} Success status
 */
export async function removeTrustedContact(contactPubkey) {
  // In a real app, you'd update a kind 3 (contacts) event
  // For simplicity, we'll just return success
  return true;
}
