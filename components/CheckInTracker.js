import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CheckInTracker({ streak, checkedInToday }) {
  // Function to determine the message based on streak
  const getMessage = () => {
    if (streak === 0) {
      return checkedInToday 
        ? "You checked in today! Start your streak." 
        : "Check in today to start your streak!";
    } else if (streak === 1) {
      return checkedInToday 
        ? "Great job! You checked in today and yesterday." 
        : "You checked in yesterday. Keep it going!";
    } else {
      return checkedInToday 
        ? `Amazing! ${streak} day streak and counting!` 
        : `You're on a ${streak} day streak! Check in to continue.`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <View style={styles.circleOuter}>
          <View style={styles.circleInner}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>DAYS</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.message}>{getMessage()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  circleContainer: {
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  circleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  message: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginHorizontal: 20,
    fontWeight: '500',
  },
});
