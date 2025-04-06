import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Message({ 
  text, 
  timestamp, 
  isOwnMessage = false,
  author = ''
}) {
  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
      ]}>
        {!isOwnMessage && author && (
          <Text style={styles.authorText}>
            {author}
          </Text>
        )}
        
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {text}
        </Text>
        
        <Text style={[
          styles.timestampText,
          isOwnMessage ? styles.ownTimestampText : styles.otherTimestampText
        ]}>
          {timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 18,
    position: 'relative',
  },
  ownMessageBubble: {
    backgroundColor: '#4a90e2',
  },
  otherMessageBubble: {
    backgroundColor: '#e5e5ea',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  timestampText: {
    fontSize: 10,
    position: 'absolute',
    bottom: 4,
    right: 8,
  },
  ownTimestampText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestampText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  authorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 2,
  },
});
