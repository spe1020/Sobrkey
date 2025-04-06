import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Message from '../components/Message';
import { NostrContext } from '../context/NostrContext';
import { sendDirectMessage, getDirectMessages, subscribeToDirectMessages } from '../nostr/eventHandler';
import { formatTimestamp } from '../lib/dateUtils';

export default function SupportScreen({ navigation }) {
  const { pubkey } = useContext(NostrContext);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newContactKey, setNewContactKey] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    if (!pubkey) return;
    loadConversations();
  }, [pubkey]);

  useEffect(() => {
    if (!activeConversation) return;
    
    loadMessages(activeConversation);
    
    // Subscribe to new messages for the active conversation
    const unsubscribe = subscribeToDirectMessages(activeConversation, (newMessage) => {
      setMessages(prevMessages => {
        // Check if we already have this message (by id)
        if (prevMessages.some(msg => msg.id === newMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, newMessage].sort((a, b) => a.created_at - b.created_at);
      });
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversation]);

  const loadConversations = async () => {
    if (!pubkey) return;
    
    setIsLoading(true);
    try {
      // This would get all contacts the user has exchanged messages with
      const dmEvents = await getDirectMessages();
      
      // Extract unique pubkeys
      const uniquePubkeys = [...new Set(
        dmEvents.map(event => event.pubkey === pubkey ? event.tags.find(tag => tag[0] === 'p')?.[1] : event.pubkey)
      )].filter(Boolean);
      
      setConversations(uniquePubkeys);
      
      // If we have conversations but no active one, set the first as active
      if (uniquePubkeys.length > 0 && !activeConversation) {
        setActiveConversation(uniquePubkeys[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load your support conversations.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (contactPubkey) => {
    if (!pubkey || !contactPubkey) return;
    
    setMessages([]);
    setIsLoading(true);
    
    try {
      const dmMessages = await getDirectMessages(contactPubkey);
      setMessages(dmMessages.sort((a, b) => a.created_at - b.created_at));
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages for this conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return;
    
    setIsSending(true);
    try {
      await sendDirectMessage(activeConversation, message);
      setMessage('');
      // New message will come in through subscription
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const startNewConversation = () => {
    if (!newContactKey || newContactKey.trim().length < 63) {
      Alert.alert('Invalid Key', 'Please enter a valid Nostr public key (npub or hex)');
      return;
    }

    // Here we'd convert npub to hex if needed
    // For simplicity, we're just using the key as-is
    const contactKey = newContactKey.trim();
    
    if (conversations.includes(contactKey)) {
      // Already have a conversation with this pubkey
      setActiveConversation(contactKey);
      setShowAddContact(false);
      setNewContactKey('');
      return;
    }
    
    // Add to conversations and set as active
    setConversations(prev => [...prev, contactKey]);
    setActiveConversation(contactKey);
    setShowAddContact(false);
    setNewContactKey('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Support" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.contentContainer}>
        {/* Left sidebar for conversations */}
        <View style={styles.conversationsContainer}>
          <View style={styles.conversationsHeader}>
            <Text style={styles.conversationsTitle}>Conversations</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddContact(!showAddContact)}
            >
              <Text style={styles.addButtonText}>{showAddContact ? '×' : '+'}</Text>
            </TouchableOpacity>
          </View>
          
          {showAddContact && (
            <View style={styles.addContactContainer}>
              <Input
                placeholder="Enter pubkey (npub...)"
                value={newContactKey}
                onChangeText={setNewContactKey}
                style={styles.addContactInput}
              />
              <Button
                title="Add"
                onPress={startNewConversation}
                style={styles.addContactButton}
                disabled={!newContactKey.trim()}
              />
            </View>
          )}
          
          <ScrollView style={styles.contactsList}>
            {conversations.length === 0 ? (
              <Text style={styles.noContactsText}>
                No conversations yet. Add a contact to start.
              </Text>
            ) : (
              conversations.map(contactKey => (
                <TouchableOpacity
                  key={contactKey}
                  style={[
                    styles.contactItem,
                    activeConversation === contactKey && styles.activeContactItem
                  ]}
                  onPress={() => setActiveConversation(contactKey)}
                >
                  <Text 
                    style={[
                      styles.contactText,
                      activeConversation === contactKey && styles.activeContactText
                    ]}
                    numberOfLines={1}
                  >
                    {contactKey.slice(0, 8)}...
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
        
        {/* Right side for messages */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.messagesSection}
          keyboardVerticalOffset={90}
        >
          {activeConversation ? (
            <>
              <View style={styles.activeChatHeader}>
                <Text style={styles.activeChatTitle}>
                  Chat with {activeConversation.slice(0, 8)}...
                </Text>
              </View>
              
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4a90e2" />
                  <Text style={styles.loadingText}>Loading messages...</Text>
                </View>
              ) : (
                <>
                  <ScrollView 
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
                  >
                    {messages.length === 0 ? (
                      <Text style={styles.emptyStateText}>
                        No messages yet. Send a message to start the conversation.
                      </Text>
                    ) : (
                      messages.map((msg, index) => (
                        <Message 
                          key={msg.id || index}
                          text={msg.content}
                          timestamp={formatTimestamp(msg.created_at)}
                          isOwnMessage={msg.pubkey === pubkey}
                          author={msg.pubkey.slice(0, 8)}
                        />
                      ))
                    )}
                  </ScrollView>
                  
                  <View style={styles.inputContainer}>
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChangeText={setMessage}
                      style={styles.messageInput}
                    />
                    <Button
                      title="Send"
                      onPress={handleSendMessage}
                      disabled={!message.trim() || isSending}
                      loading={isSending}
                      style={styles.sendButton}
                    />
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={styles.noActiveChat}>
              <Text style={styles.noActiveChatText}>
                Select a conversation or add a new contact to start chatting.
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  conversationsContainer: {
    width: 120,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  conversationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  conversationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    width: 24,
    height: 24,
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeContactItem: {
    backgroundColor: '#e8f0fe',
  },
  contactText: {
    fontSize: 14,
    color: '#333',
  },
  activeContactText: {
    fontWeight: '600',
    color: '#4a90e2',
  },
  noContactsText: {
    padding: 12,
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  messagesSection: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  activeChatHeader: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activeChatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  messageInput: {
    flex: 1,
    marginRight: 10,
  },
  sendButton: {
    width: 80,
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
  emptyStateText: {
    textAlign: 'center',
    color: '#777',
    margin: 40,
    fontStyle: 'italic',
  },
  noActiveChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noActiveChatText: {
    textAlign: 'center',
    color: '#777',
    fontStyle: 'italic',
  },
  addContactContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addContactInput: {
    fontSize: 12,
    marginBottom: 6,
  },
  addContactButton: {
    height: 30,
  },
});
