/**
 * Google Apps Script — Farming App Photo Bridge
 *
 * SETUP
 * ─────
 * 1. Go to https://script.google.com and create a NEW PROJECT
 * 2. Paste this entire file
 * 3. Create a root folder in Google Drive named "Farming-App-Photos"
 * 4. In the Apps Script editor: Project Settings → Script Properties
 *    Add property: ROOT_FOLDER_ID = <your Drive folder ID>
 * 5. Run setupDrive() once from the editor → Allow permissions
 * 6. Deploy → New deployment → Web App
 *      Execute as : Me
 *      Who has access : Anyone
 * 7. Copy the Web App URL → add to your .env as EXPO_PUBLIC_DRIVE_URL
 *
 * FOLDER STRUCTURE CREATED AUTOMATICALLY
 * ───────────────────────────────────────
 * Farming-App-Photos/
 *   farmers/
 *     <farmerName>/
 *       farmer-profile_<name>_<date>.jpg
 *   fields/
 *     <fieldId>/                          e.g. AP-ATP-001/
 *       standing/
 *         AP-ATP-001_maize_standing-plant_john_20240115-0930.jpg
 *         AP-ATP-001_maize_standing-leafcob_john_20240115-0931.jpg
 *       zones/
 *         AP-ATP-001_maize_zoneA-plant_ht-tall_col-dark_den-dense_20240115-0935.jpg
 *         AP-ATP-001_maize_zoneB-cob_ht-medium_col-medium_den-medium_20240115-0940.jpg
 *       cut/
 *         AP-ATP-001_maize_cut_yield-high_moist-optimal_stubble-medium_john_20240120-1100.jpg
 *       chopped/
 *         AP-ATP-001_maize_chopped_chop-fine_uni-uniform_qual-good_john_20240121-0800.jpg
 *       silage/
 *         SMP-20240122-XYZ_maize_silage-storage_store-pit_age-45days_pH-lt4.2_smell-pleasant_mold-none_20240122-1400.jpg
 *         SMP-20240122-XYZ_maize_silage-cross-section_...jpg
 *         SMP-20240122-XYZ_maize_silage-sample_...jpg
 *         SMP-20240122-XYZ_maize_silage-texture_...jpg
 */

// Set this in Project Settings → Script Properties (key: ROOT_FOLDER_ID)
const ROOT_FOLDER_ID = PropertiesService.getScriptProperties().getProperty("ROOT_FOLDER_ID");

// ─── One-time auth (run once from the editor) ─────────────────
function setupDrive() {
  DriveApp.getFolderById(ROOT_FOLDER_ID);
  Logger.log("✅ Drive auth OK – root folder accessible");
}

// ─── Folder helpers ───────────────────────────────────────────────────────────

function getOrCreateFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function resolvePath(pathParts) {
  var root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  return pathParts.reduce(function (folder, part) {
    return getOrCreateFolder(folder, part);
  }, root);
}

// ─── Path routing ─────────────────────────────────────────────────────────────

function folderPathForFile(fileName, metadata) {
  var name = fileName.toLowerCase();

  // Farmer profile
  if (name.indexOf("farmer-profile_") === 0) {
    var parts = fileName.split("_");
    var farmerName = parts[1] || "unknown-farmer";
    return ["farmers", farmerName];
  }

  // Silage — keyed by SMP-* prefix; fieldId must be in metadata
  if (/^smp-/.test(name)) {
    var fieldId = (metadata && metadata.fieldId) ? metadata.fieldId : "unknown-field";
    return ["fields", fieldId, "silage"];
  }

  // Field photos — first segment is the field ID (e.g. AP-ATP-001)
  var fieldIdMatch = fileName.match(/^([A-Z]{2}-[A-Z]+-\d+)_/);
  if (fieldIdMatch) {
    var fid = fieldIdMatch[1];

    if (name.indexOf("_standing-") !== -1) return ["fields", fid, "standing"];
    if (name.indexOf("_zone") !== -1)      return ["fields", fid, "zones"];
    if (name.indexOf("_cut_") !== -1)      return ["fields", fid, "cut"];
    if (name.indexOf("_chopped_") !== -1)  return ["fields", fid, "chopped"];

    return ["fields", fid];
  }

  // Unknown — dump in misc
  return ["misc"];
}

// ─── Request handlers ─────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var base64Data = data.base64;
    var fileName   = data.fileName;
    var mimeType   = data.mimeType || "image/jpeg";
    var metadata   = data.metadata || {};

    if (!base64Data || !fileName) {
      throw new Error("Missing required fields: base64, fileName");
    }

    var bytes = Utilities.base64Decode(base64Data);
    var blob  = Utilities.newBlob(bytes, mimeType, fileName);

    var pathParts  = folderPathForFile(fileName, metadata);
    var destFolder = resolvePath(pathParts);

    var file = destFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var viewUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();

    return ContentService
      .createTextOutput(JSON.stringify({
        status   : "success",
        url      : viewUrl,
        fileId   : file.getId(),
        folder   : pathParts.join("/"),
        fileName : fileName,
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status  : "error",
        message : err.toString(),
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput("✅ Farming App Photo Bridge is ONLINE.\nReady for POST requests.")
    .setMimeType(ContentService.MimeType.TEXT);
}
