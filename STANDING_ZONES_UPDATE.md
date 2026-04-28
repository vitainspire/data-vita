# Standing Fields Three Zones Update

## Changes Made

### 1. Updated Data Structure
- **StandingField type**: Now uses three zones (A, B, C) instead of single photos
- **ZoneData type**: Added `leafPhoto` field to support leaf photos in all zones
- **Consistent structure**: Standing and cutting fields now use the same zone-based approach

### 2. Updated UI Component
- **Standing screen**: Now uses step-by-step zone capture like cutting screen
- **Three zones**: Zone A (best area), Zone B (average area), Zone C (weakest area)
- **Per-zone photos**: Each zone captures plant, leaf, and cob photos
- **Step navigation**: Users progress through zones with "Next Zone" button

### 3. Updated Backup System
- **Google Apps Script**: Updated to export 9 photo columns (3 zones × 3 photos each)
- **Supabase backup**: Updated to store photos in zone-specific columns
- **Schema consistency**: Both backup systems now handle the same data structure

### 4. Updated Database Schema
- **New columns**: Added `zone_a_leaf_photo_url`, `zone_b_leaf_photo_url`, `zone_c_leaf_photo_url`
- **Unified structure**: Standing and cutting fields use the same zone columns
- **Migration script**: Created to update existing databases

## New Standing Field Structure

```typescript
export type StandingField = {
  id: string;
  fieldCode: string;
  stage: "standing";
  createdAt: number;
  zoneA: ZoneData;
  zoneB: ZoneData;
  zoneC: ZoneData;
};

export type ZoneData = {
  plantPhoto: string | null;
  leafPhoto: string | null;  // Added for standing fields
  cobPhoto: string | null;
  height: string | null;
  color: string | null;
  density: string | null;
};
```

## User Experience Changes

### Before:
- Single screen with 3 photo slots
- Capture plant, leaf, and cob photos once

### After:
- Three-step process (Zone A → Zone B → Zone C)
- Each zone captures plant, leaf, and cob photos
- More comprehensive field documentation
- Consistent with cutting stage workflow

## Database Changes

### Google Apps Script Export:
```
Field Code | Label | Captured At | Zone A Plant | Zone A Leaf | Zone A Cob | Zone B Plant | Zone B Leaf | Zone B Cob | Zone C Plant | Zone C Leaf | Zone C Cob
```

### Supabase Schema:
```sql
-- Standing fields now use zone columns
zone_a_plant_photo_url TEXT,
zone_a_leaf_photo_url TEXT,
zone_a_cob_photo_url TEXT,
zone_b_plant_photo_url TEXT,
zone_b_leaf_photo_url TEXT,
zone_b_cob_photo_url TEXT,
zone_c_plant_photo_url TEXT,
zone_c_leaf_photo_url TEXT,
zone_c_cob_photo_url TEXT,
```

## Migration Steps

1. **Update Supabase schema**: Run `supabase-migration-standing-zones.sql`
2. **Test the app**: Use the BackupTestComponent to verify new structure
3. **Verify backups**: Check that data appears correctly in both Google Sheets and Supabase

## Files Modified

- `artifacts/vitainspire/lib/storage.ts` - Updated StandingField and ZoneData types
- `artifacts/vitainspire/app/field/standing.tsx` - Complete UI rewrite with zones
- `artifacts/vitainspire/lib/backup.ts` - Updated Google backup for zones
- `artifacts/vitainspire/lib/supabase-backup.ts` - Updated Supabase backup for zones
- `artifacts/vitainspire/components/BackupTestComponent.tsx` - Updated test data
- `supabase-schema.sql` - Updated schema structure
- `supabase-migration-standing-zones.sql` - Migration script

## Benefits

1. **Consistency**: Standing and cutting stages now work the same way
2. **Better data**: Three zones provide more comprehensive field coverage
3. **User familiarity**: Same workflow across all field stages
4. **Data quality**: More detailed documentation of field conditions

The standing stage now provides the same level of detail as the cutting stage, with comprehensive three-zone documentation for better field analysis.