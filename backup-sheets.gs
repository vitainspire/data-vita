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

// ─── Sheet write ──────────────────────────────────────────────

function handleRows_(data) {
  var ss    = getOrCreateSpreadsheet_();
  var sheet = getOrCreateSheet_(ss, data.sheetName);
  ensureHeader_(sheet, data.headers);
  clearDataRows_(sheet);
  var rows = data.rows || [];
  if (rows.length > 0 && !Array.isArray(rows[0])) rows = [rows];
  rows.forEach(function(row) { sheet.appendRow(row); });
  return json_({ status: "success", sheetName: data.sheetName, rowCount: rows.length, spreadsheetUrl: ss.getUrl() });
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
    sheet.getRange(1, 1, 1, cols.length)
         .setFontWeight("bold")
         .setBackground("#2d6a4f")
         .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
}

function clearDataRows_(sheet) {
  var last = sheet.getLastRow();
  if (last > 1) sheet.deleteRows(2, last - 1);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
