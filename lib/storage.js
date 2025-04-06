import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for storage keys
const RELAYS_STORAGE_KEY = 'sobrkey_relays';
const TRUSTED_CONTACTS_KEY = 'sobrkey_trusted_contacts';
const STREAK_DATA_KEY = 'sobrkey_streak_data';
const SETTINGS_KEY = 'sobrkey_settings';

/**
 * Save relays to AsyncStorage
 * @param {Array<string>} relays - Array of relay URLs
 * @returns {Promise<void>}
 */
export async function saveRelays(relays) {
  try {
    await AsyncStorage.setItem(RELAYS_STORAGE_KEY, JSON.stringify(relays));
  } catch (error) {
    console.error('Error saving relays:', error);
    throw new Error('Failed to save relays');
  }
}

/**
 * Get relays from AsyncStorage
 * @returns {Promise<Array<string>|null>} Array of relay URLs or null if not found
 */
export async function getRelays() {
  try {
    const relaysJson = await AsyncStorage.getItem(RELAYS_STORAGE_KEY);
    return relaysJson ? JSON.parse(relaysJson) : null;
  } catch (error) {
    console.error('Error getting relays:', error);
    return null;
  }
}

/**
 * Save trusted contacts
 * @param {Array<string>} contacts - Array of trusted contact pubkeys
 * @returns {Promise<void>}
 */
export async function saveTrustedContacts(contacts) {
  try {
    await AsyncStorage.setItem(TRUSTED_CONTACTS_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error('Error saving trusted contacts:', error);
    throw new Error('Failed to save trusted contacts');
  }
}

/**
 * Get trusted contacts
 * @returns {Promise<Array<string>|null>} Array of trusted contact pubkeys or null if not found
 */
export async function getTrustedContacts() {
  try {
    const contactsJson = await AsyncStorage.getItem(TRUSTED_CONTACTS_KEY);
    return contactsJson ? JSON.parse(contactsJson) : null;
  } catch (error) {
    console.error('Error getting trusted contacts:', error);
    return null;
  }
}

/**
 * Save streak data
 * @param {Object} streakData - Streak data object
 * @returns {Promise<void>}
 */
export async function saveStreakData(streakData) {
  try {
    await AsyncStorage.setItem(STREAK_DATA_KEY, JSON.stringify(streakData));
  } catch (error) {
    console.error('Error saving streak data:', error);
    throw new Error('Failed to save streak data');
  }
}

/**
 * Get streak data
 * @returns {Promise<Object|null>} Streak data object or null if not found
 */
export async function getStreakData() {
  try {
    const streakDataJson = await AsyncStorage.getItem(STREAK_DATA_KEY);
    return streakDataJson ? JSON.parse(streakDataJson) : null;
  } catch (error) {
    console.error('Error getting streak data:', error);
    return null;
  }
}

/**
 * Save app settings
 * @param {Object} settings - Settings object
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Get app settings
 * @returns {Promise<Object|null>} Settings object or null if not found
 */
export async function getSettings() {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    return settingsJson ? JSON.parse(settingsJson) : null;
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
  }
}

/**
 * Save a value securely
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {Promise<void>}
 */
export async function saveSecure(key, value) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error saving secure value for ${key}:`, error);
    throw new Error('Failed to save secure value');
  }
}

/**
 * Get a value securely
 * @param {string} key - Storage key
 * @returns {Promise<string|null>} Stored value or null if not found
 */
export async function getSecure(key) {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error getting secure value for ${key}:`, error);
    return null;
  }
}

/**
 * Delete a value securely
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export async function deleteSecure(key) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error deleting secure value for ${key}:`, error);
    throw new Error('Failed to delete secure value');
  }
}

/**
 * Clear all app data
 * Warning: This will delete all user data
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  try {
    // Clear AsyncStorage data
    await AsyncStorage.multiRemove([
      RELAYS_STORAGE_KEY,
      TRUSTED_CONTACTS_KEY,
      STREAK_DATA_KEY,
      SETTINGS_KEY
    ]);
    
    // Note: This does not clear SecureStore keys
    // You'd need to individually delete those if needed
  } catch (error) {
    console.error('Error clearing app data:', error);
    throw new Error('Failed to clear app data');
  }
}
