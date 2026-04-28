/**
 * BROWSER DEBUG SCRIPT
 * Copy and paste this entire script into your browser console when the VitaInspire app is open
 */

console.log('🔍 VitaInspire Backup Debug Script');
console.log('==================================');

// Test 1: Environment Variables
console.log('\n1️⃣ Environment Variables:');
const envVars = {
  'EXPO_PUBLIC_SUPABASE_URL': process.env.EXPO_PUBLIC_SUPABASE_URL,
  'EXPO_PUBLIC_SUPABASE_ANON_KEY': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  'EXPO_PUBLIC_BACKUP_URL': process.env.EXPO_PUBLIC_BACKUP_URL,
  'EXPO_PUBLIC_ENABLE_SUPABASE_BACKUP': process.env.EXPO_PUBLIC_ENABLE_SUPABASE_BACKUP,
};

for (const [key, value] of Object.entries(envVars)) {
  console.log(`   ${key}:`, value ? '✅ Set' : '❌ Not set');
  if (key === 'EXPO_PUBLIC_SUPABASE_URL' && value) {
    console.log(`      Value: ${value}`);
  }
}

// Test 2: Backup Configuration
console.log('\n2️⃣ Backup Configuration:');
const BACKUP_URL = process.env.EXPO_PUBLIC_BACKUP_URL || '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let isConfigured = false;
if (BACKUP_URL.length > 0) {
  isConfigured = true;
  console.log('   Google Apps Script: ✅ Configured');
} else if (SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0) {
  isConfigured = true;
  console.log('   Supabase: ✅ Configured');
} else {
  console.log('   No backup system: ❌ Not configured');
}

console.log('   isBackupConfigured() would return:', isConfigured ? '✅ true' : '❌ false');

// Test 3: Supabase Connection
if (SUPABASE_URL && SUPABASE_KEY) {
  console.log('\n3️⃣ Testing Supabase Connection...');
  
  fetch(`${SUPABASE_URL}/rest/v1/fields?select=count`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) {
      console.log('   ✅ Supabase connection successful');
      return response.json();
    } else {
      console.log('   ❌ Supabase connection failed:', response.status);
      throw new Error(`HTTP ${response.status}`);
    }
  })
  .then(data => {
    console.log('   📊 Response data:', data);
  })
  .catch(error => {
    console.log('   ❌ Supabase error:', error);
  });
} else {
  console.log('\n3️⃣ Supabase Connection: ❌ Not configured');
}

// Test 4: Create Test Field Function
console.log('\n4️⃣ Test Field Creation Function:');
console.log('   Run this command to test backup: window.testBackup()');

window.testBackup = async function() {
  console.log('\n🧪 Starting backup test...');
  
  try {
    // Create test field data
    const testField = {
      code: `BROWSER-TEST-${Date.now()}`,
      label: 'Browser Test Field',
      location_code: 'TEST',
      state: 'Test State',
      district: 'Test District',
      latitude: 12.9716,
      longitude: 77.5946,
      created_at: new Date().toISOString()
    };
    
    console.log('📝 Test field data:', testField);
    
    // Try to insert directly to Supabase
    if (SUPABASE_URL && SUPABASE_KEY) {
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
        console.log('✅ Test field inserted successfully!');
        console.log('🎯 Check your Supabase dashboard for field:', testField.code);
      } else {
        const errorText = await response.text();
        console.log('❌ Test field insertion failed:', response.status, errorText);
      }
    } else {
      console.log('❌ Cannot test - Supabase not configured');
    }
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
};

// Test 5: Instructions
console.log('\n📋 Instructions:');
console.log('1. Check the environment variables above');
console.log('2. If Supabase is configured, the connection test should pass');
console.log('3. Run window.testBackup() to test direct data insertion');
console.log('4. Try saving data in the app and watch for console logs');
console.log('5. Look for logs starting with 💾, ⏰, 🔄, 🎯, etc.');

if (!isConfigured) {
  console.log('\n❌ CRITICAL ISSUE: Backup not configured!');
  console.log('   The app will not backup data because isBackupConfigured() returns false');
  console.log('   Check your .env file and restart the app');
} else {
  console.log('\n✅ Backup system appears to be configured correctly');
  console.log('   If you\'re not seeing data, check for console errors when saving');
}