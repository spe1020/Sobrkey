import { finalizeEvent } from 'nostr-tools/pure';
import { SimplePool, Filter, Event } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import { getEventHash } from 'nostr-tools/pure';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol'
];

const pool = new SimplePool();

export async function publishNote(content: string | object, privateKey: string) {
  const event = typeof content === 'string' ? {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['t', 'sobrkey']],
    content
  } : {
    ...content,
    created_at: Math.floor(Date.now() / 1000)
  };

  const signedEvent = finalizeEvent(event, hexToBytes(privateKey));
  const hash = getEventHash(signedEvent);
  console.log('Publishing event with hash:', hash);
  
  const pubs = pool.publish(RELAYS, signedEvent);
  await Promise.any(pubs);
}

export async function publishReaction(privateKey: string, eventId: string, content: string = "+") {
  const event = {
    kind: 7,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['e', eventId], ['t', 'sobrkey']],
    content
  };

  const signedEvent = finalizeEvent(event, hexToBytes(privateKey));
  const hash = getEventHash(signedEvent);
  
  const pubs = pool.publish(RELAYS, signedEvent);
  await Promise.any(pubs);
}

export async function publishComment(privateKey: string, eventId: string, content: string) {
  const event = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['e', eventId], ['t', 'sobrkey']],
    content
  };

  const signedEvent = finalizeEvent(event, hexToBytes(privateKey));
  const hash = getEventHash(signedEvent);
  
  const pubs = pool.publish(RELAYS, signedEvent);
  await Promise.any(pubs);
}

export async function publishZapRequest(privateKey: string, eventId: string, amount: number, comment?: string) {
  const event = {
    kind: 9734, // NIP-57 Zap Request
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['e', eventId],
      ['p', eventId], // This should be the pubkey of the note's author
      ['amount', amount.toString()],
      ['relays', ...RELAYS],
      ['t', 'sobrkey']
    ],
    content: comment || ''
  };

  const signedEvent = finalizeEvent(event, hexToBytes(privateKey));
  const hash = getEventHash(signedEvent);
  
  const pubs = pool.publish(RELAYS, signedEvent);
  await Promise.any(pubs);
}

export function subscribeToTag(tag: string, callback: (event: Event) => void) {
  const filter: Filter = {
    kinds: [1, 7], // Include both notes and reactions
    '#t': [tag]
  };

  const sub = pool.subscribe(RELAYS, filter, {
    onevent: callback
  });

  return () => {
    sub.close();
  };
}

export function subscribeToComments(eventId: string, callback: (event: Event) => void) {
  const filter: Filter = {
    kinds: [1],
    '#e': [eventId],
    '#t': ['sobrkey']
  };

  const sub = pool.subscribe(RELAYS, filter, {
    onevent: callback
  });

  return () => {
    sub.close();
  };
}

export function subscribeToZaps(eventId: string, callback: (event: Event) => void) {
  const filter: Filter = {
    kinds: [9735], // NIP-57 Zap Receipt
    '#e': [eventId],
    '#t': ['sobrkey']
  };

  const sub = pool.subscribe(RELAYS, filter, {
    onevent: callback
  });

  return () => {
    sub.close();
  };
}

export function subscribeToJournal(callback: (event: Event) => void) {
  const filter: Filter = {
    kinds: [30023],
    '#d': ['sobr-journal']
  };

  const sub = pool.subscribe(RELAYS, filter, {
    onevent: callback
  });

  return () => {
    sub.close();
  };
}

// Clean up pool when app unmounts
export function cleanup() {
  pool.close(RELAYS);
} 
