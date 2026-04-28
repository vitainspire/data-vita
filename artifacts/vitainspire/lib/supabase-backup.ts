import { createClient } from '@supabase/supabase-js';
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

import {
  Field,
  StandingField,
  CuttingField,
  ChoppedField,
  HarvestField,
  HarvestRecord,
  PostHarvestBatch,
  getFarmerPhoto,
  getFieldList,
  getFields,
  getHarvestFields,
  getHarvestRecords,
  getPostHarvestBatches,
} from "./storage";

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

// ─── Image Upload to Supabase Storage ────────────────────────

async function uriToBlob(uri: string): Promise<Blob | null> {
  if (!uri) return null;
  
  try {
    if (Platform.OS === "web") {
      if (uri.startsWith("data:")) {
        const response = await fetch(uri);
        return response.blob();
      }
      const response = await fetch(uri);
      return response.blob();
    }
    
    // For React Native
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/jpeg' });
  } catch (error) {
    console.error("Error converting URI to blob:", error);
    return null;
  }
}

async function uploadImageToSupabase(
  uri: string | null,
  fileName: string,
  bucket: string = "images"
): Promise<string> {
  if (!uri) return "";
  
  const client = getSupabaseClient();
  if (!client) {
    console.warn("Supabase not configured");
    return "";
  }
  
  try {
    const blob = await uriToBlob(uri);
    if (!blob) return "";
    
    // Check if file already exists
    const { data: existingFile } = await client.storage
      .from(bucket)
      .list('', { search: fileName });
    
    if (existingFile && existingFile.length > 0) {
      const { data } = client.storage
        .from(bucket)
        .getPublicUrl(fileName);
      return data.publicUrl;
    }
    
    // Upload new file
    const { data, error } = await client.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error(`Upload error for ${fileName}:`, error);
      return "";
    }
    
    // Get public URL
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Failed to upload ${fileName}:`, error);
    return "";
  }
}

// ─── Database Operations ─────────────────────────────────────

async function upsertFields(fields: Field[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || fields.length === 0) return;
  
  const { error } = await client
    .from('fields')
    .upsert(fields.map(f => ({
      code: f.code,
      label: f.label,
      location_code: f.locationCode,
      state: f.state,
      district: f.district,
      latitude: f.gps?.latitude,
      longitude: f.gps?.longitude,
      created_at: new Date(f.createdAt).toISOString(),
    })), { onConflict: 'code' });
  
  if (error) {
    console.error("Error upserting fields:", error);
    throw error;
  }
}

async function upsertStandingFields(fields: StandingField[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || fields.length === 0) return;
  
  // Upload images first
  const fieldsWithUrls = await Promise.all(
    fields.map(async (f) => {
      const fieldId = `${f.fieldCode}_standing`;
      const [plantUrl, leafUrl, cobUrl] = await Promise.all([
        uploadImageToSupabase(f.plantPhoto, `${fieldId}_plant.jpg`),
        uploadImageToSupabase(f.leafPhoto, `${fieldId}_leaf.jpg`),
        uploadImageToSupabase(f.cobPhoto, `${fieldId}_cob.jpg`),
      ]);
      
      return {
        id: f.id,
        field_code: f.fieldCode,
        stage: f.stage,
        created_at: new Date(f.createdAt).toISOString(),
        plant_photo_url: plantUrl,
        leaf_photo_url: leafUrl,
        cob_photo_url: cobUrl,
      };
    })
  );
  
  const { error } = await client
    .from('field_captures')
    .upsert(fieldsWithUrls, { onConflict: 'id' });
  
  if (error) {
    console.error("Error upserting standing fields:", error);
    throw error;
  }
}

async function upsertCuttingFields(fields: CuttingField[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || fields.length === 0) return;
  
  const fieldsWithUrls = await Promise.all(
    fields.map(async (f) => {
      const fieldId = `${f.fieldCode}_cutting`;
      const [
        zaPlantUrl, zaCobUrl,
        zbPlantUrl, zbCobUrl,
        zcPlantUrl, zcCobUrl
      ] = await Promise.all([
        uploadImageToSupabase(f.zoneA?.plantPhoto, `${fieldId}_zoneA_plant.jpg`),
        uploadImageToSupabase(f.zoneA?.cobPhoto, `${fieldId}_zoneA_cob.jpg`),
        uploadImageToSupabase(f.zoneB?.plantPhoto, `${fieldId}_zoneB_plant.jpg`),
        uploadImageToSupabase(f.zoneB?.cobPhoto, `${fieldId}_zoneB_cob.jpg`),
        uploadImageToSupabase(f.zoneC?.plantPhoto, `${fieldId}_zoneC_plant.jpg`),
        uploadImageToSupabase(f.zoneC?.cobPhoto, `${fieldId}_zoneC_cob.jpg`),
      ]);
      
      return {
        id: f.id,
        field_code: f.fieldCode,
        stage: f.stage,
        created_at: new Date(f.createdAt).toISOString(),
        // Zone A
        zone_a_plant_photo_url: zaPlantUrl,
        zone_a_cob_photo_url: zaCobUrl,
        zone_a_height: f.zoneA?.height,
        zone_a_color: f.zoneA?.color,
        zone_a_density: f.zoneA?.density,
        // Zone B
        zone_b_plant_photo_url: zbPlantUrl,
        zone_b_cob_photo_url: zbCobUrl,
        zone_b_height: f.zoneB?.height,
        zone_b_color: f.zoneB?.color,
        zone_b_density: f.zoneB?.density,
        // Zone C
        zone_c_plant_photo_url: zcPlantUrl,
        zone_c_cob_photo_url: zcCobUrl,
        zone_c_height: f.zoneC?.height,
        zone_c_color: f.zoneC?.color,
        zone_c_density: f.zoneC?.density,
        // New cutting fields
        harvest_method: f.harvestMethod,
        crop_condition: f.cropCondition,
        cutting_height: f.cuttingHeight,
        lodging: f.lodging,
      };
    })
  );
  
  const { error } = await client
    .from('field_captures')
    .upsert(fieldsWithUrls, { onConflict: 'id' });
  
  if (error) {
    console.error("Error upserting cutting fields:", error);
    throw error;
  }
}

async function upsertChoppedFields(fields: ChoppedField[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || fields.length === 0) return;
  
  const fieldsWithUrls = await Promise.all(
    fields.map(async (f) => {
      const fieldId = `${f.fieldCode}_chopped`;
      const photoUrl = await uploadImageToSupabase(f.photo, `${fieldId}_photo.jpg`);
      
      return {
        id: f.id,
        field_code: f.fieldCode,
        stage: f.stage,
        created_at: new Date(f.createdAt).toISOString(),
        photo_url: photoUrl,
        chop_length: f.chopLength,
        uniformity: f.uniformity,
        material_quality: f.materialQuality,
        moisture: f.moisture,
      };
    })
  );
  
  const { error } = await client
    .from('field_captures')
    .upsert(fieldsWithUrls, { onConflict: 'id' });
  
  if (error) {
    console.error("Error upserting chopped fields:", error);
    throw error;
  }
}

async function upsertHarvestFields(fields: HarvestField[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || fields.length === 0) return;
  
  // Upload farmer photo once
  const farmerPhotoUri = await getFarmerPhoto();
  const farmerPhotoUrl = await uploadImageToSupabase(farmerPhotoUri, "farmer_profile.jpg");
  
  const fieldsWithUrls = await Promise.all(
    fields.map(async (f) => {
      const visitId = f.id.substring(0, 8);
      const [overviewUrl, leafUrl, cobUrl] = await Promise.all([
        uploadImageToSupabase(f.photos?.overview, `harvest_${visitId}_overview.jpg`),
        uploadImageToSupabase(f.photos?.leaf, `harvest_${visitId}_leaf.jpg`),
        uploadImageToSupabase(f.photos?.cob, `harvest_${visitId}_cob.jpg`),
      ]);
      
      return {
        id: f.id,
        created_at: new Date(f.createdAt).toISOString(),
        field_area: f.fieldArea,
        crop_type: f.cropType,
        plant_stand: f.health?.plantStand,
        pest_pressure: f.health?.pest,
        disease: f.health?.disease,
        rainfall: f.health?.rainfall,
        farmer_photo_url: farmerPhotoUrl,
        overview_photo_url: overviewUrl,
        leaf_photo_url: leafUrl,
        cob_photo_url: cobUrl,
      };
    })
  );
  
  const { error } = await client
    .from('harvest_visits')
    .upsert(fieldsWithUrls, { onConflict: 'id' });
  
  if (error) {
    console.error("Error upserting harvest fields:", error);
    throw error;
  }
}

async function upsertHarvestRecords(records: HarvestRecord[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || records.length === 0) return;
  
  const { error } = await client
    .from('harvest_records')
    .upsert(records.map(r => ({
      id: r.id,
      created_at: new Date(r.createdAt).toISOString(),
      harvest_field_id: r.harvestFieldId,
      weight_kg: parseFloat(r.weightKg) || 0,
      output: r.output,
    })), { onConflict: 'id' });
  
  if (error) {
    console.error("Error upserting harvest records:", error);
    throw error;
  }
}

async function upsertPostHarvestBatches(batches: PostHarvestBatch[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || batches.length === 0) return;
  
  const batchesWithUrls = await Promise.all(
    batches.map(async (b) => {
      const batchId = b.id.substring(0, 8);
      const [storageUrl, crossSectionUrl, sampleUrl, textureUrl] = await Promise.all([
        uploadImageToSupabase(b.photos?.storage, `postharvest_${batchId}_storage.jpg`),
        uploadImageToSupabase(b.photos?.crossSection, `postharvest_${batchId}_cross_section.jpg`),
        uploadImageToSupabase(b.photos?.sample, `postharvest_${batchId}_sample.jpg`),
        uploadImageToSupabase(b.photos?.texture, `postharvest_${batchId}_texture.jpg`),
      ]);
      
      return {
        id: b.id,
        created_at: new Date(b.createdAt).toISOString(),
        harvest_field_id: b.harvestFieldId,
        batch_name: b.batchName,
        ph: parseFloat(b.ph) || 0,
        smell: b.smell,
        mold: b.mold,
        storage_photo_url: storageUrl,
        cross_section_photo_url: crossSectionUrl,
        sample_photo_url: sampleUrl,
        texture_photo_url: textureUrl,
      };
    })
  );
  
  const { error } = await client
    .from('post_harvest_batches')
    .upsert(batchesWithUrls, { onConflict: 'id' });
  
  if (error) {
    console.error("Error upserting post harvest batches:", error);
    throw error;
  }
}

// ─── Main Backup Function ────────────────────────────────────

export async function runSupabaseBackup(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase not configured" };
  }
  
  try {
    console.log("Starting Supabase backup...");
    
    // Get all data
    const [
      fieldList,
      allFields,
      harvestFields,
      harvestRecords,
      postHarvestBatches
    ] = await Promise.all([
      getFieldList(),
      getFields(),
      getHarvestFields(),
      getHarvestRecords(),
      getPostHarvestBatches()
    ]);
    
    // Separate field captures by stage
    const standingFields = allFields.filter((f): f is StandingField => f.stage === "standing");
    const cuttingFields = allFields.filter((f): f is CuttingField => f.stage === "cutting");
    const choppedFields = allFields.filter((f): f is ChoppedField => f.stage === "chopped");
    
    // Upload all data
    await Promise.all([
      upsertFields(fieldList),
      upsertStandingFields(standingFields),
      upsertCuttingFields(cuttingFields),
      upsertChoppedFields(choppedFields),
      upsertHarvestFields(harvestFields),
      upsertHarvestRecords(harvestRecords),
      upsertPostHarvestBatches(postHarvestBatches)
    ]);
    
    console.log("Supabase backup completed successfully");
    console.log(`Backed up:
      - ${fieldList.length} fields
      - ${standingFields.length} standing captures
      - ${cuttingFields.length} cutting captures
      - ${choppedFields.length} chopped captures
      - ${harvestFields.length} harvest visits
      - ${harvestRecords.length} harvest records
      - ${postHarvestBatches.length} post-harvest batches`);
    
    return { ok: true };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Supabase backup failed:", errorMsg);
    return { ok: false, error: errorMsg };
  }
}

// ─── Test Function ────────────────────────────────────────────

export async function testSupabaseConnection(): Promise<{ ok: boolean; error?: string; data?: any }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: "Supabase not configured" };
  }
  
  try {
    // Test database connection
    const { data, error } = await client.from('fields').select('count');
    
    if (error) {
      return { ok: false, error: `Database connection failed: ${error.message}` };
    }
    
    // Test storage connection
    const { data: buckets, error: storageError } = await client.storage.listBuckets();
    
    if (storageError) {
      return { ok: false, error: `Storage connection failed: ${storageError.message}` };
    }
    
    return { 
      ok: true, 
      data: { 
        database: 'Connected',
        storage: 'Connected',
        buckets: buckets?.map(b => b.name) || []
      }
    };
  } catch (error) {
    return { ok: false, error: `Connection test failed: ${error}` };
  }
}

export async function createTestData(): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: "Supabase not configured" };
  }
  
  try {
    const testFieldCode = `TEST-${Date.now()}`;
    
    // Insert test field
    const { error: fieldError } = await client
      .from('fields')
      .insert({
        code: testFieldCode,
        label: 'Test Field',
        location_code: 'TEST-LOC',
        state: 'Test State',
        district: 'Test District',
        latitude: 12.9716,
        longitude: 77.5946,
        created_at: new Date().toISOString(),
      });
    
    if (fieldError) {
      return { ok: false, error: `Failed to insert test field: ${fieldError.message}` };
    }
    
    // Insert test field capture
    const { error: captureError } = await client
      .from('field_captures')
      .insert({
        id: `test-${Date.now()}`,
        field_code: testFieldCode,
        stage: 'standing',
        created_at: new Date().toISOString(),
        plant_photo_url: '',
        leaf_photo_url: '',
        cob_photo_url: '',
      });
    
    if (captureError) {
      return { ok: false, error: `Failed to insert test capture: ${captureError.message}` };
    }
    
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Test data creation failed: ${error}` };
  }
}