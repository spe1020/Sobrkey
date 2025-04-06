import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import { NostrContext } from '../context/NostrContext';
import { sendEmergencyAlert, getTrustedContacts, addTrustedContact, removeTrustedContact } from '../nostr/eventHandler';
import { formatTimestamp } from '../lib/dateUtils';

export default function EmergencyScreen({ navigation }) {
  const { pubkey } = useContext(NostrContext);
  const [message, setMessage] = useState('');
  const [includeLocation, setIncludeLocation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [newContactKey, setNewContactKey] = useState('');
  const [addingContact, setAddingContact] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!pubkey) return;
    loadTrustedContacts();
  }, [pubkey]);

  const loadTrustedContacts = async () => {
    setIsLoading(true);
    try {
      const contacts = await getTrustedContacts();
      setTrustedContacts(contacts);
    } catch (error) {
      console.error('Error loading trusted contacts:', error);
      Alert.alert('Error', 'Failed to load your trusted contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAlert = async () => {
    if (trustedContacts.length === 0) {
      Alert.alert(
        'No Trusted Contacts',
        'You need to add at least one trusted contact before sending an emergency alert.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Send Emergency Alert',
      'Are you sure you want to send an emergency alert to all your trusted contacts?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', style: 'destructive', onPress: sendAlert }
      ]
    );
  };

  const sendAlert = async () => {
    setIsSending(true);
    try {
      let locationString = '';
      if (includeLocation && location) {
        locationString = `Location: ${location.coords.latitude}, ${location.coords.longitude}`;
      }
      
      const fullMessage = message.trim() 
        ? `${message}\n\n${includeLocation ? locationString : ''}`
        : `Emergency alert sent at ${formatTimestamp(Math.floor(Date.now() / 1000))}\n\n${includeLocation ? locationString : ''}`;
      
      await sendEmergencyAlert(fullMessage, trustedContacts);
      
      Alert.alert(
        'Alert Sent',
        'Your emergency alert has been sent to your trusted contacts.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      Alert.alert('Error', 'Failed to send emergency alert. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContactKey || newContactKey.trim().length < 63) {
      Alert.alert('Invalid Key', 'Please enter a valid Nostr public key (npub or hex)');
      return;
    }

    setAddingContact(true);
    try {
      const contactKey = newContactKey.trim();
      await addTrustedContact(contactKey);
      setTrustedContacts(prev => [...prev, contactKey]);
      setNewContactKey('');
    } catch (error) {
      console.error('Error adding trusted contact:', error);
      Alert.alert('Error', 'Failed to add trusted contact.');
    } finally {
      setAddingContact(false);
    }
  };

  const handleRemoveContact = async (contactKey) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this trusted contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await removeTrustedContact(contactKey);
              setTrustedContacts(prev => prev.filter(key => key !== contactKey));
            } catch (error) {
              console.error('Error removing trusted contact:', error);
              Alert.alert('Error', 'Failed to remove trusted contact.');
            }
          }
        }
      ]
    );
  };

  // Mock function for getting location - in a real app, use geolocation
  const requestLocation = () => {
    // This would use React Native's Geolocation API
    // For demo purposes, just set a mock location
    setLocation({
      coords: {
        latitude: '37.7749',
        longitude: '-122.4194'
      }
    });
  };

  useEffect(() => {
    if (includeLocation && !location) {
      requestLocation();
    }
  }, [includeLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Emergency" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.alertSection}>
          <Text style={styles.alertTitle}>Send Emergency Alert</Text>
          <Text style={styles.alertDescription}>
            This will send an encrypted emergency message to all your trusted contacts.
            Use this when you need immediate support or are in a crisis situation.
          </Text>
          
          <Input
            placeholder="Optional message (how you're feeling, what you need)"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            style={styles.messageInput}
          />
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Include my location</Text>
            <Switch
              value={includeLocation}
              onValueChange={setIncludeLocation}
              trackColor={{ false: '#767577', true: '#4a90e2' }}
              thumbColor="#f4f3f4"
            />
          </View>
          
          <Button
            title={isSending ? "Sending Alert..." : "Send Emergency Alert"}
            onPress={handleSendAlert}
            disabled={isSending || trustedContacts.length === 0}
            loading={isSending}
            style={styles.sendAlertButton}
          />
        </View>
        
        <View style={styles.trustedContactsSection}>
          <Text style={styles.sectionTitle}>Trusted Contacts</Text>
          <Text style={styles.sectionDescription}>
            These are the people who will receive your emergency alerts.
            Add contacts by their Nostr public key.
          </Text>
          
          <View style={styles.addContactContainer}>
            <Input
              placeholder="Enter contact's Nostr public key"
              value={newContactKey}
              onChangeText={setNewContactKey}
              style={styles.addContactInput}
            />
            <Button
              title={addingContact ? "Adding..." : "Add Contact"}
              onPress={handleAddContact}
              disabled={!newContactKey.trim() || addingContact}
              loading={addingContact}
              style={styles.addContactButton}
            />
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#4a90e2" style={styles.loader} />
          ) : (
            <View style={styles.contactsList}>
              {trustedContacts.length === 0 ? (
                <Text style={styles.noContactsText}>
                  You don't have any trusted contacts yet. Add someone to get started.
                </Text>
              ) : (
                trustedContacts.map((contact, index) => (
                  <View key={contact} style={styles.contactItem}>
                    <Text style={styles.contactText} numberOfLines={1}>
                      {contact.slice(0, 8)}...{contact.slice(-4)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveContact(contact)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
        
        <View style={styles.helpResourcesSection}>
          <Text style={styles.sectionTitle}>Help Resources</Text>
          <Text style={styles.helpResourceText}>
            • National Helpline: 1-800-662-HELP (4357)
          </Text>
          <Text style={styles.helpResourceText}>
            • Crisis Text Line: Text HOME to 741741
          </Text>
          <Text style={styles.helpResourceText}>
            • National Suicide Prevention Lifeline: 988 or 1-800-273-8255
          </Text>
          <Text style={styles.helpResourceNotes}>
            Remember: If you're in immediate danger, call emergency services (911) directly.
          </Text>
        </View>
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
  alertSection: {
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
  alertTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 10,
  },
  alertDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    lineHeight: 20,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  sendAlertButton: {
    backgroundColor: '#e74c3c',
  },
  trustedContactsSection: {
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
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    lineHeight: 20,
  },
  addContactContainer: {
    marginBottom: 16,
  },
  addContactInput: {
    marginBottom: 10,
  },
  addContactButton: {
    backgroundColor: '#4a90e2',
  },
  contactsList: {
    marginTop: 10,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  noContactsText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    padding: 20,
  },
  helpResourcesSection: {
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
  helpResourceText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  helpResourceNotes: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
    marginTop: 8,
  },
  loader: {
    margin: 20,
  },
});
