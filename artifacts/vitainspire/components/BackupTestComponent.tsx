import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { makeId, saveField, StandingField } from '../lib/storage';
import { getSyncState, useSyncState } from '../lib/sync';

export default function BackupTestComponent() {
  const [testResult, setTestResult] = useState<string>('');
  const syncState = useSyncState();

  const testBackup = async () => {
    try {
      console.log('🧪 Starting backup test...');
      setTestResult('Testing backup...');

      // Create a test field
      const testField: StandingField = {
        id: makeId(),
        fieldCode: `TEST-${Date.now()}`,
        stage: 'standing',
        createdAt: Date.now(),
        plantPhoto: null,
        leafPhoto: null,
        cobPhoto: null,
      };

      console.log('📝 Created test field:', testField);

      // Save the field (this should trigger backup)
      await saveField(testField);
      console.log('💾 Field saved, backup should be triggered in 2 seconds...');

      setTestResult(`Test field created: ${testField.fieldCode}\nBackup should trigger in 2 seconds...\nCheck console for logs.`);

      // Wait and check sync state
      setTimeout(() => {
        const currentState = getSyncState();
        console.log('📊 Current sync state:', currentState);
        
        if (currentState.syncing) {
          setTestResult(prev => prev + '\n\n✅ Backup is running...');
        } else if (currentState.lastSyncAt) {
          setTestResult(prev => prev + '\n\n✅ Backup completed successfully!');
        } else if (currentState.lastError) {
          setTestResult(prev => prev + `\n\n❌ Backup failed: ${currentState.lastError}`);
        } else {
          setTestResult(prev => prev + '\n\n⏳ Waiting for backup to start...');
        }
      }, 3000);

    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResult(`Test failed: ${error}`);
    }
  };

  const checkEnvironment = () => {
    console.log('🔍 Environment Check:');
    console.log('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set');
    console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
    console.log('- EXPO_PUBLIC_BACKUP_URL:', process.env.EXPO_PUBLIC_BACKUP_URL ? '✅ Set' : '❌ Not set');
    
    Alert.alert(
      'Environment Check',
      `Supabase URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}\n` +
      `Supabase Key: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}\n` +
      `Backup URL: ${process.env.EXPO_PUBLIC_BACKUP_URL ? 'Set' : 'Not set'}\n\n` +
      'Check console for detailed logs.'
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backup Test Component</Text>
      
      <View style={styles.syncStatus}>
        <Text style={styles.label}>Sync Status:</Text>
        <Text style={styles.value}>
          {syncState.syncing ? '🔄 Syncing...' : 
           syncState.lastSyncAt ? `✅ Last sync: ${new Date(syncState.lastSyncAt).toLocaleTimeString()}` :
           syncState.lastError ? `❌ Error: ${syncState.lastError}` :
           '⏳ No sync yet'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={checkEnvironment}>
        <Text style={styles.buttonText}>Check Environment</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testBackup}>
        <Text style={styles.buttonText}>Test Backup Flow</Text>
      </TouchableOpacity>

      {testResult ? (
        <View style={styles.result}>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      ) : null}

      <Text style={styles.instructions}>
        1. Tap "Check Environment" to verify configuration{'\n'}
        2. Tap "Test Backup Flow" to create a test field{'\n'}
        3. Check browser console for detailed logs{'\n'}
        4. Check Supabase dashboard for the test field
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  syncStatus: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  result: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  instructions: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});