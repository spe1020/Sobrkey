/**
 * Constants for the Sobrkey application
 * This file makes constants available to the browser environment
 */

// App Information
window.SobrKeyConstants = {
  APP_NAME: 'Sobrkey',
  APP_VERSION: '1.0.0',

  // Default Relays
  DEFAULT_RELAYS: [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band',
    'wss://relay.snort.social',
    'wss://nostr.wine',
    'wss://purplepag.es',
    'wss://relay.current.fyi',
    'wss://brb.io',
    'wss://relay.nostr.bg',
    'wss://nostr.fmt.wiz.biz',
    'wss://relay.nostr.info'
  ],

  // Relay categories for different use cases
  RELAY_CATEGORIES: {
    GENERAL: [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.nostr.band',
      'wss://relay.snort.social',
      'wss://nostr.wine'
    ],
    COMMUNITIES: [
      'wss://purplepag.es',
      'wss://relay.current.fyi',
      'wss://relay.nostr.info',
      'wss://relay.nostr.bg'
    ],
    RECOVERY_FOCUSED: [
      'wss://nostr.wine',
      'wss://nos.lol',
      'wss://relay.damus.io'
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