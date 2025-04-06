import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { generateKeyPair, importKeys } from '../nostr/keyManager';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [importOption, setImportOption] = useState(null);
  const [importKey, setImportKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (importOption === 'new') {
        await createNewIdentity();
      } else if (importOption === 'import') {
        if (!importKey.trim()) {
          setError('Please enter your private key');
          return;
        }
        await importExistingIdentity();
      }
    }
  };

  const createNewIdentity = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      await generateKeyPair();
      // Success - the App.js will handle redirecting to the main app
    } catch (error) {
      console.error('Error generating keys:', error);
      setError('Failed to generate keys. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const importExistingIdentity = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      await importKeys(importKey.trim());
      // Success - the App.js will handle redirecting to the main app
    } catch (error) {
      console.error('Error importing keys:', error);
      setError('Invalid private key. Please check and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.appName}>Sobrkey</Text>
          <Text style={styles.tagline}>Private recovery support on Nostr</Text>
        </View>
        
        {step === 1 ? (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Welcome to Sobrkey</Text>
            <Text style={styles.stepDescription}>
              A private, secure space for your recovery journey. Built on Nostr for complete privacy and control.
            </Text>
            
            <View style={styles.featuresContainer}>
              <FeatureItem 
                title="Anonymous Meetings" 
                description="Join encrypted group meetings for support" 
                icon="🌐"
              />
              <FeatureItem 
                title="Private Journal" 
                description="Document your thoughts and progress securely" 
                icon="📝"
              />
              <FeatureItem 
                title="Peer Support" 
                description="Connect with others through encrypted messages" 
                icon="🤝"
              />
              <FeatureItem 
                title="Emergency Button" 
                description="Send alerts to trusted contacts when needed" 
                icon="🚨"
              />
            </View>
            
            <Button
              title="Get Started"
              onPress={handleContinue}
              style={styles.continueButton}
            />
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Create Your Identity</Text>
            <Text style={styles.stepDescription}>
              Sobrkey uses the Nostr protocol to keep your data private and secure.
              You need a Nostr key to continue.
            </Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  importOption === 'new' && styles.selectedOption
                ]}
                onPress={() => setImportOption('new')}
              >
                <Text style={styles.optionTitle}>Create New Identity</Text>
                <Text style={styles.optionDescription}>
                  Generate a new Nostr keypair that will be securely stored on your device.
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  importOption === 'import' && styles.selectedOption
                ]}
                onPress={() => setImportOption('import')}
              >
                <Text style={styles.optionTitle}>Import Existing Keys</Text>
                <Text style={styles.optionDescription}>
                  Use your existing Nostr private key (starts with nsec).
                </Text>
              </TouchableOpacity>
            </View>
            
            {importOption === 'import' && (
              <View style={styles.importContainer}>
                <Input
                  placeholder="Enter your private key (nsec...)"
                  value={importKey}
                  onChangeText={setImportKey}
                  secureTextEntry
                  style={styles.importInput}
                />
              </View>
            )}
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
            
            <Button
              title={isProcessing ? "Processing..." : "Continue"}
              onPress={handleContinue}
              disabled={!importOption || isProcessing}
              loading={isProcessing}
              style={styles.continueButton}
            />
            
            <Text style={styles.privacyNote}>
              Your keys never leave your device. We don't track any identifiable information.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const FeatureItem = ({ title, description, icon }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  stepContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    marginVertical: 16,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  continueButton: {
    marginTop: 20,
  },
  optionsContainer: {
    marginVertical: 16,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#4a90e2',
    backgroundColor: '#f0f7ff',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  importContainer: {
    marginTop: 8,
  },
  importInput: {
    marginBottom: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 8,
    textAlign: 'center',
  },
  privacyNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});
