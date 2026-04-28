/**
 * Google Apps Script for Drive Image Uploads Only
 * Handles image uploads to Google Drive with proper error handling
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Handle image upload requests
    if (data.base64 && data.fileName) {
      return handleImageUpload(data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Invalid request format" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error("Drive script error:", error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Drive service error: " + error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleImageUpload(data) {
  try {
    const { base64, fileName, mimeType = "image/jpeg", metadata = {} } = data;
    
    // Validate input
    if (!base64 || !fileName) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          status: "error", 
          message: "Missing base64 data or fileName" 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Create blob from base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64), 
      mimeType, 
      fileName
    );
    
    // Get or create the uploads folder
    const folder = getOrCreateFolder("VitaInspire-Uploads");
    
    // Check if file already exists
    const existingFiles = folder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      const existingFile = existingFiles.next();
      const url = `https://drive.google.com/file/d/${existingFile.getId()}/view`;
      return ContentService
        .createTextOutput(JSON.stringify({ 
          status: "success", 
          url: url,
          message: "File already exists"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Upload the file
    const file = folder.createFile(blob);
    
    // Set file description with metadata
    if (Object.keys(metadata).length > 0) {
      file.setDescription(JSON.stringify(metadata));
    }
    
    // Make file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const url = `https://drive.google.com/file/d/${file.getId()}/view`;
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "success", 
        url: url,
        fileId: file.getId()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error("Image upload error:", error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Upload failed: " + error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateFolder(folderName) {
  try {
    // Try to find existing folder
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    
    // Create new folder if it doesn't exist
    const folder = DriveApp.createFolder(folderName);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return folder;
    
  } catch (error) {
    console.error("Folder creation error:", error);
    throw new Error("Failed to create/access folder: " + error.toString());
  }
}

// Test function for manual testing
function testImageUpload() {
  const testData = {
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    fileName: "test-image.png",
    mimeType: "image/png",
    metadata: { test: "true" }
  };
  
  const result = handleImageUpload(testData);
  console.log("Test result:", result.getContent());
}