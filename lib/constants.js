// App Information
export const APP_NAME = 'Sobrkey';
export const APP_VERSION = '1.0.0';

// Default Relays - optimized based on debug results
// Only using relays that successfully return notes with #sobrkey tag
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',  // Works well with #t format
  'wss://nos.lol'          // Works well with #t format
  
  // The following relays have been removed as they don't return #sobrkey notes:
  // 'wss://relay.nostr.band' - Returned notes but not with sobrkey tag
  // 'wss://relay.snort.social' - Didn't return any sobrkey notes
  // 'wss://nostr.wine' - Didn't return any sobrkey notes
  // Other relays had connectivity issues or didn't return tagged notes
];

// Relay categories for different use cases
// Optimized to use only relays that work well with #sobrkey tag
export const RELAY_CATEGORIES = {
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
};

// Event Kinds
export const EVENT_KINDS = {
  METADATA: 0,
  TEXT_NOTE: 1,
  RECOMMEND_RELAY: 2,
  CONTACTS: 3,
  ENCRYPTED_DIRECT_MESSAGE: 4,
  DELETE: 5,
  REACTION: 7,
  ENCRYPTED_NOTE: 30,
  MEETING_MESSAGE: 42
};

// Meeting IDs
export const MEETING_IDS = {
  GENERAL: 'aa-general-meeting',
  NEWCOMERS: 'aa-newcomers',
  DAILY_REFLECTIONS: 'aa-daily-reflections',
  TWELVE_STEPS: 'aa-12-steps'
};

// Meeting Names
export const MEETING_NAMES = {
  [MEETING_IDS.GENERAL]: 'General Recovery Meeting',
  [MEETING_IDS.NEWCOMERS]: 'Newcomers Meeting',
  [MEETING_IDS.DAILY_REFLECTIONS]: 'Daily Reflections',
  [MEETING_IDS.TWELVE_STEPS]: '12 Steps Discussion'
};

// Tags
export const TAGS = {
  JOURNAL: 'journal',
  CHECK_IN: 'check-in',
  MEETING: 'meeting',
  EMERGENCY: 'emergency'
};

// Storage Keys
export const STORAGE_KEYS = {
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
};

// Timeouts
export const TIMEOUTS = {
  RELAY_CONNECT: 5000,
  EVENT_PUBLISH: 8000,
  EVENT_SUBSCRIPTION: 3000
};

// Error Messages
export const ERROR_MESSAGES = {
  NO_KEYS: 'No keys available. Please restart the app to set up your identity.',
  RELAY_CONNECTION: 'Failed to connect to relays. Please check your internet connection.',
  EVENT_PUBLISH: 'Failed to publish event. Please try again.',
  EVENT_SUBSCRIPTION: 'Failed to subscribe to events. Please try again.',
  ENCRYPTION: 'Failed to encrypt message. Please try again.',
  DECRYPTION: 'Failed to decrypt message. Please try again.',
  STORAGE: 'Failed to access storage. Please restart the app.',
  UNKNOWN: 'An unknown error occurred. Please try again.'
};

// Help Resources
export const HELP_RESOURCES = [
  {
    name: 'National Helpline',
    contact: '1-800-662-HELP (4357)',
    description: '24/7 treatment referral and information service'
  },
  {
    name: 'Crisis Text Line',
    contact: 'Text HOME to 741741',
    description: 'Free 24/7 support from trained crisis counselors'
  },
  {
    name: 'National Suicide Prevention Lifeline',
    contact: '988 or 1-800-273-8255',
    description: '24/7 support for people in distress'
  },
  {
    name: 'Alcoholics Anonymous',
    contact: 'https://www.aa.org',
    description: 'Find local AA meetings and resources'
  }
];

// Quotes for daily inspiration
export const DAILY_QUOTES = [
  {
    text: "One day at a time. This is enough. Do not look back and grieve over the past, for it is gone; and do not be troubled about the future, for it has not yet come. Live in the present, and make it so beautiful that it will be worth remembering.",
    author: "Anonymous"
  },
  {
    text: "The most important thing is to find out what is the most important thing.",
    author: "Zen Proverb"
  },
  {
    text: "If you are facing in the right direction, all you need to do is keep on walking.",
    author: "Buddhist Proverb"
  },
  {
    text: "Recovery is not a race. You don't have to feel guilty if it takes you longer than you thought it would.",
    author: "Anonymous"
  },
  {
    text: "Sometimes you can only find Heaven by slowly backing away from Hell.",
    author: "Carrie Fisher"
  }
];
