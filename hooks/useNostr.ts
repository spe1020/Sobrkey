import { useState, useEffect } from 'react';
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';
import { bytesToHex } from '@noble/hashes/utils';

const STORAGE_KEY = 'sobrkey_nsec';

export const useNostr = () => {
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    const loadKeys = () => {
      const storedNsec = localStorage.getItem(STORAGE_KEY);
      if (storedNsec) {
        try {
          const { type, data } = nip19.decode(storedNsec);
          if (type === 'nsec') {
            const privateKeyHex = bytesToHex(data as Uint8Array);
            setPrivateKey(privateKeyHex);
            setPublicKey(getPublicKey(data as Uint8Array));
          }
        } catch (error) {
          console.error('Invalid key format:', error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    };

    loadKeys();
  }, []);

  const generateKeypair = () => {
    const newPrivateKey = generateSecretKey();
    const newPublicKey = getPublicKey(newPrivateKey);
    const nsec = nip19.nsecEncode(newPrivateKey);
    
    setGeneratedKey(nsec);
    return nsec;
  };

  const loginWithGeneratedKey = () => {
    if (!generatedKey) return;
    
    localStorage.setItem(STORAGE_KEY, generatedKey);
    const { type, data } = nip19.decode(generatedKey);
    if (type === 'nsec') {
      const privateKeyHex = bytesToHex(data as Uint8Array);
      setPrivateKey(privateKeyHex);
      setPublicKey(getPublicKey(data as Uint8Array));
    }
    setGeneratedKey(null);
  };

  const importKey = (nsec: string) => {
    try {
      const { type, data } = nip19.decode(nsec);
      if (type !== 'nsec') {
        throw new Error('Invalid key format: not an nsec');
      }
      
      const importedPrivateKey = data as Uint8Array;
      const importedPublicKey = getPublicKey(importedPrivateKey);
      
      localStorage.setItem(STORAGE_KEY, nsec);
      setPrivateKey(bytesToHex(importedPrivateKey));
      setPublicKey(importedPublicKey);
    } catch (error) {
      console.error('Failed to import key:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPrivateKey(null);
    setPublicKey(null);
  };

  return {
    privateKey,
    publicKey: publicKey ? nip19.npubEncode(publicKey) : null,
    generatedKey,
    generateKeypair,
    loginWithGeneratedKey,
    importKey,
    logout,
    isLoggedIn: !!privateKey
  };
}; 