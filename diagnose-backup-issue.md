# Diagnosing Why Data Isn't Reaching Supabase

## Step 1: Check Environment Variables in the App

Open your VitaInspire app in the browser, then open the browser console (F12) and run:

```javascript
console.log('=== ENVIRONMENT CHECK ===');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set (length: ' + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'NOT SET');
console.log('EXPO_PUBLIC_BACKUP_URL:', process.env.EXPO_PUBLIC_BACKUP_URL || 'NOT SET');
```

**Expected Result:**
- SUPABASE_URL should show: `https://nithtycmdyvaftjdkptw.supabase.co`
- SUPABASE_ANON_KEY should show: `Set (length: 200+)`
- BACKUP_URL should show: `NOT SET`

**If environment variables are NOT SET:**
- The `.env` file isn't being loaded by the app
- You need to restart the development server
- Check if `.env` is in the correct location: `artifacts/vitainspire/.env`

## Step 2: Use the In-App Test Component

1. **Open your VitaInspire app**
2. **Go to the Field tab** (first tab)
3. **Look for "Backup Test Component"** section
4. **Tap "Check Environment"** button
5. **Tap "Test Backup Flow"** button
6. **Watch the console logs**

**What to look for:**
```
💾 saveField called with field: TEST-xxx standing
⏰ Scheduling sync for field stage: standing
⏰ scheduleSync called with target: standing delay: 2000ms
⏱️ Setting sync timer for 2000ms
⏰ Timer fired, calling triggerSync
🔄 triggerSync called with target: standing
🔧 isBackupConfigured(): true
🚀 Starting backup process...
🎯 runBackup called with target: standing
🗄️ No Google URL configured, using Supabase directly...
🗄️ runSupabaseFallback called
📦 Importing supabase-backup module...
🔧 Checking if Supabase is configured...
✅ Supabase configured, running backup...
```

## Step 3: Check for Common Issues

### Issue 1: Environment Variables Not Loaded
**Symptom:** Console shows `undefined` for environment variables

**Solution:**
```bash
# Stop the development server
# Restart it
cd artifacts/vitainspire
pnpm start
```

### Issue 2: isBackupConfigured() Returns False
**Symptom:** Console shows `🔧 isBackupConfigured(): false`

**Solution:** The backup system thinks it's not configured. Check:
```javascript
// Run in browser console
const BACKUP_URL = process.env.EXPO_PUBLIC_BACKUP_URL || '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
console.log('Backup URL:', BACKUP_URL.length > 0);
console.log('Supabase URL:', SUPABASE_URL.length > 0);
console.log('Supabase Key:', SUPABASE_KEY.length > 0);
console.log('Should be configured:', (BACKUP_URL.length > 0) || (SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0));
```

### Issue 3: Supabase Import Fails
**Symptom:** Console shows `❌ Supabase import/execution failed`

**Solution:** Check if `@supabase/supabase-js` is installed:
```bash
cd artifacts/vitainspire
pnpm list @supabase/supabase-js
```

If not installed:
```bash
pnpm add @supabase/supabase-js
```

### Issue 4: Supabase Connection Fails
**Symptom:** Console shows `❌ Supabase backup failed`

**Solution:** Test direct connection:
```javascript
// Run in browser console
fetch('https://nithtycmdyvaftjdkptw.supabase.co/rest/v1/fields?select=count', {
  method: 'GET',
  headers: {
    'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }
})
.then(r => console.log('Connection:', r.ok ? 'SUCCESS' : 'FAILED', r.status))
.catch(e => console.log('Error:', e));
```

### Issue 5: Schema Mismatch
**Symptom:** Supabase connection works but data insertion fails

**Solution:** Run the migration script in Supabase dashboard:
1. Go to Supabase dashboard
2. Open SQL Editor
3. Run `supabase-migration-standing-zones.sql`

## Step 4: Manual Test

Try saving data manually through the app:

1. **Create a new field**
2. **Go to Standing stage**
3. **Fill in Zone A photos**
4. **Continue through Zone B and C**
5. **Save the field**
6. **Wait 3 seconds**
7. **Check browser console for logs**
8. **Check Supabase dashboard for data**

## Step 5: Direct Supabase Test

If the app isn't working, test Supabase directly:

```javascript
// Run in browser console
async function testDirectInsert() {
  const testField = {
    code: 'DIRECT-TEST-' + Date.now(),
    label: 'Direct Test Field',
    location_code: 'TEST',
    state: 'Test State',
    district: 'Test District',
    latitude: 12.9716,
    longitude: 77.5946,
    created_at: new Date().toISOString()
  };
  
  const response = await fetch('https://nithtycmdyvaftjdkptw.supabase.co/rest/v1/fields', {
    method: 'POST',
    headers: {
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(testField)
  });
  
  console.log('Direct insert:', response.ok ? 'SUCCESS' : 'FAILED', response.status);
  if (!response.ok) {
    console.log('Error:', await response.text());
  }
}

testDirectInsert();
```

## Most Likely Issues (in order):

1. **Environment variables not loaded** (80% probability)
   - Solution: Restart dev server

2. **isBackupConfigured() returns false** (15% probability)
   - Solution: Already fixed in latest code

3. **Supabase schema not updated** (3% probability)
   - Solution: Run migration script

4. **Network/CORS issues** (2% probability)
   - Solution: Check browser network tab

## Quick Fix Checklist

- [ ] Restart development server
- [ ] Check browser console for environment variables
- [ ] Use BackupTestComponent to test
- [ ] Check for error messages in console
- [ ] Run migration script in Supabase
- [ ] Test direct Supabase connection
- [ ] Verify data appears in Supabase dashboard

## Getting Help

If none of these work, provide:
1. Screenshot of browser console after using BackupTestComponent
2. Screenshot of Supabase dashboard (fields table)
3. Output of environment variable check
4. Any error messages from console