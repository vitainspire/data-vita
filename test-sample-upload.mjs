/**
 * Sample data upload test for Drive + Sheets
 * Run: node test-sample-upload.mjs
 */

const DRIVE_URL = "https://script.google.com/macros/s/AKfycbxVJllokqmwuS07JerjOjSXG7DjcjVR8qwVMwJT_P4l7_4jYAIV7kMz4L6QGiRATEkt/exec";
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwXWHDF-XNYJ4o0zGJcBmAlb_jPRhB0SgTqtd4ZExxsxJjCEx_R7KSICBAvPOfpCg4B/exec";

// Minimal 1×1 red JPEG in base64
const SAMPLE_JPEG = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAARC" +
  "AABAAEDASIA AhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/" +
  "aAAwDAQACEQMRAD8AJQAB/9k=";

// ── helpers ──────────────────────────────────────────────────

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function uploadImage(fileName, metadata) {
  console.log(`  📸 Uploading ${fileName} → Drive/${metadata.stage ? `Field Capture/${metadata.fieldId}/${metadata.stage}` : fileName.split("_")[0] || "root"}...`);
  const result = await post(DRIVE_URL, {
    base64: SAMPLE_JPEG,
    fileName,
    mimeType: "image/jpeg",
    metadata,
  });
  if (result.status === "success") {
    console.log(`     ✅ ${result.folder}  →  ${result.url}`);
  } else {
    console.log(`     ❌ ${JSON.stringify(result)}`);
  }
}

async function writeSheet(sheetName, headers, rows) {
  console.log(`  📊 Writing "${sheetName}" (${rows.length} row${rows.length !== 1 ? "s" : ""})...`);
  const result = await post(SHEETS_URL, { type: "rows", sheetName, headers, rows });
  if (result.status === "success") {
    console.log(`     ✅ Done${result.spreadsheetUrl ? "  →  " + result.spreadsheetUrl : ""}`);
  } else {
    console.log(`     ❌ ${JSON.stringify(result)}`);
  }
}

// ── Drive uploads ─────────────────────────────────────────────

async function testDrive() {
  console.log("\n🗂️  DRIVE UPLOADS\n");

  // Farmer profile
  await uploadImage("farmer-profile_farmer.jpg", {});

  // Field Capture — Standing (Field-Demo)
  await uploadImage("Field-Demo_zoneA-plant.jpg", { stage: "standing", fieldId: "Field-Demo" });
  await uploadImage("Field-Demo_zoneA-leaf.jpg", { stage: "standing", fieldId: "Field-Demo" });
  await uploadImage("Field-Demo_zoneA-cob.jpg", { stage: "standing", fieldId: "Field-Demo" });

  // Field Capture — Cutting
  await uploadImage("Field-Demo_zoneA-plant.jpg", { stage: "cutting", fieldId: "Field-Demo" });
  await uploadImage("Field-Demo_zoneA-cob.jpg", { stage: "cutting", fieldId: "Field-Demo" });

  // Field Capture — Chopped
  await uploadImage("Field-Demo_zoneA-chopped.jpg", { stage: "chopped", fieldId: "Field-Demo" });
  await uploadImage("Field-Demo_zoneB-chopped.jpg", { stage: "chopped", fieldId: "Field-Demo" });
  await uploadImage("Field-Demo_zoneC-chopped.jpg", { stage: "chopped", fieldId: "Field-Demo" });

  // Harvest
  await uploadImage("HVT-abc12345_harvest-overview.jpg", {});
  await uploadImage("HVT-abc12345_harvest-leaf.jpg", {});
  await uploadImage("HVT-abc12345_harvest-cob.jpg", {});

  // Post Harvest
  await uploadImage("SMP-xyz98765_silage-storage.jpg", { fieldId: "abc12345" });
  await uploadImage("SMP-xyz98765_silage-cross-section.jpg", { fieldId: "abc12345" });
  await uploadImage("SMP-xyz98765_silage-sample.jpg", { fieldId: "abc12345" });
  await uploadImage("SMP-xyz98765_silage-texture.jpg", { fieldId: "abc12345" });
}

// ── Sheets writes ─────────────────────────────────────────────

async function testSheets() {
  console.log("\n📋  SHEETS WRITES\n");

  await writeSheet("Fields", [
    "Code", "Label", "Location Code", "State", "District",
    "Latitude", "Longitude", "Created At", "Stages Completed",
  ], [
    ["FLD001", "North Demo Field", "LOC-01", "Maharashtra", "Pune",
      "18.5204", "73.8567", "28/04/2026, 09:00:00", "Standing, Cutting"],
    ["FLD002", "South Demo Field", "LOC-02", "Maharashtra", "Nashik",
      "19.9975", "73.7898", "28/04/2026, 10:00:00", "Standing"],
  ]);

  await writeSheet("Field – Standing", [
    "Field Code", "Label", "Captured At",
    "Zone A – Plant", "Zone A – Leaf", "Zone A – Cob",
    "Zone B – Plant", "Zone B – Leaf", "Zone B – Cob",
    "Zone C – Plant", "Zone C – Leaf", "Zone C – Cob",
    "Zone A – Height", "Zone A – Color", "Zone A – Density",
    "Zone B – Height", "Zone B – Color", "Zone B – Density",
    "Zone C – Height", "Zone C – Color", "Zone C – Density",
  ], [
    ["FLD001", "North Demo Field", "28/04/2026, 09:00:00",
      "https://drive.google.com/sample1", "https://drive.google.com/sample2", "https://drive.google.com/sample3",
      "https://drive.google.com/sample4", "https://drive.google.com/sample5", "https://drive.google.com/sample6",
      "https://drive.google.com/sample7", "https://drive.google.com/sample8", "https://drive.google.com/sample9",
      "220cm", "Green", "High",
      "210cm", "Green", "Medium",
      "215cm", "Yellow-Green", "High"],
  ]);

  await writeSheet("Field – Cutting", [
    "Field Code", "Label", "Captured At",
    "Zone A – Plant", "Zone A – Cob", "Zone A – Height", "Zone A – Color", "Zone A – Density",
    "Zone B – Plant", "Zone B – Cob", "Zone B – Height", "Zone B – Color", "Zone B – Density",
    "Zone C – Plant", "Zone C – Cob", "Zone C – Height", "Zone C – Color", "Zone C – Density",
    "Harvest Method", "Crop Condition", "Cutting Height", "Lodging",
  ], [
    ["FLD001", "North Demo Field", "28/04/2026, 11:00:00",
      "https://drive.google.com/sample1", "https://drive.google.com/sample2", "200cm", "Green", "High",
      "https://drive.google.com/sample3", "https://drive.google.com/sample4", "195cm", "Green", "Medium",
      "https://drive.google.com/sample5", "https://drive.google.com/sample6", "205cm", "Green", "High",
      "Combine", "Good", "15cm", "Low"],
  ]);

  await writeSheet("Field – Chopped", [
    "Field Code", "Label", "Captured At",
    "Zone A – Photo", "Zone A – Chop Length", "Zone A – Uniformity", "Zone A – Material Quality", "Zone A – Moisture",
    "Zone B – Photo", "Zone B – Chop Length", "Zone B – Uniformity", "Zone B – Material Quality", "Zone B – Moisture",
    "Zone C – Photo", "Zone C – Chop Length", "Zone C – Uniformity", "Zone C – Material Quality", "Zone C – Moisture",
  ], [
    ["FLD001", "North Demo Field", "28/04/2026, 12:00:00",
      "https://drive.google.com/sample1", "12mm", "Good", "Excellent", "65%",
      "https://drive.google.com/sample2", "11mm", "Good", "Excellent", "63%",
      "https://drive.google.com/sample3", "13mm", "Fair", "Good",     "67%"],
  ]);

  await writeSheet("Harvest – Field Visits", [
    "Visit ID", "Date", "Area (acres)", "Crop Type",
    "Plant Stand", "Pest Pressure", "Disease", "Rainfall",
    "Farmer Photo", "Field Overview", "Leaf Photo", "Cob Photo",
  ], [
    ["abc12345-0000-0000-0000-000000000000", "28/04/2026, 13:00:00", "5.2", "Corn",
      "Good", "Low", "None", "Adequate",
      "https://drive.google.com/farmer",
      "https://drive.google.com/overview",
      "https://drive.google.com/leaf",
      "https://drive.google.com/cob"],
  ]);

  await writeSheet("Harvest – Records", [
    "Record ID", "Date", "Visit ID", "Weight (kg)", "Output Type",
  ], [
    ["rec-0001", "28/04/2026, 14:00:00", "abc12345-0000-0000-0000-000000000000", 4500, "Silage"],
    ["rec-0002", "28/04/2026, 14:30:00", "abc12345-0000-0000-0000-000000000000", 4200, "Silage"],
  ]);

  await writeSheet("Post Harvest – Batches", [
    "Batch ID", "Batch Name", "Date", "Visit ID",
    "pH", "Smell", "Mold",
    "Storage Photo", "Cross Section", "Sample Bag", "Texture",
  ], [
    ["xyz98765-0000-0000-0000-000000000000", "Batch A", "28/04/2026, 15:00:00",
      "abc12345-0000-0000-0000-000000000000",
      "3.8", "Fresh", "None",
      "https://drive.google.com/storage",
      "https://drive.google.com/cross",
      "https://drive.google.com/sample",
      "https://drive.google.com/texture"],
  ]);
}

// ── Run ───────────────────────────────────────────────────────

(async () => {
  console.log("🚀 VitaInspire — Sample Data Upload Test");
  console.log("━".repeat(50));
  await testDrive();
  await testSheets();
  console.log("\n✅ All done.\n");
})();
