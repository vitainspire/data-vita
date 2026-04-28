-- Migration: Update standing fields to use three zones
-- This migration updates the field_captures table to support three zones for standing fields

-- Add new zone columns for standing fields
ALTER TABLE field_captures 
ADD COLUMN IF NOT EXISTS zone_a_leaf_photo_url TEXT,
ADD COLUMN IF NOT EXISTS zone_b_leaf_photo_url TEXT,
ADD COLUMN IF NOT EXISTS zone_c_leaf_photo_url TEXT;

-- Note: The zone_a_plant_photo_url, zone_a_cob_photo_url, etc. columns already exist
-- from the cutting fields structure, so we can reuse them for standing fields

-- Optional: If you want to migrate existing standing field data
-- (This assumes you have existing standing fields with the old structure)
-- UPDATE field_captures 
-- SET 
--   zone_a_plant_photo_url = plant_photo_url,
--   zone_a_leaf_photo_url = leaf_photo_url,
--   zone_a_cob_photo_url = cob_photo_url
-- WHERE stage = 'standing' AND plant_photo_url IS NOT NULL;

-- Optional: Remove old standing field columns after migration
-- ALTER TABLE field_captures 
-- DROP COLUMN IF EXISTS plant_photo_url,
-- DROP COLUMN IF EXISTS leaf_photo_url,
-- DROP COLUMN IF EXISTS cob_photo_url;

-- Verify the migration
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'field_captures' 
AND column_name LIKE '%photo_url%'
ORDER BY column_name;