import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { useColors } from '@/hooks/useColors';
import { testSupabaseConnection, createTestData, runSupabaseBackup } from '@/lib/supabase-backup';

export function SupabaseTest() {
  const colors = useColors();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    setTesting(true);
    setResult('Testing connection...');
    
    try {
      const connectionResult = await testSupabaseConnection();
      
      if (connectionResult.ok) {
        setResult(`✅ Connection successful!\nDatabase: ${connectionResult.data?.database}\nStorage: ${connectionResult.data?.storage}\nBuckets: ${connectionResult.data?.buckets?.join(', ') || 'None'}`);
      } else {
        setResult(`❌ Connection failed: ${connectionResult.error}`);
      }
    } catch (error) {
      setResult(`❌ Test error: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const testDataCreation = async () => {
    setTesting(true);
    setResult('Creating test data...');
    
    try {
      const dataResult = await createTestData();
      
      if (dataResult.ok) {
        setResult('✅ Test data created successfully!\nCheck your Supabase dashboard → Table Editor');
      } else {
        setResult(`❌ Data creation failed: ${dataResult.error}`);
      }
    } catch (error) {
      setResult(`❌ Data creation error: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const testFullBackup = async () => {
    setTesting(true);
    setResult('Running full backup test...');
    
    try {
      const backupResult = await runSupabaseBackup();
      
      if (backupResult.ok) {
        setResult('✅ Full backup successful!\nCheck your Supabase dashboard for all data');
      } else {
        setResult(`❌ Backup failed: ${backupResult.error}`);
      }
    } catch (error) {
      setResult(`❌ Backup error: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      gap: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      margin: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.foreground,
      textAlign: 'center',
    },
    result: {
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      minHeight: 60,
    },
    resultText: {
      color: colors.foreground,
      fontSize: 14,
      fontFamily: 'monospace',
    },
    buttonContainer: {
      gap: 12,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Supabase Test Panel</Text>
      
      <View style={styles.result}>
        <Text style={styles.resultText}>
          {result || 'Click a button below to test Supabase connection'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title="Test Connection"
          onPress={testConnection}
          loading={testing}
          icon="wifi"
        />
        
        <PrimaryButton
          title="Create Test Data"
          onPress={testDataCreation}
          loading={testing}
          icon="database"
          variant="secondary"
        />
        
        <PrimaryButton
          title="Run Full Backup"
          onPress={testFullBackup}
          loading={testing}
          icon="upload-cloud"
          variant="secondary"
        />
      </View>
      
      <Text style={[styles.resultText, { fontSize: 12, opacity: 0.7, textAlign: 'center' }]}>
        After testing, check your Supabase dashboard at:{'\n'}
        https://nithtycmdyvaftjdkptw.supabase.co
      </Text>
    </View>
  );
}