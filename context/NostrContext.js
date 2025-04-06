import React, { createContext, useState, useEffect } from 'react';
import { getPublicKey, getPrivateKey, hasKeys } from '../nostr/keyManager';
import { initializeRelayPool, disconnectFromRelays } from '../nostr/relayManager';

// Create the context
export const NostrContext = createContext();

/**
 * Provider component for Nostr functionality
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const NostrProvider = ({ children }) => {
  // State
  const [pubkey, setPubkey] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize on component mount
  useEffect(() => {
    const initializeNostr = async () => {
      try {
        setIsLoading(true);
        
        // Check if user has keys
        const keysExist = await hasKeys();
        
        if (keysExist) {
          // Get the public key
          const publicKey = await getPublicKey();
          setPubkey(publicKey);
          
          // Initialize relay connections
          await initializeRelayPool();
          
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Error initializing Nostr:', err);
        setError('Failed to initialize Nostr. Please restart the app.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeNostr();
    
    // Cleanup on unmount
    return () => {
      disconnectFromRelays();
    };
  }, []);
  
  /**
   * Reinitialize Nostr (e.g. after key generation)
   */
  const reinitialize = async () => {
    try {
      setIsLoading(true);
      
      // Get the public key
      const publicKey = await getPublicKey();
      setPubkey(publicKey);
      
      // Initialize relay connections
      await initializeRelayPool();
      
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('Error reinitializing Nostr:', err);
      setError('Failed to reinitialize Nostr. Please restart the app.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Sign out by disconnecting from relays and clearing state
   */
  const signOut = () => {
    disconnectFromRelays();
    setPubkey(null);
    setIsInitialized(false);
  };
  
  // Context value
  const contextValue = {
    pubkey,
    isInitialized,
    isLoading,
    error,
    reinitialize,
    signOut,
  };
  
  return (
    <NostrContext.Provider value={contextValue}>
      {children}
    </NostrContext.Provider>
  );
};
