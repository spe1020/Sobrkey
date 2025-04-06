import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import JournalEntry from '../components/JournalEntry';
import { NostrContext } from '../context/NostrContext';
import { saveJournalEntry, getJournalEntries, getJournalEntryForDate } from '../nostr/eventHandler';
import { formatDate } from '../lib/dateUtils';

export default function JournalScreen({ navigation }) {
  const { pubkey } = useContext(NostrContext);
  const [entry, setEntry] = useState('');
  const [journalEntries, setJournalEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayEntry, setTodayEntry] = useState(null);

  useEffect(() => {
    loadJournalEntries();
  }, [pubkey]);

  useEffect(() => {
    loadEntryForDate(selectedDate);
  }, [selectedDate, journalEntries]);

  const loadJournalEntries = async () => {
    if (!pubkey) return;
    
    setIsLoading(true);
    try {
      const entries = await getJournalEntries(pubkey);
      setJournalEntries(entries);
      
      // Load today's entry if it exists
      loadEntryForDate(new Date());
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntryForDate = (date) => {
    const formattedDate = formatDate(date, 'yyyy-MM-dd');
    const existingEntry = journalEntries.find(entry => {
      const entryDate = formatDate(new Date(entry.created_at * 1000), 'yyyy-MM-dd');
      return entryDate === formattedDate;
    });
    
    if (existingEntry) {
      const isToday = formatDate(date, 'yyyy-MM-dd') === formatDate(new Date(), 'yyyy-MM-dd');
      if (isToday) {
        setEntry(existingEntry.content);
        setTodayEntry(existingEntry);
      } else {
        setTodayEntry(existingEntry);
      }
    } else {
      const isToday = formatDate(date, 'yyyy-MM-dd') === formatDate(new Date(), 'yyyy-MM-dd');
      if (isToday) {
        setEntry('');
      }
      setTodayEntry(null);
    }
  };

  const handleSave = async () => {
    if (!entry.trim()) return;
    
    setIsSaving(true);
    try {
      await saveJournalEntry(entry);
      await loadJournalEntries();
      // No need to clear entry - keep it in the input
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectPreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  };

  const selectNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Don't go beyond today
    const today = new Date();
    if (nextDate <= today) {
      setSelectedDate(nextDate);
    }
  };

  const isToday = formatDate(selectedDate, 'yyyy-MM-dd') === formatDate(new Date(), 'yyyy-MM-dd');

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Journal" showBackButton onBackPress={() => navigation.goBack()} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.dateSelector}>
            <TouchableOpacity onPress={selectPreviousDay} style={styles.dateArrow}>
              <Text style={styles.dateArrowText}>←</Text>
            </TouchableOpacity>
            
            <Text style={styles.dateText}>
              {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
              {isToday ? ' (Today)' : ''}
            </Text>
            
            <TouchableOpacity 
              onPress={selectNextDay} 
              style={[styles.dateArrow, !isToday ? styles.dateArrowActive : styles.dateArrowDisabled]}
              disabled={isToday}
            >
              <Text style={[styles.dateArrowText, isToday ? styles.dateArrowDisabledText : styles.dateArrowText]}>→</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#4a90e2" style={styles.loader} />
          ) : (
            <>
              {isToday ? (
                <>
                  <Text style={styles.promptTitle}>Today's Reflection</Text>
                  <Text style={styles.promptText}>How are you feeling about your recovery journey today?</Text>
                  
                  <Input
                    placeholder="Write your private journal entry..."
                    value={entry}
                    onChangeText={setEntry}
                    multiline
                    numberOfLines={8}
                    style={styles.journalInput}
                  />
                  
                  <Button
                    title={isSaving ? "Saving..." : "Save Entry"}
                    onPress={handleSave}
                    disabled={!entry.trim() || isSaving}
                    loading={isSaving}
                    style={styles.saveButton}
                  />
                </>
              ) : (
                <>
                  {todayEntry ? (
                    <JournalEntry entry={todayEntry} />
                  ) : (
                    <View style={styles.noEntryContainer}>
                      <Text style={styles.noEntryText}>No journal entry for this date.</Text>
                    </View>
                  )}
                </>
              )}
              
              {journalEntries.length > 0 && isToday && (
                <View style={styles.previousEntriesContainer}>
                  <Text style={styles.previousEntriesTitle}>Previous Entries</Text>
                  <Text style={styles.previousEntriesSubtitle}>
                    Tap on the date selector to view past entries
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dateArrow: {
    padding: 8,
    borderRadius: 8,
  },
  dateArrowActive: {
    opacity: 1,
  },
  dateArrowDisabled: {
    opacity: 0.3,
  },
  dateArrowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  dateArrowDisabledText: {
    color: '#999',
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  promptText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  journalInput: {
    height: 200,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveButton: {
    marginBottom: 24,
  },
  previousEntriesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e8f0fe',
    borderRadius: 12,
  },
  previousEntriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  previousEntriesSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loader: {
    marginTop: 40,
  },
  noEntryContainer: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
  },
  noEntryText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});
