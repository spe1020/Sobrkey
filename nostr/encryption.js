import { nip04 } from 'nostr-tools';
import { getPrivateKey, getPublicKey } from './keyManager';

/**
 * Encrypt a message to self
 * @param {string} message - Message to encrypt
 * @returns {Promise<string>} Encrypted message
 */
export async function encryptToSelf(message) {
  try {
    const privateKey = await getPrivateKey();
    const publicKey = await getPublicKey();
    
    if (!privateKey || !publicKey) {
      throw new Error('No keys available for encryption');
    }
    
    return await nip04.encrypt(privateKey, publicKey, message);
  } catch (error) {
    console.error('Error encrypting message to self:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a message from self
 * @param {string} encryptedMessage - Encrypted message
 * @returns {Promise<string>} Decrypted message
 */
export async function decryptFromSelf(encryptedMessage) {
  try {
    const privateKey = await getPrivateKey();
    const publicKey = await getPublicKey();
    
    if (!privateKey || !publicKey) {
      throw new Error('No keys available for decryption');
    }
    
    return await nip04.decrypt(privateKey, publicKey, encryptedMessage);
  } catch (error) {
    console.error('Error decrypting message from self:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Encrypt a message to another user
 * @param {string} recipientPubkey - Public key of the recipient
 * @param {string} message - Message to encrypt
 * @returns {Promise<string>} Encrypted message
 */
export async function encryptToUser(recipientPubkey, message) {
  try {
    const privateKey = await getPrivateKey();
    
    if (!privateKey) {
      throw new Error('No private key available for encryption');
    }
    
    return await nip04.encrypt(privateKey, recipientPubkey, message);
  } catch (error) {
    console.error('Error encrypting message to user:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt a message from another user
 * @param {string} senderPubkey - Public key of the sender
 * @param {string} encryptedMessage - Encrypted message
 * @returns {Promise<string>} Decrypted message
 */
export async function decryptFromUser(senderPubkey, encryptedMessage) {
  try {
    const privateKey = await getPrivateKey();
    
    if (!privateKey) {
      throw new Error('No private key available for decryption');
    }
    
    return await nip04.decrypt(privateKey, senderPubkey, encryptedMessage);
  } catch (error) {
    console.error('Error decrypting message from user:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Encrypt a message for a shared group
 * This is a simplified implementation - in a real app,
 * you'd use a proper group encryption scheme
 * 
 * @param {string} groupId - ID of the group
 * @param {string} message - Message to encrypt
 * @returns {Promise<string>} Encrypted message (plaintext for now)
 */
export async function encryptForGroup(groupId, message) {
  // In a real application, you'd implement more sophisticated
  // group encryption, for example with a shared symmetric key
  // For the MVP, we'll use unencrypted messages for groups
  return message;
}

/**
 * Decrypt a message from a group
 * This is a simplified implementation - in a real app,
 * you'd use a proper group decryption scheme
 * 
 * @param {string} groupId - ID of the group
 * @param {string} encryptedMessage - Encrypted message
 * @returns {Promise<string>} Decrypted message (same as input for now)
 */
export async function decryptFromGroup(groupId, encryptedMessage) {
  // In a real application, you'd implement more sophisticated
  // group decryption, for example with a shared symmetric key
  // For the MVP, we'll use unencrypted messages for groups
  return encryptedMessage;
}
