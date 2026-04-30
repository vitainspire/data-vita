/**
 * VitaInspire — Google Apps Script: Sheets Backup
 * Handles spreadsheet row writes ONLY. Does NOT use DriveApp.
 *
 * SETUP:
 *  1. script.google.com → New Project → paste this file
 *  2. Select "setupSheets" in the function dropdown → Run → Allow permissions
 *  3. Check the Execution Log for the spreadsheet URL
 *  4. Deploy → New deployment → Web app
 *       Execute as: Me  |  Who has access: Anyone
 *  5. Copy the URL into artifacts/vitainspire/.env as EXPO_PUBLIC_SHEETS_URL
 */

var SPREADSHEET_ID = "1ZRy62GwegHKR1MGcpZJoghuH1BjNp8qDgZ9OpSRujoU";

// ─── One-time auth (run once from the editor) ─────────────────

function setupSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log("✅ Sheets auth OK – " + ss.getUrl());
}

// ─── Router ──────────────────────────────────────────────────

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    return handleRows_(data);
  } catch (err) {
    return json_({ status: "error", message: err.toString() });
  }
}

function doGet() {
  return ContentService
    .createTextOutput("✅ VitaInspire Sheets Backup is ONLINE.")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ─── Sheet write (upsert — never overwrites by key) ──────────

function handleRows_(data) {
  var ss    = getOrCreateSpreadsheet_();
  var sheet = getOrCreateSheet_(ss, data.sheetName);
  ensureHeader_(sheet, data.headers);
  var rows = data.rows || [];
  if (rows.length > 0 && !Array.isArray(rows[0])) rows = [rows];
  rows.forEach(function(row) { upsertRow_(sheet, row); });
  return json_({ status: "success", sheetName: data.sheetName, rowCount: rows.length, spreadsheetUrl: ss.getUrl() });
}

// Insert or update a row. First column is the primary key.
function upsertRow_(sheet, row) {
  if (!row || row.length === 0) return;
  var key = String(row[0]);
  if (!key) return;

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === key) {
        sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
        return;
      }
    }
  }
  sheet.appendRow(row);
}

// ─── Helpers ─────────────────────────────────────────────────

function getOrCreateSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  sheet = ss.insertSheet(name);
  try {
    var def = ss.getSheetByName("Sheet1");
    if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  } catch(e) {}
  return sheet;
}

function ensureHeader_(sheet, cols) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(cols);
  } else {
    // Always refresh headers so schema changes (added columns) show up
    var existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var changed = existing.length !== cols.length ||
      cols.some(function(c, i) { return c !== existing[i]; });
    if (changed) {
      sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
      // Clear any leftover cells from the old narrower header
      if (existing.length > cols.length) {
        sheet.getRange(1, cols.length + 1, 1, existing.length - cols.length).clearContent();
      }
    }
  }
  sheet.getRange(1, 1, 1, cols.length)
       .setFontWeight("bold")
       .setBackground("#2d6a4f")
       .setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
