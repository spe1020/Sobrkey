import { finalizeEvent, EventTemplate } from 'nostr-tools/pure';
import { SimplePool, Filter, Event } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import { getEventHash, getPublicKey } from 'nostr-tools/pure';
import * as secp256k1 from '@noble/secp256k1';
import * as nip19 from 'nostr-tools/nip19';
import { useState, useEffect } from 'react';

type UnsignedEvent = {
  kind: number
  created_at: number
  tags: string[][]
  content: string
  pubkey: string
}

const RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol'
];

const pool = new SimplePool();

function getPrivateKeyBytes(privateKey: string): Uint8Array {
  try {
    const { type, data } = nip19.decode(privateKey)
    if (type !== 'nsec') {
      throw new Error('Invalid key format: not an nsec')
    }
    return data as Uint8Array
  } catch (error) {
    console.error('Failed to decode private key:', error)
    throw error
  }
}

export async function publishNote(content: string, privateKey: string): Promise<Event> {
  try {
    const privateKeyBytes = getPrivateKeyBytes(privateKey)
    const publicKey = getPublicKey(privateKeyBytes)
    
    const event: UnsignedEvent = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content,
      pubkey: publicKey,
    }

    const signedEvent = finalizeEvent(event, privateKeyBytes)
    
    const relays = ['wss://relay.damus.io', 'wss://relay.snort.social']
    const pool = new SimplePool()
    
    await Promise.all(relays.map(relay => pool.publish([relay], signedEvent)))
    await pool.close(relays)
    
    return signedEvent
  } catch (error) {
    console.error('Failed to publish note:', error)
    throw error
  }
}

export async function publishReaction(privateKey: string, eventId: string, content: string = "+") {
  const event = {
    kind: 7,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['e', eventId], ['t', 'sobrkey']],
    content
  };

  const signedEvent = finalizeEvent(event, getPrivateKeyBytes(privateKey));
  const hash = getEventHash(signedEvent);
  
  const pubs = pool.publish(RELAYS, signedEvent);
  await Promise.any(pubs);
}

export async function publishComment(privateKey: string, eventId: string, content: string, parentCommentId?: string) {
  const tags = [['e', eventId], ['t', 'sobrkey']];
  if (parentCommentId) {
    tags.push(['e', parentCommentId, 'reply']);
  }

  const event: EventTemplate = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content
  };

  const signedEvent = finalizeEvent(event, getPrivateKeyBytes(privateKey));
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

  const signedEvent = finalizeEvent(event, getPrivateKeyBytes(privateKey));
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

// Clean up pool when app unmounts
export function cleanup() {
  pool.close(RELAYS);
}

export function useNostr() {
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const [publicKey, setPublicKey] = useState<`npub1${string}` | null>(null)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>("")

  useEffect(() => {
    const storedPrivateKey = localStorage.getItem("sobrkey_nsec")
    const storedDisplayName = localStorage.getItem("display_name")
    if (storedPrivateKey) {
      try {
        const { type, data } = nip19.decode(storedPrivateKey)
        if (type === 'nsec') {
          setPrivateKey(storedPrivateKey)
          const pubKeyHex = getPublicKey(data as Uint8Array)
          const npub = nip19.npubEncode(pubKeyHex)
          setPublicKey(npub as `npub1${string}`)
        }
      } catch (error) {
        console.error('Invalid key format:', error)
        localStorage.removeItem("sobrkey_nsec")
      }
    }
    if (storedDisplayName) {
      setDisplayName(storedDisplayName)
    }
  }, [])

  const generateKeypair = () => {
    const privateKeyBytes = secp256k1.utils.randomPrivateKey()
    const nsec = nip19.nsecEncode(privateKeyBytes)
    setGeneratedKey(nsec)
    return nsec
  }

  const loginWithGeneratedKey = () => {
    if (generatedKey) {
      setPrivateKey(generatedKey)
      const { type, data } = nip19.decode(generatedKey)
      if (type === 'nsec') {
        const pubKeyHex = getPublicKey(data as Uint8Array)
        const npub = nip19.npubEncode(pubKeyHex)
        setPublicKey(npub as `npub1${string}`)
        localStorage.setItem("sobrkey_nsec", generatedKey)
      }
      setGeneratedKey(null)
    }
  }

  const importKey = (key: string) => {
    try {
      const { type, data } = nip19.decode(key)
      if (type !== 'nsec') {
        throw new Error('Invalid key format: not an nsec')
      }
      setPrivateKey(key)
      const pubKeyHex = getPublicKey(data as Uint8Array)
      const npub = nip19.npubEncode(pubKeyHex)
      setPublicKey(npub as `npub1${string}`)
      localStorage.setItem("sobrkey_nsec", key)
    } catch (error) {
      console.error('Failed to import key:', error)
      throw error
    }
  }

  const logout = () => {
    setPrivateKey(null)
    setPublicKey(null)
    localStorage.removeItem("sobrkey_nsec")
  }

  return {
    privateKey,
    publicKey,
    generatedKey,
    generateKeypair,
    loginWithGeneratedKey,
    importKey,
    logout,
    isLoggedIn: !!privateKey,
    displayName,
    setDisplayName: (name: string) => {
      setDisplayName(name)
      localStorage.setItem("display_name", name)
    }
  }
} 
