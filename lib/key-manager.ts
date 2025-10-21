/**
 * KeyManager - Privacy-first key management
 * Keys never leave the device. No server storage.
 */

import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

const STORAGE_KEY = 'sobrkey_nsec';
const BACKUP_COMPLETED_KEY = 'sobrkey_backup_completed';

export interface KeyPair {
  privateKey: string; // nsec format
  publicKey: string;  // hex format
  npub: string;       // npub format
}

/**
 * Generate a new keypair
 * @returns KeyPair with nsec private key and public key formats
 */
export async function generateKey(): Promise<KeyPair> {
  try {
    const privateKeyBytes = generateSecretKey();
    const publicKeyHex = getPublicKey(privateKeyBytes);
    const nsec = nip19.nsecEncode(privateKeyBytes);
    const npub = nip19.npubEncode(publicKeyHex);

    return {
      privateKey: nsec,
      publicKey: publicKeyHex,
      npub
    };
  } catch (error) {
    console.error('Failed to generate key:', error);
    throw new Error('We couldn\'t finish setting up. Try again.');
  }
}

/**
 * Import a key (accepts nsec or hex format)
 * @param input - Private key in nsec or hex format
 * @returns KeyPair
 */
export async function importKey(input: string): Promise<KeyPair> {
  try {
    let privateKeyBytes: Uint8Array;
    
    // Try nsec format first
    if (input.startsWith('nsec1')) {
      const decoded = nip19.decode(input);
      if (decoded.type !== 'nsec') {
        throw new Error('Invalid key format');
      }
      privateKeyBytes = decoded.data as Uint8Array;
    } 
    // Try hex format
    else if (/^[0-9a-fA-F]{64}$/.test(input)) {
      privateKeyBytes = hexToBytes(input);
    } 
    else {
      throw new Error('Invalid key format');
    }

    const publicKeyHex = getPublicKey(privateKeyBytes);
    const nsec = nip19.nsecEncode(privateKeyBytes);
    const npub = nip19.npubEncode(publicKeyHex);

    return {
      privateKey: nsec,
      publicKey: publicKeyHex,
      npub
    };
  } catch (error) {
    console.error('Failed to import key:', error);
    throw new Error('That key doesn\'t look right. Please check and try again.');
  }
}

/**
 * Save keypair to local storage
 * @param keyPair - KeyPair to save
 */
export async function saveKey(keyPair: KeyPair): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, keyPair.privateKey);
  } catch (error) {
    console.error('Failed to save key:', error);
    throw new Error('We need local storage to keep your key on this device.');
  }
}

/**
 * Load keypair from local storage
 * @returns KeyPair or null if not found
 */
export async function loadKey(): Promise<KeyPair | null> {
  try {
    if (typeof window === 'undefined') return null;
    
    const nsec = localStorage.getItem(STORAGE_KEY);
    if (!nsec) return null;

    return await importKey(nsec);
  } catch (error) {
    console.error('Failed to load key:', error);
    // Clear corrupted key
    await wipeKey();
    return null;
  }
}

/**
 * Check if a key exists in storage
 * @returns boolean
 */
export async function hasKey(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Export the private key for backup
 * @returns Private key in nsec format
 */
export async function exportKey(): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Export only available in browser');
    }
    
    const nsec = localStorage.getItem(STORAGE_KEY);
    if (!nsec) {
      throw new Error('No key found to export');
    }

    return nsec;
  } catch (error) {
    console.error('Failed to export key:', error);
    throw new Error('We couldn\'t export your key. Please try again.');
  }
}

/**
 * Delete the key from storage
 */
export async function wipeKey(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BACKUP_COMPLETED_KEY);
}

/**
 * Mark backup as completed
 */
export async function markBackupCompleted(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BACKUP_COMPLETED_KEY, 'true');
}

/**
 * Check if backup has been completed
 */
export async function hasCompletedBackup(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(BACKUP_COMPLETED_KEY) === 'true';
}

/**
 * Validate key format without importing
 * @param input - Key to validate
 * @returns boolean
 */
export function validateKeyFormat(input: string): boolean {
  if (!input || input.trim() === '') return false;
  
  // Check nsec format
  if (input.startsWith('nsec1')) {
    try {
      const decoded = nip19.decode(input);
      return decoded.type === 'nsec';
    } catch {
      return false;
    }
  }
  
  // Check hex format (64 characters, hex only)
  return /^[0-9a-fA-F]{64}$/.test(input);
}
