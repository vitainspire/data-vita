-- VitaInspire Supabase Database Schema
-- Run this in your Supabase SQL editor to create the required tables

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to images bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Fields registry table
CREATE TABLE fields (
    code TEXT PRIMARY KEY,
    label TEXT,
    location_code TEXT,
    state TEXT,
    district TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Field captures table (standing, cutting, chopped)
CREATE TABLE field_captures (
    id TEXT PRIMARY KEY,
    field_code TEXT NOT NULL REFERENCES fields(code) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('standing', 'cutting', 'chopped')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Zone A (used by standing and cutting)
    zone_a_plant_photo_url TEXT,
    zone_a_leaf_photo_url TEXT,
    zone_a_cob_photo_url TEXT,
    zone_a_height TEXT,
    zone_a_color TEXT,
    zone_a_density TEXT,
    
    -- Zone B (used by standing and cutting)
    zone_b_plant_photo_url TEXT,
    zone_b_leaf_photo_url TEXT,
    zone_b_cob_photo_url TEXT,
    zone_b_height TEXT,
    zone_b_color TEXT,
    zone_b_density TEXT,
    
    -- Zone C (used by standing and cutting)
    zone_c_plant_photo_url TEXT,
    zone_c_leaf_photo_url TEXT,
    zone_c_cob_photo_url TEXT,
    zone_c_height TEXT,
    zone_c_color TEXT,
    zone_c_density TEXT,
    
    -- Cutting fields - General
    harvest_method TEXT,
    crop_condition TEXT,
    cutting_height TEXT,
    lodging TEXT,
    
    -- Chopped fields
    photo_url TEXT,
    chop_length TEXT,
    uniformity TEXT,
    material_quality TEXT,
    moisture TEXT
);

-- Harvest visits table
CREATE TABLE harvest_visits (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    field_area TEXT,
    crop_type TEXT,
    plant_stand TEXT,
    pest_pressure TEXT,
    disease TEXT,
    rainfall TEXT,
    farmer_photo_url TEXT,
    overview_photo_url TEXT,
    leaf_photo_url TEXT,
    cob_photo_url TEXT
);

-- Harvest records table
CREATE TABLE harvest_records (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    harvest_field_id TEXT NOT NULL REFERENCES harvest_visits(id) ON DELETE CASCADE,
    weight_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    output TEXT
);

-- Post harvest batches table
CREATE TABLE post_harvest_batches (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    harvest_field_id TEXT NOT NULL REFERENCES harvest_visits(id) ON DELETE CASCADE,
    batch_name TEXT NOT NULL,
    ph DECIMAL(4, 2) DEFAULT 0,
    smell TEXT,
    mold TEXT,
    storage_photo_url TEXT,
    cross_section_photo_url TEXT,
    sample_photo_url TEXT,
    texture_photo_url TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_field_captures_field_code ON field_captures(field_code);
CREATE INDEX idx_field_captures_stage ON field_captures(stage);
CREATE INDEX idx_field_captures_created_at ON field_captures(created_at);
CREATE INDEX idx_harvest_records_harvest_field_id ON harvest_records(harvest_field_id);
CREATE INDEX idx_post_harvest_batches_harvest_field_id ON post_harvest_batches(harvest_field_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_captures_updated_at BEFORE UPDATE ON field_captures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_visits_updated_at BEFORE UPDATE ON harvest_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_records_updated_at BEFORE UPDATE ON harvest_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_harvest_batches_updated_at BEFORE UPDATE ON post_harvest_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional - for multi-tenant setup)
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_harvest_batches ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON fields FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON fields FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON fields FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON field_captures FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON field_captures FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON field_captures FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON harvest_visits FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON harvest_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON harvest_visits FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON harvest_records FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON harvest_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON harvest_records FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON post_harvest_batches FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON post_harvest_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON post_harvest_batches FOR UPDATE USING (true);

-- Create views for easier data access
CREATE VIEW field_summary AS
SELECT 
    f.code,
    f.label,
    f.location_code,
    f.state,
    f.district,
    f.latitude,
    f.longitude,
    f.created_at,
    COUNT(DISTINCT fc.id) as total_captures,
    COUNT(DISTINCT CASE WHEN fc.stage = 'standing' THEN fc.id END) as standing_captures,
    COUNT(DISTINCT CASE WHEN fc.stage = 'cutting' THEN fc.id END) as cutting_captures,
    COUNT(DISTINCT CASE WHEN fc.stage = 'chopped' THEN fc.id END) as chopped_captures
FROM fields f
LEFT JOIN field_captures fc ON f.code = fc.field_code
GROUP BY f.code, f.label, f.location_code, f.state, f.district, f.latitude, f.longitude, f.created_at;

CREATE VIEW harvest_summary AS
SELECT 
    hv.id,
    hv.created_at,
    hv.field_area,
    hv.crop_type,
    hv.plant_stand,
    hv.pest_pressure,
    hv.disease,
    hv.rainfall,
    COUNT(DISTINCT hr.id) as total_records,
    SUM(hr.weight_kg) as total_weight_kg,
    COUNT(DISTINCT phb.id) as total_batches
FROM harvest_visits hv
LEFT JOIN harvest_records hr ON hv.id = hr.harvest_field_id
LEFT JOIN post_harvest_batches phb ON hv.id = phb.harvest_field_id
GROUP BY hv.id, hv.created_at, hv.field_area, hv.crop_type, hv.plant_stand, hv.pest_pressure, hv.disease, hv.rainfall;

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;