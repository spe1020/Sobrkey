import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

console.log('Sobrkey app is starting up with simplified version...');

export default function App() {
  console.log('Rendering simple test app component');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sobrkey</Text>
      <Text style={styles.subtitle}>Test App</Text>
      <Text style={styles.paragraph}>
        If you can see this text, the basic rendering is working correctly.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4a90e2',
  },
  subtitle: {
    fontSize: 24,
    marginBottom: 20,
    color: '#333',
  },
  paragraph: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
});
