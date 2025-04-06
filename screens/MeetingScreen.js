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
  Alert
} from 'react-native';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Message from '../components/Message';
import { NostrContext } from '../context/NostrContext';
import { sendMeetingMessage, getMeetingMessages, subscribeMeetingMessages } from '../nostr/eventHandler';
import { formatTimestamp } from '../lib/dateUtils';

const DEFAULT_MEETING_ID = 'aa-general-meeting';
const MEETING_OPTIONS = [
  { id: 'aa-general-meeting', name: 'General Recovery Meeting' },
  { id: 'aa-newcomers', name: 'Newcomers Meeting' },
  { id: 'aa-daily-reflections', name: 'Daily Reflections' },
  { id: 'aa-12-steps', name: '12 Steps Discussion' },
];

export default function MeetingScreen({ navigation }) {
  const { pubkey } = useContext(NostrContext);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState(DEFAULT_MEETING_ID);
  const [showMeetingList, setShowMeetingList] = useState(false);
  const scrollViewRef = useRef();
  
  useEffect(() => {
    if (!pubkey) return;
    
    loadMeetingMessages();
    
    // Set up subscription for new messages
    const unsubscribe = subscribeMeetingMessages(activeMeetingId, (newMessage) => {
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
  }, [pubkey, activeMeetingId]);

  const loadMeetingMessages = async () => {
    if (!pubkey) return;
    
    setIsLoading(true);
    try {
      const meetingMessages = await getMeetingMessages(activeMeetingId);
      setMessages(meetingMessages.sort((a, b) => a.created_at - b.created_at));
    } catch (error) {
      console.error('Error loading meeting messages:', error);
      Alert.alert('Error', 'Failed to load meeting messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    try {
      await sendMeetingMessage(activeMeetingId, message);
      setMessage('');
      // The new message will come through subscription
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const changeMeeting = (meetingId) => {
    if (meetingId !== activeMeetingId) {
      setActiveMeetingId(meetingId);
      setShowMeetingList(false);
      setMessages([]);
      // loadMeetingMessages will be called by the useEffect
    } else {
      setShowMeetingList(false);
    }
  };

  const getActiveMeetingName = () => {
    const meeting = MEETING_OPTIONS.find(m => m.id === activeMeetingId);
    return meeting ? meeting.name : 'Unknown Meeting';
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Meeting" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.meetingSelector}>
        <TouchableOpacity 
          style={styles.meetingSelectorButton}
          onPress={() => setShowMeetingList(!showMeetingList)}
        >
          <Text style={styles.meetingName}>{getActiveMeetingName()}</Text>
          <Text style={styles.dropdownIcon}>{showMeetingList ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {showMeetingList && (
          <View style={styles.meetingList}>
            {MEETING_OPTIONS.map(meeting => (
              <TouchableOpacity
                key={meeting.id}
                style={[
                  styles.meetingOption,
                  meeting.id === activeMeetingId && styles.activeMeetingOption
                ]}
                onPress={() => changeMeeting(meeting.id)}
              >
                <Text 
                  style={[
                    styles.meetingOptionText,
                    meeting.id === activeMeetingId && styles.activeMeetingOptionText
                  ]}
                >
                  {meeting.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={90}
      >
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
              onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 ? (
                <Text style={styles.emptyStateText}>
                  No messages yet. Be the first to share in this meeting!
                </Text>
              ) : (
                <>
                  <View style={styles.meetingInfo}>
                    <Text style={styles.meetingInfoText}>
                      Remember: All messages in this meeting are encrypted and anonymous.
                      Please respect everyone's privacy and journey.
                    </Text>
                  </View>
                  
                  {messages.map((msg, index) => (
                    <Message 
                      key={msg.id || index}
                      text={msg.content}
                      timestamp={formatTimestamp(msg.created_at)}
                      isOwnMessage={msg.pubkey === pubkey}
                      author={msg.pubkey.slice(0, 8)}
                    />
                  ))}
                </>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  keyboardAvoid: {
    flex: 1,
  },
  meetingSelector: {
    position: 'relative',
    zIndex: 10,
    margin: 10,
  },
  meetingSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  meetingName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownIcon: {
    color: '#fff',
    fontSize: 14,
  },
  meetingList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  meetingOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activeMeetingOption: {
    backgroundColor: '#e8f0fe',
  },
  meetingOptionText: {
    fontSize: 16,
    color: '#333',
  },
  activeMeetingOptionText: {
    color: '#4a90e2',
    fontWeight: '600',
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
  meetingInfo: {
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  meetingInfoText: {
    color: '#5d4037',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
