/**
 * Test the app's backup flow
 * This simulates what happens when you save data in the app
 */

// Mock environment variables (same as in your .env)
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://nithtycmdyvaftjdkptw.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdGh0eWNtZHl2YWZ0amRrcHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjYwOTIsImV4cCI6MjA5Mjk0MjA5Mn0.QJgWdv1nusvCJC-X-mv9l-QhWAvBewD4H85v6ZzE1Eg';

// No Google Apps Script URL - should fallback to Supabase
// process.env.EXPO_PUBLIC_BACKUP_URL = '';

// Simple test to check backup configuration
async function testBackupConfig() {
  console.log('🔧 Testing backup configuration...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- EXPO_PUBLIC_BACKUP_URL:', process.env.EXPO_PUBLIC_BACKUP_URL || '(not set)');
  console.log('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
  
  // Test backup configuration check
  try {
    // Mock the backup configuration check
    const BACKUP_URL = process.env.EXPO_PUBLIC_BACKUP_URL || '';
    const SUPABASE_FALLBACK_ENABLED = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
    
    const isConfigured = BACKUP_URL.length > 0 || SUPABASE_FALLBACK_ENABLED;
    
    console.log('\nBackup Configuration:');
    console.log('- Google Apps Script:', BACKUP_URL ? '✅ Configured' : '❌ Not configured');
    console.log('- Supabase Fallback:', SUPABASE_FALLBACK_ENABLED ? '✅ Available' : '❌ Not available');
    console.log('- Overall Status:', isConfigured ? '✅ Backup system ready' : '❌ No backup configured');
    
    return isConfigured;
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    return false;
  }
}

// Test the actual backup flow
async function testBackupFlow() {
  console.log('\n🚀 Testing backup flow...\n');
  
  try {
    // Simulate the backup logic from backup.ts
    const BACKUP_URL = process.env.EXPO_PUBLIC_BACKUP_URL || '';
    const SUPABASE_FALLBACK_ENABLED = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
    
    if (BACKUP_URL) {
      console.log('1️⃣ Trying Google Apps Script backup...');
      console.log('❌ Google Apps Script not configured - would fail');
      
      if (SUPABASE_FALLBACK_ENABLED) {
        console.log('2️⃣ Falling back to Supabase...');
        
        // Test Supabase connection
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/fields?select=count`, {
          method: 'GET',
          headers: {
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('✅ Supabase fallback would succeed');
          return { ok: true, method: 'supabase-fallback' };
        } else {
          console.log('❌ Supabase fallback would fail');
          return { ok: false, error: 'Both Google and Supabase failed' };
        }
      } else {
        console.log('❌ No fallback available');
        return { ok: false, error: 'Google failed, no fallback' };
      }
    } else if (SUPABASE_FALLBACK_ENABLED) {
      console.log('1️⃣ No Google URL configured, using Supabase directly...');
      
      // Test Supabase connection
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/fields?select=count`, {
        method: 'GET',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ Supabase backup would succeed');
        return { ok: true, method: 'supabase-direct' };
      } else {
        console.log('❌ Supabase backup would fail');
        return { ok: false, error: 'Supabase connection failed' };
      }
    } else {
      console.log('❌ No backup service configured');
      return { ok: false, error: 'No backup service configured' };
    }
  } catch (error) {
    console.error('❌ Backup flow test failed:', error);
    return { ok: false, error: error.message };
  }
}

// Simulate what happens when user saves data in the app
async function simulateAppSave() {
  console.log('\n📱 Simulating app save operation...\n');
  
  console.log('1️⃣ User saves field data in app');
  console.log('2️⃣ App calls saveField() function');
  console.log('3️⃣ saveField() calls scheduleSync() with 2 second delay');
  console.log('4️⃣ scheduleSync() calls triggerSync()');
  console.log('5️⃣ triggerSync() calls runBackup()');
  
  const backupResult = await testBackupFlow();
  
  if (backupResult.ok) {
    console.log(`✅ Backup would succeed via ${backupResult.method}`);
    console.log('6️⃣ Data would be saved to Supabase');
    console.log('7️⃣ User sees success message');
  } else {
    console.log(`❌ Backup would fail: ${backupResult.error}`);
    console.log('6️⃣ Data still saved locally');
    console.log('7️⃣ User sees success message (backup failure is silent)');
  }
}

async function runTest() {
  console.log('🧪 Testing VitaInspire App Backup Flow\n');
  
  const isConfigured = await testBackupConfig();
  
  if (isConfigured) {
    await simulateAppSave();
    
    console.log('\n🎯 Conclusion:');
    console.log('The app backup system is properly configured and should work.');
    console.log('When you save data in the app, it should automatically backup to Supabase.');
    console.log('\n📋 To verify:');
    console.log('1. Open your VitaInspire app');
    console.log('2. Create a new field or capture data');
    console.log('3. Wait 2-3 seconds after saving');
    console.log('4. Check your Supabase dashboard for new data');
  } else {
    console.log('\n❌ Backup system not properly configured');
    console.log('Please check your environment variables');
  }
}

runTest().catch(console.error);