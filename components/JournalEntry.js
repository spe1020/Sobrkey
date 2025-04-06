import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTimestamp } from '../lib/dateUtils';

export default function JournalEntry({ entry }) {
  const timestamp = entry.created_at 
    ? formatTimestamp(entry.created_at) 
    : 'Unknown date';
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{timestamp}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.entryText}>{entry.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8f0fe',
  },
  date: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  entryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});
