# Supabase Backup Setup Guide

This guide explains how to set up Supabase as a reliable backup system for your VitaInspire data and images.

## Why Supabase?

Supabase provides:
- ✅ **Reliable PostgreSQL database** for structured data
- ✅ **Built-in file storage** for images
- ✅ **Real-time capabilities** for data synchronization
- ✅ **Automatic backups** and point-in-time recovery
- ✅ **Free tier** with generous limits
- ✅ **No Google Cloud Platform dependencies**

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: VitaInspire Data Backup
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be ready (2-3 minutes)

### Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste it into the SQL editor
4. Click **Run** to create all tables and policies

### Step 3: Configure Storage

1. Go to **Storage** in your Supabase dashboard
2. The `images` bucket should already be created by the SQL script
3. If not, create a new bucket called `images`
4. Make it **public** for easy access to images
5. Set up storage policies (already included in the SQL script)

### Step 4: Get API Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### Step 5: Configure Environment Variables

Add these to your app's environment variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 6: Install Dependencies

The Supabase client is already added to your `package.json`. Run:

```bash
pnpm install
```

### Step 7: Test the Setup

1. Build and run your app
2. Create some test data (field, harvest, etc.)
3. Check your Supabase dashboard:
   - **Database** → **Table Editor** to see data
   - **Storage** → **images** to see uploaded photos

## How It Works

### Automatic Backup
- Every time you save data in the app, it automatically schedules a Supabase backup
- Backup runs in the background after a 5-second delay
- No user interaction required

### Data Structure
The system creates these tables:

1. **fields** - Field registry with GPS coordinates
2. **field_captures** - Standing, cutting, and chopped data
3. **harvest_visits** - Harvest field visit data
4. **harvest_records** - Weight and output records
5. **post_harvest_batches** - Post-harvest processing data

### Image Storage
- All images are uploaded to Supabase Storage
- Images are organized by type and field/visit ID
- Public URLs are stored in the database
- Duplicate images are automatically detected

### Data Views
The system includes helpful views:
- **field_summary** - Overview of all fields with capture counts
- **harvest_summary** - Harvest data with totals and batch counts

## Monitoring

### Check Backup Status
1. Go to your Supabase dashboard
2. **Database** → **Table Editor**
3. Check recent entries in each table
4. **Storage** → **images** to verify image uploads

### View Logs
1. **Logs** → **Database** for SQL queries
2. **Logs** → **Storage** for file uploads
3. Check your app console for backup messages

## Benefits

### Data Security
- ✅ **Automatic backups** every 24 hours
- ✅ **Point-in-time recovery** up to 7 days (free tier)
- ✅ **Encrypted at rest** and in transit
- ✅ **Multiple data centers** for redundancy

### Performance
- ✅ **Fast PostgreSQL database** with indexing
- ✅ **CDN-backed storage** for quick image access
- ✅ **Connection pooling** for efficient database use
- ✅ **Automatic scaling** based on usage

### Cost
- ✅ **Free tier includes**:
  - 500MB database storage
  - 1GB file storage
  - 2GB bandwidth per month
  - 50,000 monthly active users
- ✅ **Predictable pricing** for higher usage
- ✅ **No surprise charges** like Google Cloud

## Troubleshooting

### Common Issues

**1. "Supabase not configured" error**
- Check environment variables are set correctly
- Verify project URL and API key
- Ensure variables start with `EXPO_PUBLIC_`

**2. Database connection errors**
- Check your project is active in Supabase dashboard
- Verify the database password is correct
- Check network connectivity

**3. Image upload failures**
- Verify storage bucket exists and is public
- Check storage policies allow uploads
- Ensure images are valid format (JPEG/PNG)

**4. Permission denied errors**
- Check Row Level Security policies
- Verify API key has correct permissions
- Check table policies allow insert/update

### Debug Steps

1. **Check Supabase Dashboard**
   - Go to **Logs** to see recent activity
   - Check **Database** → **Table Editor** for data
   - Verify **Storage** → **images** for uploads

2. **Check App Console**
   - Look for Supabase backup messages
   - Check for error logs during save operations
   - Verify environment variables are loaded

3. **Test Connection**
   ```javascript
   import { createClient } from '@supabase/supabase-js';
   
   const supabase = createClient(
     process.env.EXPO_PUBLIC_SUPABASE_URL,
     process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
   );
   
   // Test connection
   const { data, error } = await supabase.from('fields').select('count');
   console.log('Connection test:', { data, error });
   ```

## Migration from Google Services

If you were using Google Sheets/Drive backup:

1. **Set up Supabase** following this guide
2. **Keep both systems** running initially
3. **Test Supabase backup** with new data
4. **Export existing Google data** if needed
5. **Disable Google backup** once confident in Supabase

## Advanced Configuration

### Custom Policies
You can modify the Row Level Security policies for more granular access control:

```sql
-- Example: Restrict access by user
CREATE POLICY "Users can only see their own data" ON fields
  FOR SELECT USING (auth.uid() = user_id);
```

### Backup Scheduling
The current system backs up after every save. To change this:

```typescript
// In supabase-backup.ts, modify scheduleSupabaseBackup()
setTimeout(async () => {
  await runSupabaseBackup();
}, 30000); // Change to 30 seconds
```

### Custom Storage Buckets
To organize images differently:

```typescript
// Upload to different buckets by type
await uploadImageToSupabase(uri, fileName, "field-photos");
await uploadImageToSupabase(uri, fileName, "harvest-photos");
```

## Support

- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **Community Support**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Status Page**: [status.supabase.com](https://status.supabase.com)

This backup system provides a robust, scalable alternative to Google services with better reliability and predictable costs.