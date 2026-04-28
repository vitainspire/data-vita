/**
 * Test if the app environment is properly configured
 * Run this in the app's browser console to debug
 */

console.log('🔍 Testing App Environment Configuration');
console.log('=====================================');

// Check if we're in the right environment
console.log('1️⃣ Environment Check:');
console.log('   - Platform:', typeof window !== 'undefined' ? 'Web' : 'Node.js');
console.log('   - Location:', typeof window !== 'undefined' ? window.location.href : 'N/A');

// Check environment variables
console.log('\n2️⃣ Environment Variables:');
const envVars = {
  'EXPO_PUBLIC_SUPABASE_URL': process.env.EXPO_PUBLIC_SUPABASE_URL,
  'EXPO_PUBLIC_SUPABASE_ANON_KEY': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  'EXPO_PUBLIC_BACKUP_URL': process.env.EXPO_PUBLIC_BACKUP_URL,
  'EXPO_PUBLIC_ENABLE_SUPABASE_BACKUP': process.env.EXPO_PUBLIC_ENABLE_SUPABASE_BACKUP,
  'EXPO_PUBLIC_USE_SEPARATED_SERVICES': process.env.EXPO_PUBLIC_USE_SEPARATED_SERVICES
};

for (const [key, value] of Object.entries(envVars)) {
  console.log(`   - ${key}:`, value ? '✅ Set' : '❌ Not set');
}

// Test backup configuration
console.log('\n3️⃣ Backup Configuration Test:');
try {
  // This would be the actual logic from isBackupConfigured()
  const BACKUP_URL = process.env.EXPO_PUBLIC_BACKUP_URL || '';
  const USE_SEPARATED_SERVICES = process.env.EXPO_PUBLIC_USE_SEPARATED_SERVICES === "true";
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  
  let isConfigured = false;
  
  if (USE_SEPARATED_SERVICES) {
    const driveUrl = process.env.EXPO_PUBLIC_DRIVE_URL || '';
    const sheetsUrl = process.env.EXPO_PUBLIC_SHEETS_URL || '';
    isConfigured = driveUrl.length > 0 && sheetsUrl.length > 0;
    console.log('   - Separated Services:', isConfigured ? '✅ Configured' : '❌ Not configured');
  } else if (BACKUP_URL.length > 0) {
    isConfigured = true;
    console.log('   - Google Apps Script:', '✅ Configured');
  } else if (SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0) {
    isConfigured = true;
    console.log('   - Supabase:', '✅ Configured');
  } else {
    console.log('   - No backup system:', '❌ Not configured');
  }
  
  console.log('   - isBackupConfigured() result:', isConfigured ? '✅ true' : '❌ false');
  
  if (!isConfigured) {
    console.log('\n❌ CRITICAL ISSUE: Backup not configured!');
    console.log('   This means scheduleSync() will exit early and no backups will run.');
    console.log('   Check your .env file and make sure environment variables are loaded.');
  } else {
    console.log('\n✅ Backup system should be working');
  }
  
} catch (error) {
  console.log('   ❌ Error testing backup configuration:', error);
}

// Test Supabase connection if configured
console.log('\n4️⃣ Supabase Connection Test:');
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  fetch(`${supabaseUrl}/rest/v1/fields?select=count`, {
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) {
      console.log('   ✅ Supabase connection successful');
    } else {
      console.log('   ❌ Supabase connection failed:', response.status);
    }
  })
  .catch(error => {
    console.log('   ❌ Supabase connection error:', error);
  });
} else {
  console.log('   ❌ Supabase credentials not available');
}

console.log('\n📋 Instructions:');
console.log('1. Copy this entire script');
console.log('2. Open your VitaInspire app in the browser');
console.log('3. Open browser developer tools (F12)');
console.log('4. Paste this script in the console and press Enter');
console.log('5. Check the output to see what\'s wrong');