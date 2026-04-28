/**
 * VitaInspire — Google Apps Script: Drive Image Upload
 * Handles image uploads ONLY. Saves base64 photos to organised Drive folders.
 *
 * SETUP
 * ─────
 * 1. script.google.com → New Project → paste this file
 * 2. Project Settings → Script Properties → add:
 *      ROOT_FOLDER_ID = <ID from the Drive folder URL>
 * 3. Select "setupDrive" in the Run dropdown → Run → Allow permissions
 * 4. Deploy → New deployment → Web app
 *      Execute as: Me  |  Who has access: Anyone
 * 5. Copy the URL → paste into artifacts/vitainspire/.env as EXPO_PUBLIC_DRIVE_URL
 *
 * FOLDER STRUCTURE
 * ────────────────
 * <Root>/
 *   Farmers/
 *     farmer-profile.jpg
 *   Field Capture/
 *     <fieldLabel>/
 *       Standing/   zone A/B/C plant, leaf, cob photos
 *       Cutting/    zone A/B/C plant, cob photos
 *       Chopped/    chopped photo
 *   Harvest/
 *     <HVT-shortId>/
 *       overview.jpg  leaf.jpg  cob.jpg
 *   Post Harvest/
 *     <SMP-shortId>/
 *       storage.jpg  cross-section.jpg  sample.jpg  texture.jpg
 */

// ─── Entry points ────────────────────────────────────────────

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (!data.base64 || !data.fileName) {
      throw new Error("Missing base64 or fileName");
    }
    return handleImage_(data);
  } catch (err) {
    return json_({ status: "error", message: err.toString() });
  }
}

function doGet() {
  return ContentService
    .createTextOutput("✅ VitaInspire Drive Upload is ONLINE.")
    .setMimeType(ContentService.MimeType.TEXT);
}

// Run once from the editor to verify Drive access
function setupDrive() {
  DriveApp.getFolderById(ROOT_FOLDER_ID);
  Logger.log("✅ Drive auth OK – root folder accessible");
}

// ─── Image handler ───────────────────────────────────────────

function handleImage_(data) {
  var root      = getRootFolder_();
  var pathParts = routePath_(data.fileName, data.metadata || {});
  var folder    = resolvePath_(root, pathParts);

  // Replace existing file so re-syncs don't duplicate
  var existing = folder.getFilesByName(data.fileName);
  while (existing.hasNext()) existing.next().setTrashed(true);

  var clean = (data.base64 || "").replace(/^data:[^;]+;base64,/, "");
  var blob  = Utilities.newBlob(
    Utilities.base64Decode(clean),
    data.mimeType || "image/jpeg",
    data.fileName
  );

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return json_({
    status  : "success",
    url     : "https://drive.google.com/uc?export=view&id=" + file.getId(),
    fileId  : file.getId(),
    folder  : pathParts.join("/"),
  });
}

// ─── Folder routing ──────────────────────────────────────────

function routePath_(fileName, metadata) {
  var name = fileName.toLowerCase();

  // Farmer profile
  if (name.indexOf("farmer-profile") === 0) {
    return ["Farmers"];
  }

  // Post Harvest (SMP- prefix) → Post Harvest/<SMP-shortId>/
  if (/^smp-/.test(name)) {
    var smpId = fileName.split("_")[0] || "unknown";
    return ["Post Harvest", smpId];
  }

  // Harvest visit photos (HVT- prefix) → Harvest/<HVT-shortId>/
  if (/^hvt-/.test(name)) {
    var hvtId = fileName.split("_")[0] || "unknown";
    return ["Harvest", hvtId];
  }

  // Field Capture — metadata.stage tells us exactly which subfolder
  // metadata = { stage: "standing" | "cutting" | "chopped", fieldId: "<label>" }
  if (metadata.stage && metadata.fieldId) {
    var stageName = metadata.stage.charAt(0).toUpperCase() + metadata.stage.slice(1);
    return ["Field Capture", metadata.fieldId, stageName];
  }

  return ["misc"];
}

// ─── Drive helpers ───────────────────────────────────────────

var ROOT_FOLDER_ID = "1RKGGAdJMIDxib2ONn-CEALhhoZYDPvTi";

function getRootFolder_() {
  return DriveApp.getFolderById(ROOT_FOLDER_ID);
}

// Lock only on folder creation — reads are lock-free so concurrent uploads
// don't queue behind each other.
function resolvePath_(root, pathParts) {
  return pathParts.reduce(function(folder, part) {
    var it = folder.getFoldersByName(part);
    if (it.hasNext()) return it.next();            // fast path, no lock

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var it2 = folder.getFoldersByName(part);    // re-check after lock
      if (it2.hasNext()) return it2.next();
      return folder.createFolder(part);
    } finally {
      lock.releaseLock();
    }
  }, root);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
