"use client";

import { useState, useEffect } from 'react';
import { loadKey, wipeKey, hasCompletedBackup } from '@/lib/key-manager';
import { getPublicKey } from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';

export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  privateKey: string | null;
  publicKey: string | null;
  npub: string | null;
  hasBackup: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
    privateKey: null,
    publicKey: null,
    npub: null,
    hasBackup: false,
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        const keyPair = await loadKey();
        const backup = await hasCompletedBackup();

        if (keyPair) {
          setAuthState({
            isLoggedIn: true,
            isLoading: false,
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey,
            npub: keyPair.npub,
            hasBackup: backup,
          });
        } else {
          setAuthState({
            isLoggedIn: false,
            isLoading: false,
            privateKey: null,
            publicKey: null,
            npub: null,
            hasBackup: false,
          });
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
        setAuthState({
          isLoggedIn: false,
          isLoading: false,
          privateKey: null,
          publicKey: null,
          npub: null,
          hasBackup: false,
        });
      }
    }

    checkAuth();
  }, []);

  const logout = async () => {
    await wipeKey();
    setAuthState({
      isLoggedIn: false,
      isLoading: false,
      privateKey: null,
      publicKey: null,
      npub: null,
      hasBackup: false,
    });
  };

  const refreshAuth = async () => {
    const keyPair = await loadKey();
    const backup = await hasCompletedBackup();

    if (keyPair) {
      setAuthState({
        isLoggedIn: true,
        isLoading: false,
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
        npub: keyPair.npub,
        hasBackup: backup,
      });
    }
  };

  return {
    ...authState,
    logout,
    refreshAuth,
  };
}
