# Backup System Setup Guide

This guide explains how to set up the separated Drive and Sheets backup system to resolve Google Apps Script service errors.

## Problem

The original backup system was experiencing "Service error: Drive" issues when trying to upload images and write sheet data in the same Google Apps Script. This was likely due to:

- Service quotas and rate limits
- Memory constraints in Google Apps Script
- Conflicts between Drive and Sheets API calls

## Solution

We've created **two separate Google Apps Scripts**:

1. **Drive Service** - Handles image uploads only
2. **Sheets Service** - Handles spreadsheet writing only

## Setup Instructions

### Step 1: Create Drive Service Script

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project called "VitaInspire Drive Service"
3. Replace the default code with the contents of `backup-drive-only.gs`
4. Deploy as a web app:
   - Click "Deploy" → "New deployment"
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Click "Deploy"
5. Copy the web app URL

### Step 2: Create Sheets Service Script

1. Create another new project called "VitaInspire Sheets Service"
2. Replace the default code with the contents of `backup-sheets-only.gs`
3. Deploy as a web app (same steps as above)
4. Copy the web app URL

### Step 3: Configure Environment Variables

Add these environment variables to your app:

```bash
# Enable separated services
EXPO_PUBLIC_USE_SEPARATED_SERVICES=true

# Drive service URL (from Step 1)
EXPO_PUBLIC_DRIVE_URL=https://script.google.com/macros/s/YOUR_DRIVE_SCRIPT_ID/exec

# Sheets service URL (from Step 2)
EXPO_PUBLIC_SHEETS_URL=https://script.google.com/macros/s/YOUR_SHEETS_SCRIPT_ID/exec
```

### Step 4: Test the Setup

1. Build and deploy your app with the new environment variables
2. Try running a backup operation
3. Check both Google Drive and Google Sheets for the results

## Features

### Drive Service Features
- ✅ Handles image uploads to Google Drive
- ✅ Creates organized folder structure
- ✅ Prevents duplicate uploads
- ✅ Sets proper file permissions
- ✅ 60-second timeout for large images
- ✅ Detailed error reporting

### Sheets Service Features
- ✅ Creates and manages spreadsheet
- ✅ Writes data to named sheets
- ✅ Formats headers and data
- ✅ Auto-resizes columns
- ✅ Freezes header rows
- ✅ 30-second timeout for sheet operations
- ✅ Data sanitization

## Fallback Options

If you still experience issues, you can:

### Option 1: Skip Image Uploads Temporarily
```bash
SKIP_IMAGE_UPLOADS=true
```

### Option 2: Use Original Single Service
Remove or set to false:
```bash
EXPO_PUBLIC_USE_SEPARATED_SERVICES=false
```

## Monitoring

Both services include comprehensive logging:

- **Drive Service**: Logs upload attempts, successes, and failures
- **Sheets Service**: Logs sheet creation, data writing, and formatting

Check the Google Apps Script execution logs for detailed information.

## Benefits

1. **Isolation**: Drive and Sheets operations are completely separate
2. **Reliability**: Each service can succeed/fail independently
3. **Scalability**: Services can be optimized individually
4. **Debugging**: Easier to identify which service is causing issues
5. **Flexibility**: Can disable one service while keeping the other running

## Troubleshooting

### Drive Service Issues
- Check file permissions in Google Drive
- Verify the folder "VitaInspire-Uploads" exists
- Check Google Apps Script execution logs
- Ensure images are valid base64 data

### Sheets Service Issues
- Check spreadsheet permissions
- Verify the spreadsheet "VitaInspire Data Backup" exists
- Check for data format issues
- Ensure headers and rows match expected format

### General Issues
- Verify environment variables are set correctly
- Check network connectivity
- Ensure Google Apps Script deployments are active
- Check quota limits in Google Cloud Console

## Migration

To migrate from the old system:

1. Set up the new separated services
2. Set `EXPO_PUBLIC_USE_SEPARATED_SERVICES=true`
3. Test with a small backup first
4. Once confirmed working, remove the old `EXPO_PUBLIC_BACKUP_URL`

The app will automatically use the separated services when the flag is enabled.