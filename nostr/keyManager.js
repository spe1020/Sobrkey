import * as SecureStore from 'expo-secure-store';
import { generatePrivateKey, getPublicKey as nostrGetPublicKey } from 'nostr-tools';

// Constants for secure storage keys
const PRIVATE_KEY_STORAGE_KEY = 'sobrkey_private_key';
const PUBLIC_KEY_STORAGE_KEY = 'sobrkey_public_key';

/**
 * Generate a new Nostr keypair and store it securely
 * @returns {Promise<{privateKey: string, publicKey: string}>}
 */
export async function generateKeyPair() {
  try {
    // Generate a new private key
    const privateKey = generatePrivateKey();
    
    // Derive the public key from the private key
    const publicKey = nostrGetPublicKey(privateKey);
    
    // Store both keys securely
    await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE_KEY, privateKey);
    await SecureStore.setItemAsync(PUBLIC_KEY_STORAGE_KEY, publicKey);
    
    return { privateKey, publicKey };
  } catch (error) {
    console.error('Error generating keypair:', error);
    throw new Error('Failed to generate and store keypair');
  }
}

/**
 * Import existing Nostr keys
 * @param {string} privateKey - The private key to import
 * @returns {Promise<{privateKey: string, publicKey: string}>}
 */
export async function importKeys(privateKey) {
  try {
    // Validate private key - simple hex check for now
    if (!privateKey || privateKey.length !== 64 && !privateKey.startsWith('nsec')) {
      throw new Error('Invalid private key format');
    }
    
    // Convert nsec to hex if needed
    let hexPrivateKey = privateKey;
    if (privateKey.startsWith('nsec')) {
      // This is simplified - in a real app, use proper bech32 decoding
      // For demo purposes only
      hexPrivateKey = privateKey.slice(4);
    }
    
    // Derive the public key
    const publicKey = nostrGetPublicKey(hexPrivateKey);
    
    // Store both keys
    await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE_KEY, hexPrivateKey);
    await SecureStore.setItemAsync(PUBLIC_KEY_STORAGE_KEY, publicKey);
    
    return { privateKey: hexPrivateKey, publicKey };
  } catch (error) {
    console.error('Error importing keys:', error);
    throw new Error('Failed to import keys');
  }
}

/**
 * Check if the user has Nostr keys stored
 * @returns {Promise<boolean>}
 */
export async function hasKeys() {
  try {
    const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE_KEY);
    return !!privateKey;
  } catch (error) {
    console.error('Error checking for keys:', error);
    return false;
  }
}

/**
 * Get the user's private key
 * @returns {Promise<string>} The private key or null if not found
 */
export async function getPrivateKey() {
  try {
    return await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting private key:', error);
    throw new Error('Failed to retrieve private key');
  }
}

/**
 * Get the user's public key
 * @returns {Promise<string>} The public key or null if not found
 */
export async function getPublicKey() {
  try {
    return await SecureStore.getItemAsync(PUBLIC_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting public key:', error);
    throw new Error('Failed to retrieve public key');
  }
}

/**
 * Export the user's keys
 * @returns {Promise<{privateKey: string, publicKey: string}>}
 */
export async function exportKeys() {
  try {
    const privateKey = await getPrivateKey();
    const publicKey = await getPublicKey();
    
    if (!privateKey || !publicKey) {
      throw new Error('Keys not found');
    }
    
    return { privateKey, publicKey };
  } catch (error) {
    console.error('Error exporting keys:', error);
    throw new Error('Failed to export keys');
  }
}
