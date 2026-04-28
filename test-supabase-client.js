/**
 * Simple client-side test for Supabase connection
 * Run this in your browser console or as a Node.js script
 */

// Supabase configuration
const SUPABASE_URL = 'https://nithtycmdyvaftjdkptw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdGh0eWNtZHl2YWZ0amRrcHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjYwOTIsImV4cCI6MjA5Mjk0MjA5Mn0.QJgWdv1nusvCJC-X-mv9l-QhWAvBewD4H85v6ZzE1Eg';

// Simple Supabase client (without SDK)
class SimpleSupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.url}/rest/v1/fields?select=count`, {
        method: 'GET',
        headers: this.headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Database connection successful');
        console.log('📊 Current fields count:', data.length);
        return { success: true, data };
      } else {
        const error = await response.text();
        console.error('❌ Database connection failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      return { success: false, error: error.message };
    }
  }

  async insertTestField() {
    const testField = {
      code: `TEST-${Date.now()}`,
      label: 'Test Field from Client',
      location_code: 'TEST-LOC',
      state: 'Test State',
      district: 'Test District',
      latitude: 12.9716,
      longitude: 77.5946,
      created_at: new Date().toISOString()
    };

    try {
      const response = await fetch(`${this.url}/rest/v1/fields`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(testField)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Test field inserted successfully:', data);
        return { success: true, data };
      } else {
        const error = await response.text();
        console.error('❌ Field insertion failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Insert error:', error);
      return { success: false, error: error.message };
    }
  }

  async insertTestCapture(fieldCode) {
    const testCapture = {
      id: `capture-${Date.now()}`,
      field_code: fieldCode,
      stage: 'standing',
      created_at: new Date().toISOString(),
      plant_photo_url: '',
      leaf_photo_url: '',
      cob_photo_url: ''
    };

    try {
      const response = await fetch(`${this.url}/rest/v1/field_captures`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(testCapture)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Test capture inserted successfully:', data);
        return { success: true, data };
      } else {
        const error = await response.text();
        console.error('❌ Capture insertion failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Capture insert error:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllFields() {
    try {
      const response = await fetch(`${this.url}/rest/v1/fields?select=*`, {
        method: 'GET',
        headers: this.headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 All fields:', data);
        return { success: true, data };
      } else {
        const error = await response.text();
        console.error('❌ Failed to fetch fields:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllCaptures() {
    try {
      const response = await fetch(`${this.url}/rest/v1/field_captures?select=*`, {
        method: 'GET',
        headers: this.headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 All captures:', data);
        return { success: true, data };
      } else {
        const error = await response.text();
        console.error('❌ Failed to fetch captures:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Test functions
async function runFullTest() {
  console.log('🧪 Starting Supabase client test...\n');
  
  const client = new SimpleSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Test 1: Connection
  console.log('1️⃣ Testing connection...');
  const connectionResult = await client.testConnection();
  if (!connectionResult.success) {
    console.log('❌ Test failed at connection step');
    return;
  }
  
  // Test 2: Insert field
  console.log('\n2️⃣ Inserting test field...');
  const fieldResult = await client.insertTestField();
  if (!fieldResult.success) {
    console.log('❌ Test failed at field insertion step');
    return;
  }
  
  const fieldCode = fieldResult.data[0].code;
  
  // Test 3: Insert capture
  console.log('\n3️⃣ Inserting test capture...');
  const captureResult = await client.insertTestCapture(fieldCode);
  if (!captureResult.success) {
    console.log('❌ Test failed at capture insertion step');
    return;
  }
  
  // Test 4: Fetch all data
  console.log('\n4️⃣ Fetching all fields...');
  await client.getAllFields();
  
  console.log('\n5️⃣ Fetching all captures...');
  await client.getAllCaptures();
  
  console.log('\n🎉 All tests completed successfully!');
  console.log('📊 Check your Supabase dashboard:');
  console.log('   - Go to: https://nithtycmdyvaftjdkptw.supabase.co');
  console.log('   - Navigate to: Table Editor');
  console.log('   - Check tables: fields, field_captures');
  console.log('   - You should see the test data that was just inserted');
}

// Quick connection test
async function quickTest() {
  console.log('⚡ Quick connection test...');
  const client = new SimpleSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await client.testConnection();
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleSupabaseClient, runFullTest, quickTest };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected');
  console.log('💡 Run quickTest() for a simple connection test');
  console.log('💡 Run runFullTest() for a complete test with data insertion');
  
  // Make functions available globally
  window.quickTest = quickTest;
  window.runFullTest = runFullTest;
  window.SimpleSupabaseClient = SimpleSupabaseClient;
}

// Auto-run if in Node.js and called directly
if (typeof require !== 'undefined' && require.main === module) {
  runFullTest().catch(console.error);
}