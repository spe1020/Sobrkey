/**
 * Constants for the Sobrkey application
 * This file makes constants available to the browser environment
 */

// App Information
window.SobrKeyConstants = {
  APP_NAME: 'Sobrkey',
  APP_VERSION: '1.0.0',

  // Default Relays - optimized based on debug results
  // Only using relays that successfully return notes with #sobrkey tag
  DEFAULT_RELAYS: [
    'wss://relay.damus.io',  // Works well with #t format
    'wss://nos.lol'          // Works well with #t format
  ],

  // Relay categories for different use cases
  // Optimized to use only relays that work well with #sobrkey tag
  RELAY_CATEGORIES: {
    GENERAL: [
      'wss://relay.damus.io',
      'wss://nos.lol'
    ],
    COMMUNITIES: [
      'wss://relay.damus.io',
      'wss://nos.lol' 
    ],
    RECOVERY_FOCUSED: [
      'wss://relay.damus.io',
      'wss://nos.lol'
    ]
  },

  // Event Kinds
  EVENT_KINDS: {
    METADATA: 0,
    TEXT_NOTE: 1,
    RECOMMEND_RELAY: 2,
    CONTACTS: 3,
    ENCRYPTED_DIRECT_MESSAGE: 4,
    DELETE: 5,
    REACTION: 7,
    ENCRYPTED_NOTE: 30,
    MEETING_MESSAGE: 42
  },

  // Tags
  TAGS: {
    JOURNAL: 'journal',
    CHECK_IN: 'check-in',
    MEETING: 'meeting',
    EMERGENCY: 'emergency',
    APP: 'sobrkey'
  },

  // Storage Keys
  STORAGE_KEYS: {
    PRIVATE_KEY: 'sobrkey_private_key',
    PUBLIC_KEY: 'sobrkey_public_key',
    PRIVATE_KEY_RAW: 'sobrkey_privatekey_raw',
    PUBLIC_KEY_RAW: 'sobrkey_pubkey_raw',
    RELAYS: 'sobrkey_relays',
    TRUSTED_CONTACTS: 'sobrkey_trusted_contacts',
    STREAK_DATA: 'sobrkey_streak_data',
    SETTINGS: 'sobrkey_settings',
    ONBOARDING_COMPLETE: 'sobrkey_onboarding_complete',
    JOURNAL_ENTRIES: 'sobrkey_journal_entries'
  },

  // Timeouts
  TIMEOUTS: {
    RELAY_CONNECT: 5000,
    EVENT_PUBLISH: 8000,
    EVENT_SUBSCRIPTION: 3000
  }
};