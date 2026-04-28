/**
 * Debug the backup flow to see exactly what's happening when data is saved
 */

// Mock environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://nithtycmdyvaftjdkptw.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdGh0eWNtZHl2YWZ0amRrcHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjYwOTIsImV4cCI6MjA5Mjk0MjA5Mn0.QJgWdv1nusvCJC-X-mv9l-QhWAvBewD4H85v6ZzE1Eg';
process.env.EXPO_PUBLIC_ENABLE_SUPABASE_BACKUP = 'true';

async function debugBackupFlow() {
  console.log('🔍 Debugging Backup Flow\n');
  
  // Step 1: Check backup configuration
  console.log('1️⃣ Checking backup configuration...');
  
  const BACKUP_URL = process.env.EXPO_PUBLIC_BACKUP_URL || '';
  const USE_SEPARATED_SERVICES = process.env.EXPO_PUBLIC_USE_SEPARATED_SERVICES === "true";
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  
  console.log('   Environment Variables:');
  console.log('   - EXPO_PUBLIC_BACKUP_URL:', BACKUP_URL ? '✅ Set' : '❌ Not set');
  console.log('   - EXPO_PUBLIC_USE_SEPARATED_SERVICES:', USE_SEPARATED_SERVICES ? '✅ True' : '❌ False');
  console.log('   - EXPO_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('   - EXPO_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_KEY ? '✅ Set' : '❌ Not set');
  
  // Step 2: Test isBackupConfigured logic
  console.log('\n2️⃣ Testing isBackupConfigured() logic...');
  
  let isConfigured = false;
  
  if (USE_SEPARATED_SERVICES) {
    const driveUrl = process.env.EXPO_PUBLIC_DRIVE_URL || '';
    const sheetsUrl = process.env.EXPO_PUBLIC_SHEETS_URL || '';
    isConfigured = driveUrl.length > 0 && sheetsUrl.length > 0;
    console.log('   - Using separated services:', isConfigured ? '✅ Configured' : '❌ Not configured');
  } else if (BACKUP_URL.length > 0) {
    isConfigured = true;
    console.log('   - Google Apps Script:', '✅ Configured');
  } else if (SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0) {
    isConfigured = true;
    console.log('   - Supabase fallback:', '✅ Configured');
  } else {
    console.log('   - No backup system:', '❌ Not configured');
  }
  
  console.log('   - isBackupConfigured() would return:', isConfigured ? '✅ true' : '❌ false');
  
  if (!isConfigured) {
    console.log('\n❌ PROBLEM FOUND: isBackupConfigured() returns false');
    console.log('   This means scheduleSync() will exit early and never trigger backups!');
    return;
  }
  
  // Step 3: Test the backup flow
  console.log('\n3️⃣ Testing backup flow...');
  
  if (BACKUP_URL) {
    console.log('   - Would try Google Apps Script first');
    console.log('   - Google would fail (not actually configured)');
    console.log('   - Would fallback to Supabase');
  } else {
    console.log('   - No Google URL, would use Supabase directly');
  }
  
  // Test Supabase connection
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/fields?select=count`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('   - Supabase connection: ✅ Working');
    } else {
      console.log('   - Supabase connection: ❌ Failed -', response.status);
    }
  } catch (error) {
    console.log('   - Supabase connection: ❌ Error -', error.message);
  }
  
  // Step 4: Simulate the exact app flow
  console.log('\n4️⃣ Simulating app save flow...');
  console.log('   1. User saves field data');
  console.log('   2. saveField() calls scheduleSync("standing", 2000)');
  console.log('   3. scheduleSync() checks isBackupConfigured()');
  
  if (isConfigured) {
    console.log('   4. ✅ Backup is configured, scheduleSync() sets 2-second timer');
    console.log('   5. After 2 seconds, triggerSync() is called');
    console.log('   6. triggerSync() calls runBackup("standing")');
    console.log('   7. runBackup() executes Supabase backup');
    console.log('   8. Data should appear in Supabase');
  } else {
    console.log('   4. ❌ Backup not configured, scheduleSync() exits early');
    console.log('   5. No backup is triggered');
    console.log('   6. Data stays only in local storage');
  }
  
  // Step 5: Test actual data insertion
  console.log('\n5️⃣ Testing actual data insertion...');
  
  try {
    const testField = {
      code: `DEBUG-${Date.now()}`,
      label: 'Debug Test Field',
      location_code: 'DEBUG',
      state: 'Debug State',
      district: 'Debug District',
      latitude: 12.9716,
      longitude: 77.5946,
      created_at: new Date().toISOString()
    };
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/fields`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testField)
    });
    
    if (response.ok) {
      console.log('   ✅ Test field inserted successfully:', testField.code);
      console.log('   🎯 Check your Supabase dashboard for this field');
    } else {
      const errorText = await response.text();
      console.log('   ❌ Test field insertion failed:', response.status, errorText);
    }
  } catch (error) {
    console.log('   ❌ Test insertion error:', error.message);
  }
  
  console.log('\n📋 Summary:');
  if (isConfigured) {
    console.log('✅ Backup system should be working');
    console.log('If you\'re not seeing data, check:');
    console.log('1. Are you waiting 2+ seconds after saving?');
    console.log('2. Check browser console for any errors');
    console.log('3. Verify you\'re looking at the correct Supabase project');
  } else {
    console.log('❌ Backup system is not working');
    console.log('The isBackupConfigured() function needs to be fixed');
  }
}

debugBackupFlow().catch(console.error);