// ============================================================
// CONFIGURATION — Update these before deploying
// ============================================================
const CONFIG = {
  // --- Google Drive ---
  // Option A (recommended): paste the Folder ID from the Drive URL
  //   e.g. drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv  ← that last part
  // Option B: leave blank and set DRIVE_FOLDER_NAME — script will find/create by name
  DRIVE_FOLDER_ID: '',

  // Only used when DRIVE_FOLDER_ID is blank
  DRIVE_FOLDER_NAME: 'App-Uploads',

  // --- Google Sheets ---
  // Option A (recommended): paste the Spreadsheet ID from its URL
  //   e.g. docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUv/edit  ← that part
  // Option B: leave blank — script auto-creates "Form Data" inside the Drive folder
  SPREADSHEET_ID: '',

  SHEET_NAME: 'Submissions',   // Tab name for web-form submissions
};

// ============================================================
// WEB APP ENTRY POINTS
// ============================================================

// Serves the HTML upload form (GET requests from a browser)
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Image Upload Form')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Mobile-app backup entry point (POST requests from the app)
//   Image upload  → { base64, fileName, mimeType?, metadata? }
//   Sheet rows    → { type: "rows", sheetName, headers, rows }
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Sheet row writes never need Drive — keep them independent so Drive
    // quota/errors on concurrent image uploads don't block sheet writes.
    if (data.type === 'rows') {
      const ss = getSpreadsheetDirect_();
      return handleAppRows_(data, ss);
    }

    if (data.base64) {
      const folder = getOrCreateFolder();
      return handleAppImage_(data, folder);
    }

    return jsonOut_({ status: 'error', message: 'Unknown payload type' });
  } catch (err) {
    return jsonOut_({ status: 'error', message: err.toString() });
  }
}

// Returns the spreadsheet for row writes — never touches Drive after first run.
// Priority: CONFIG.SPREADSHEET_ID → cached PropertiesService ID → create new.
function getSpreadsheetDirect_() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  const props = PropertiesService.getScriptProperties();
  const cachedId = props.getProperty('VITAINSPIRE_SS_ID');
  if (cachedId) {
    try { return SpreadsheetApp.openById(cachedId); } catch(e) { /* deleted — fall through */ }
  }

  // First-ever run: create a spreadsheet and cache its ID (no DriveApp needed)
  const ss = SpreadsheetApp.create('VitaInspire – Field Data');
  props.setProperty('VITAINSPIRE_SS_ID', ss.getId());
  return ss;
}

// ============================================================
// INITIALISE — create/find folder and spreadsheet
// ============================================================
function getOrCreateFolder() {
  if (CONFIG.DRIVE_FOLDER_ID) {
    try {
      return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } catch (e) {
      throw new Error(
        'Could not open Drive folder with ID "' + CONFIG.DRIVE_FOLDER_ID +
        '". Check that the ID is correct and you have access.\n' + e.message
      );
    }
  }

  const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
}

function getOrCreateSpreadsheet(folder) {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }

  const files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName() === 'Form Data') {
      return SpreadsheetApp.openById(file.getId());
    }
  }

  const ss     = SpreadsheetApp.create('Form Data');
  const ssFile = DriveApp.getFileById(ss.getId());
  folder.addFile(ssFile);
  DriveApp.getRootFolder().removeFile(ssFile);
  return ss;
}

// Creates (or returns) the "Submissions" tab used by the web form
function getOrCreateSheet(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.getActiveSheet().setName(CONFIG.SHEET_NAME);

    const headers = [
      'Timestamp',
      'Full Name',
      'Email',
      'Phone',
      'Category',
      'Description',
      'Image File Name',
      'Image URL',
      'Drive File ID',
    ];
    sheet.appendRow(headers);

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1a73e8')
               .setFontColor('#ffffff')
               .setFontWeight('bold')
               .setFontSize(11);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(8, 280);
  }
  return sheet;
}

// ============================================================
// WEB FORM HANDLER — called via google.script.run from Index.html
// ============================================================
function submitFormData(formData) {
  try {
    const folder = getOrCreateFolder();
    const ss     = getOrCreateSpreadsheet(folder);
    const sheet  = getOrCreateSheet(ss);

    let imageFileName = '';
    let imageUrl      = '';
    let driveFileId   = '';

    if (formData.imageData && formData.imageName) {
      const result = saveImageToDrive(
        formData.imageData,
        formData.imageName,
        formData.imageType,
        folder
      );
      imageFileName = result.name;
      imageUrl      = result.url;
      driveFileId   = result.id;
    }

    const row = [
      new Date().toLocaleString(),
      formData.fullName    || '',
      formData.email       || '',
      formData.phone       || '',
      formData.category    || '',
      formData.description || '',
      imageFileName,
      imageUrl,
      driveFileId,
    ];
    sheet.appendRow(row);
    sheet.autoResizeColumns(1, 7);

    return {
      success : true,
      message : 'Submission saved successfully!',
      sheetUrl: ss.getUrl(),
      imageUrl: imageUrl,
    };
  } catch (err) {
    Logger.log('Error in submitFormData: ' + err.toString());
    return { success: false, message: err.toString() };
  }
}

// ============================================================
// UTILITY — called from the form to get the spreadsheet URL
// ============================================================
function getSheetUrl() {
  try {
    const folder = getOrCreateFolder();
    const ss     = getOrCreateSpreadsheet(folder);
    return { success: true, url: ss.getUrl() };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ============================================================
// APP BACKUP — image upload
// ============================================================
function handleAppImage_(data, folder) {
  const metadata   = data.metadata || {};
  const pathParts  = folderPathForFile_(data.fileName, metadata);
  const destFolder = resolvePath_(folder, pathParts);

  // Replace existing file so re-syncs don't duplicate
  const existing = destFolder.getFilesByName(data.fileName);
  if (existing.hasNext()) existing.next().setTrashed(true);

  const cleanBase64 = (data.base64 || '').replace(/^data:[^;]+;base64,/, '');
  const blob = Utilities.newBlob(
    Utilities.base64Decode(cleanBase64),
    data.mimeType || 'image/jpeg',
    data.fileName
  );

  const file = destFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return jsonOut_({
    status : 'success',
    url    : 'https://drive.google.com/uc?export=view&id=' + file.getId(),
    fileId : file.getId(),
    folder : pathParts.join('/'),
  });
}

// ============================================================
// APP BACKUP — sheet rows (full-replace per tab)
// ============================================================
function handleAppRows_(data, ss) {
  const sheet = getOrCreateDataSheet_(ss, data.sheetName);
  ensureHeader_(sheet, data.headers);
  clearDataRows_(sheet);

  const rows = data.rows || [];
  rows.forEach(row => sheet.appendRow(row));

  return jsonOut_({
    status   : 'success',
    sheetName: data.sheetName,
    rowCount : rows.length,
  });
}

// ============================================================
// DRIVE FOLDER ROUTING (by filename convention)
// ============================================================
function folderPathForFile_(fileName, metadata) {
  const name = fileName.toLowerCase();

  if (name.indexOf('farmer-profile_') === 0) {
    const farmerName = fileName.split('_')[1] || 'unknown-farmer';
    return ['farmers', farmerName];
  }

  if (/^smp-/.test(name)) {
    const fieldId = (metadata && metadata.fieldId) ? metadata.fieldId : 'unknown-field';
    return ['fields', fieldId, 'silage'];
  }

  const fieldIdMatch = fileName.match(/^([A-Z]{2}-[A-Z]+-\d+|Field-\d+)_/i);
  if (fieldIdMatch) {
    const fid = fieldIdMatch[1];
    if (name.indexOf('_standing-') !== -1) return ['fields', fid, 'standing'];
    if (name.indexOf('_zone')      !== -1) return ['fields', fid, 'zones'];
    if (name.indexOf('_cut_')      !== -1) return ['fields', fid, 'cut'];
    if (name.indexOf('_chopped_')  !== -1) return ['fields', fid, 'chopped'];
    if (name.indexOf('_harvest-')  !== -1) return ['fields', fid, 'harvest'];
    return ['fields', fid];
  }

  return ['misc'];
}

// ============================================================
// IMAGE HELPER — used by the web form (saveImageToDrive)
// ============================================================
function saveImageToDrive(base64Data, fileName, mimeType, folder) {
  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
  const blob = Utilities.newBlob(
    Utilities.base64Decode(cleanBase64),
    mimeType || 'image/jpeg',
    fileName
  );

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    id  : file.getId(),
    name: file.getName(),
    url : 'https://drive.google.com/file/d/' + file.getId() + '/view',
  };
}

// ============================================================
// HELPERS
// ============================================================
function resolvePath_(root, pathParts) {
  return pathParts.reduce((folder, part) => {
    // Fast path: folder already exists — no lock needed
    const it = folder.getFoldersByName(part);
    if (it.hasNext()) return it.next();

    // Slow path: need to create — lock to prevent race conditions
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      // Re-check after acquiring lock (another request may have just created it)
      const it2 = folder.getFoldersByName(part);
      if (it2.hasNext()) return it2.next();
      return folder.createFolder(part);
    } finally {
      lock.releaseLock();
    }
  }, root);
}

// Creates/finds a sheet tab used by the app backup (no fixed columns)
function getOrCreateDataSheet_(ss, name) {
  const existing = ss.getSheetByName(name);
  if (existing) return existing;
  const sheet = ss.insertSheet(name);
  try {
    const def = ss.getSheetByName('Sheet1');
    if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  } catch (e) {}
  return sheet;
}

function ensureHeader_(sheet, cols) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(cols);
    sheet.getRange(1, 1, 1, cols.length)
         .setFontWeight('bold')
         .setBackground('#1a73e8')
         .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}

function clearDataRows_(sheet) {
  const last = sheet.getLastRow();
  if (last > 1) sheet.deleteRows(2, last - 1);
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
