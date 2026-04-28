/**
 * Test script to generate sample data and test Supabase backup
 * Run this to verify the backup system is working
 */

import { runSupabaseBackup } from '../lib/supabase-backup';
import { 
  addField, 
  saveField, 
  saveHarvestField, 
  saveHarvestRecord, 
  savePostHarvestBatch,
  makeId 
} from '../lib/storage';

async function generateTestData() {
  console.log('🧪 Generating test data...');
  
  try {
    // 1. Create a test field
    const fieldCode = `TEST-${Date.now()}`;
    await addField({
      code: fieldCode,
      label: 'Test Field Alpha',
      locationCode: 'AP-KNL',
      state: 'Andhra Pradesh',
      district: 'Kurnool',
      gps: {
        latitude: 15.8281,
        longitude: 78.0373
      },
      createdAt: Date.now()
    });
    console.log('✅ Field created:', fieldCode);

    // 2. Create standing field capture
    await saveField({
      id: makeId(),
      fieldCode,
      stage: 'standing',
      createdAt: Date.now(),
      plantPhoto: null, // In real app, this would be a photo URI
      leafPhoto: null,
      cobPhoto: null
    });
    console.log('✅ Standing capture saved');

    // 3. Create cutting field capture
    await saveField({
      id: makeId(),
      fieldCode,
      stage: 'cutting',
      createdAt: Date.now(),
      zoneA: {
        plantPhoto: null,
        cobPhoto: null,
        height: 'Tall',
        color: 'Dark',
        density: 'Dense'
      },
      zoneB: {
        plantPhoto: null,
        cobPhoto: null,
        height: 'Medium',
        color: 'Light',
        density: 'Normal'
      },
      zoneC: {
        plantPhoto: null,
        cobPhoto: null,
        height: 'Short',
        color: 'Yellow',
        density: 'Sparse'
      },
      harvestMethod: 'Manual',
      cropCondition: 'Green',
      cuttingHeight: 'Medium',
      lodging: 'None'
    });
    console.log('✅ Cutting capture saved');

    // 4. Create chopped field capture
    await saveField({
      id: makeId(),
      fieldCode,
      stage: 'chopped',
      createdAt: Date.now(),
      photo: null,
      chopLength: 'Medium',
      uniformity: 'Uniform',
      materialQuality: 'Good',
      moisture: 'Normal'
    });
    console.log('✅ Chopped capture saved');

    // 5. Create harvest visit
    const harvestId = makeId();
    await saveHarvestField({
      id: harvestId,
      createdAt: Date.now(),
      fieldArea: '2.5',
      cropType: 'Maize',
      health: {
        plantStand: 'Good',
        pest: 'Low',
        disease: 'None',
        rainfall: 'Adequate'
      },
      photos: {
        overview: null,
        leaf: null,
        cob: null
      },
      farmerPhoto: null
    });
    console.log('✅ Harvest visit saved');

    // 6. Create harvest record
    await saveHarvestRecord({
      id: makeId(),
      createdAt: Date.now(),
      harvestFieldId: harvestId,
      weightKg: '150.5',
      output: 'Fresh Corn'
    });
    console.log('✅ Harvest record saved');

    // 7. Create post-harvest batch
    await savePostHarvestBatch({
      id: makeId(),
      createdAt: Date.now(),
      harvestFieldId: harvestId,
      batchName: 'Test Batch Alpha',
      photos: {
        storage: null,
        crossSection: null,
        sample: null,
        texture: null
      },
      ph: '6.5',
      smell: 'Sweet',
      mold: 'None'
    });
    console.log('✅ Post-harvest batch saved');

    console.log('🎉 All test data generated successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error generating test data:', error);
    return false;
  }
}

async function testSupabaseBackup() {
  console.log('🚀 Testing Supabase backup...');
  
  try {
    const result = await runSupabaseBackup();
    
    if (result.ok) {
      console.log('✅ Supabase backup successful!');
      console.log('📊 Check your Supabase dashboard:');
      console.log('   - Database → Table Editor → View your data');
      console.log('   - Storage → images → View uploaded images');
      return true;
    } else {
      console.error('❌ Supabase backup failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase backup error:', error);
    return false;
  }
}

async function runTest() {
  console.log('🧪 Starting Supabase backup test...\n');
  
  // Step 1: Generate test data
  const dataGenerated = await generateTestData();
  if (!dataGenerated) {
    console.log('❌ Test failed: Could not generate test data');
    return;
  }
  
  console.log('\n⏳ Waiting 2 seconds before backup...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Test Supabase backup
  const backupSuccessful = await testSupabaseBackup();
  
  if (backupSuccessful) {
    console.log('\n🎉 Test completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Check the following tables for data:');
    console.log('      - fields');
    console.log('      - field_captures');
    console.log('      - harvest_visits');
    console.log('      - harvest_records');
    console.log('      - post_harvest_batches');
    console.log('   3. Verify the data matches what was generated');
  } else {
    console.log('\n❌ Test failed: Backup unsuccessful');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check your Supabase environment variables');
    console.log('   2. Verify your Supabase project is active');
    console.log('   3. Ensure the SQL schema was run correctly');
    console.log('   4. Check network connectivity');
  }
}

// Export for use in other scripts
export { generateTestData, testSupabaseBackup, runTest };

// Run test if this file is executed directly
if (require.main === module) {
  runTest().catch(console.error);
}