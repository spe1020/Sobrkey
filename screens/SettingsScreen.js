import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { NostrContext } from '../context/NostrContext';
import { getPublicKey, exportKeys, hasKeys } from '../nostr/keyManager';
import { getAllRelays, addRelay, removeRelay } from '../nostr/relayManager';
import * as Clipboard from 'expo-clipboard';

export default function SettingsScreen({ navigation }) {
  const { pubkey } = useContext(NostrContext);
  const [isLoading, setIsLoading] = useState(true);
  const [relays, setRelays] = useState([]);
  const [keysExist, setKeysExist] = useState(false);
  const [keyDetails, setKeyDetails] = useState({ pubkey: '' });
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Check if keys exist
      const hasExistingKeys = await hasKeys();
      setKeysExist(hasExistingKeys);
      
      if (hasExistingKeys) {
        // Get public key
        const publicKey = await getPublicKey();
        setKeyDetails({ pubkey: publicKey });
      }
      
      // Get relays
      const activeRelays = await getAllRelays();
      setRelays(activeRelays);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPubkey = async () => {
    try {
      await Clipboard.setStringAsync(keyDetails.pubkey);
      Alert.alert('Copied', 'Public key copied to clipboard.');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  };

  const handleShowPrivateKey = async () => {
    Alert.alert(
      'Security Warning',
      'Your private key gives full control of your account. Never share it with anyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Show Key', 
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await exportKeys();
              setPrivateKey(keys.privateKey);
              setShowPrivateKey(true);
            } catch (error) {
              console.error('Error exporting keys:', error);
              Alert.alert('Error', 'Failed to export private key.');
            }
          }
        }
      ]
    );
  };

  const handleCopyPrivateKey = async () => {
    try {
      await Clipboard.setStringAsync(privateKey);
      Alert.alert('Copied', 'Private key copied to clipboard. Keep it secure!');
    } catch (error) {
      console.error('Error copying private key to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  };

  const handleAddRelay = () => {
    Alert.prompt(
      'Add Relay',
      'Enter relay websocket URL (wss://...)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async (relayUrl) => {
            if (!relayUrl || !relayUrl.startsWith('wss://')) {
              Alert.alert('Invalid URL', 'Relay URL must start with wss://');
              return;
            }
            
            try {
              await addRelay(relayUrl);
              // Reload relays
              const activeRelays = await getAllRelays();
              setRelays(activeRelays);
            } catch (error) {
              console.error('Error adding relay:', error);
              Alert.alert('Error', 'Failed to add relay.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleRemoveRelay = async (relayUrl) => {
    try {
      await removeRelay(relayUrl);
      // Reload relays
      const activeRelays = await getAllRelays();
      setRelays(activeRelays);
    } catch (error) {
      console.error('Error removing relay:', error);
      Alert.alert('Error', 'Failed to remove relay.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? Make sure you\'ve backed up your private key, or you\'ll lose access to this identity.',
      [
        { text: 'Cancel', style: 'cancel' },
        // In a real app, you'd implement a secure logout flow
        { text: 'Log Out', style: 'destructive' }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Settings" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Settings" showBackButton onBackPress={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nostr Identity</Text>
          
          {keysExist ? (
            <>
              <View style={styles.keyContainer}>
                <Text style={styles.keyLabel}>Your Public Key:</Text>
                <Text style={styles.pubkeyText} numberOfLines={1} ellipsizeMode="middle">
                  {keyDetails.pubkey}
                </Text>
                <TouchableOpacity onPress={handleCopyPubkey} style={styles.copyButton}>
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.privateKeySection}>
                {showPrivateKey ? (
                  <View style={styles.privateKeyContainer}>
                    <Text style={styles.warningText}>KEEP THIS PRIVATE & SECURE!</Text>
                    <Text style={styles.privateKeyText} selectable>
                      {privateKey}
                    </Text>
                    <Button 
                      title="Copy Private Key" 
                      onPress={handleCopyPrivateKey}
                      style={styles.copyPrivateKeyButton}
                    />
                    <Button 
                      title="Hide Private Key" 
                      onPress={() => setShowPrivateKey(false)}
                      style={styles.hideKeyButton}
                    />
                  </View>
                ) : (
                  <Button 
                    title="Export Private Key" 
                    onPress={handleShowPrivateKey} 
                    style={styles.exportKeyButton}
                  />
                )}
              </View>
            </>
          ) : (
            <Text style={styles.noKeysText}>
              No Nostr keys found. Please restart the app to set up your identity.
            </Text>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relays</Text>
          <Text style={styles.sectionDescription}>
            Relays are servers that host and transmit Nostr events.
          </Text>
          
          <View style={styles.relaysList}>
            {relays.map((relay, index) => (
              <View key={relay} style={styles.relayItem}>
                <Text style={styles.relayUrl} numberOfLines={1}>{relay}</Text>
                <TouchableOpacity 
                  onPress={() => handleRemoveRelay(relay)}
                  style={styles.removeRelayButton}
                >
                  <Text style={styles.removeRelayButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <Button
              title="Add Relay"
              onPress={handleAddRelay}
              style={styles.addRelayButton}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Sobrkey is a privacy-focused recovery support app built on the Nostr protocol.
            All your data is encrypted and only accessible to you and those you choose to share it with.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
        
        <Button
          title="Log Out"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  keyContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  keyLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  pubkeyText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  copyButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#4a90e2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  privateKeySection: {
    marginTop: 8,
  },
  privateKeyContainer: {
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd54f',
  },
  warningText: {
    color: '#e65100',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  privateKeyText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  copyPrivateKeyButton: {
    marginBottom: 8,
    backgroundColor: '#ff9800',
  },
  hideKeyButton: {
    backgroundColor: '#9e9e9e',
  },
  exportKeyButton: {
    backgroundColor: '#ff9800',
  },
  noKeysText: {
    color: '#e74c3c',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: 20,
  },
  relaysList: {
    marginTop: 8,
  },
  relayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  relayUrl: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  removeRelayButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  removeRelayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  addRelayButton: {
    marginTop: 8,
    backgroundColor: '#4a90e2',
  },
  aboutText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
});
