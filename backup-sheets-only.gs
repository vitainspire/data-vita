/**
 * Google Apps Script for Sheets Data Writing Only
 * Handles writing data to Google Sheets with proper error handling
 */

// Configuration
const SPREADSHEET_NAME = "VitaInspire Data Backup";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Handle sheet writing requests
    if (data.type === "rows" && data.sheetName && data.headers && data.rows) {
      return handleSheetWrite(data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: "Invalid request format" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error("Sheets script error:", error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Sheets service error: " + error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSheetWrite(data) {
  try {
    const { sheetName, headers, rows } = data;
    
    // Validate input
    if (!sheetName || !headers || !Array.isArray(headers) || !Array.isArray(rows)) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          status: "error", 
          message: "Invalid sheet data format" 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get or create spreadsheet
    const spreadsheet = getOrCreateSpreadsheet();
    
    // Get or create sheet
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }
    
    // Clear existing data
    sheet.clear();
    
    // Write headers
    if (headers.length > 0) {
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      
      // Format headers
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f0f0f0");
      headerRange.setBorder(true, true, true, true, true, true);
    }
    
    // Write data rows
    if (rows.length > 0) {
      // Sanitize data to prevent errors
      const sanitizedRows = rows.map(row => {
        return row.map(cell => {
          if (cell === null || cell === undefined) return "";
          if (typeof cell === "string") return cell;
          if (typeof cell === "number") return cell;
          if (typeof cell === "boolean") return cell;
          return String(cell);
        });
      });
      
      // Ensure all rows have the same number of columns as headers
      const normalizedRows = sanitizedRows.map(row => {
        const normalizedRow = [...row];
        while (normalizedRow.length < headers.length) {
          normalizedRow.push("");
        }
        return normalizedRow.slice(0, headers.length);
      });
      
      const dataRange = sheet.getRange(2, 1, normalizedRows.length, headers.length);
      dataRange.setValues(normalizedRows);
      
      // Format data
      dataRange.setBorder(true, true, true, true, true, true);
    }
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "success", 
        message: `Sheet "${sheetName}" updated with ${rows.length} rows`,
        spreadsheetUrl: spreadsheet.getUrl()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error("Sheet write error:", error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Sheet write failed: " + error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSpreadsheet() {
  try {
    // Try to find existing spreadsheet
    const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    if (files.hasNext()) {
      const file = files.next();
      return SpreadsheetApp.openById(file.getId());
    }
    
    // Create new spreadsheet if it doesn't exist
    const spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    
    // Share the spreadsheet
    const file = DriveApp.getFileById(spreadsheet.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return spreadsheet;
    
  } catch (error) {
    console.error("Spreadsheet creation error:", error);
    throw new Error("Failed to create/access spreadsheet: " + error.toString());
  }
}

// Test function for manual testing
function testSheetWrite() {
  const testData = {
    type: "rows",
    sheetName: "Test Sheet",
    headers: ["ID", "Name", "Date", "Status"],
    rows: [
      ["1", "Test Item 1", "2024-01-01", "Active"],
      ["2", "Test Item 2", "2024-01-02", "Inactive"],
      ["3", "Test Item 3", "2024-01-03", "Pending"]
    ]
  };
  
  const result = handleSheetWrite(testData);
  console.log("Test result:", result.getContent());
}

// Utility function to get spreadsheet URL for sharing
function getSpreadsheetUrl() {
  const spreadsheet = getOrCreateSpreadsheet();
  return spreadsheet.getUrl();
}