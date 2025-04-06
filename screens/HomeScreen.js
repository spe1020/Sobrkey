import React, { useContext, useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import Button from '../components/Button';
import Header from '../components/Header';
import CheckInTracker from '../components/CheckInTracker';
import { NostrContext } from '../context/NostrContext';
import { dailyCheckIn, getCheckInsForUser } from '../nostr/eventHandler';
import { formatDate } from '../lib/dateUtils';

export default function HomeScreen({ navigation }) {
  const { pubkey } = useContext(NostrContext);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    loadCheckIns();
  }, [pubkey]);

  const loadCheckIns = async () => {
    if (!pubkey) return;
    
    try {
      const checkIns = await getCheckInsForUser(pubkey);
      
      // Calculate streak
      const sortedCheckIns = checkIns.sort((a, b) => b.created_at - a.created_at);
      let streak = 0;
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if checked in today
      if (sortedCheckIns.length > 0) {
        const latestDate = new Date(sortedCheckIns[0].created_at * 1000);
        latestDate.setHours(0, 0, 0, 0);
        if (latestDate.getTime() === today.getTime()) {
          setTodayCheckedIn(true);
        }
      }
      
      // Calculate streak
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < sortedCheckIns.length; i++) {
        const checkInDate = new Date(sortedCheckIns[i].created_at * 1000);
        checkInDate.setHours(0, 0, 0, 0);
        
        // If this is today's check-in, move to yesterday to start counting
        if (i === 0 && checkInDate.getTime() === today.getTime()) {
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() - 1);
          streak = 1;
          continue;
        }
        
        const expectedDate = new Date(currentDate);
        expectedDate.setHours(0, 0, 0, 0);
        
        // If not the expected date, break the streak
        if (checkInDate.getTime() !== expectedDate.getTime()) {
          break;
        }
        
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      setCheckInStreak(streak);
    } catch (error) {
      console.error('Error loading check-ins:', error);
    }
  };

  const handleCheckIn = async () => {
    if (todayCheckedIn) return;
    
    setIsCheckingIn(true);
    try {
      await dailyCheckIn();
      setTodayCheckedIn(true);
      await loadCheckIns(); // Reload to update streak
    } catch (error) {
      console.error('Error checking in:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Sobrkey" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.welcomeText}>
          Welcome to your private recovery space
        </Text>
        
        <View style={styles.streakContainer}>
          <CheckInTracker streak={checkInStreak} checkedInToday={todayCheckedIn} />
          <Button 
            title={todayCheckedIn ? "Checked In Today ✓" : "Daily Check-In"} 
            onPress={handleCheckIn}
            disabled={todayCheckedIn || isCheckingIn}
            loading={isCheckingIn}
            style={todayCheckedIn ? styles.checkedInButton : styles.checkInButton}
          />
        </View>

        <View style={styles.menuContainer}>
          <Button 
            title="Journal" 
            onPress={() => navigation.navigate('Journal')}
            icon="book"
            style={styles.menuButton}
          />
          
          <Button 
            title="Join Meeting" 
            onPress={() => navigation.navigate('Meeting')}
            icon="users"
            style={styles.menuButton}
          />
          
          <Button 
            title="Support" 
            onPress={() => navigation.navigate('Support')}
            icon="message-circle"
            style={styles.menuButton}
          />
          
          <Button 
            title="Emergency" 
            onPress={() => navigation.navigate('Emergency')}
            icon="alert-triangle"
            style={styles.emergencyButton}
          />
        </View>
        
        <View style={styles.todayContainer}>
          <Text style={styles.todayTitle}>Today, {formatDate(new Date())}</Text>
          <Text style={styles.quote}>
            "One day at a time. This is enough. Do not look back and grieve over the past, for it is gone; and do not be troubled about the future, for it has not yet come. Live in the present, and make it so beautiful that it will be worth remembering."
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
  },
  welcomeText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  streakContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  checkInButton: {
    backgroundColor: '#4a90e2',
    marginTop: 10,
  },
  checkedInButton: {
    backgroundColor: '#27ae60',
    marginTop: 10,
  },
  menuContainer: {
    marginBottom: 30,
  },
  menuButton: {
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: '#e74c3c',
    marginTop: 10,
  },
  todayContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  quote: {
    fontStyle: 'italic',
    color: '#555',
    lineHeight: 22,
  },
});
