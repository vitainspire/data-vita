import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

import {
  getFarmerPhoto,
  getFieldList,
  getFields,
  getHarvestFields,
  getHarvestRecords,
  getPostHarvestBatches,
} from "./storage";

// Separate URLs for Drive and Sheets services
const DRIVE_URL = process.env.EXPO_PUBLIC_DRIVE_URL ?? "";
const SHEETS_URL = process.env.EXPO_PUBLIC_SHEETS_URL ?? "";

export function isBackupConfigured(): boolean {
  return DRIVE_URL.length > 0 && SHEETS_URL.length > 0;
}

// ─── Image Upload (Drive Service) ────────────────────────────

async function uriToBase64(uri: string | null): Promise<string | null> {
  if (!uri) return null;
  try {
    if (Platform.OS === "web") {
      if (uri.startsWith("data:")) return uri.split(",")[1] ?? null;
      const res = await fetch(uri);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () =>
          resolve(((reader.result as string) ?? "").split(",")[1] ?? null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
    return FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return null;
  }
}

async function uploadImageToDrive(
  uri: string | null,
  fileName: string,
  metadata?: Record<string, string>
): Promise<string> {
  if (!uri || !DRIVE_URL) return "";
  
  try {
    const base64 = await uriToBase64(uri);
    if (!base64) return "";
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for images
    
    try {
      const res = await fetch(DRIVE_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ 
          base64, 
          fileName, 
          mimeType: "image/jpeg", 
          metadata: metadata ?? {} 
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const text = await res.text();
      let json: { status: string; url?: string; message?: string };
      
      try { 
        json = JSON.parse(text); 
      } catch { 
        throw new Error(`${fileName}: Invalid response from Drive service`);
      }
      
      if (json.status !== "success") {
        throw new Error(`${fileName}: ${json.message ?? "Drive upload failed"}`);
      }
      
      return json.url ?? "";
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`${fileName}: Drive upload timeout`);
      }
      throw error;
    }
  } catch (error) {
    console.warn(`Drive upload failed for ${fileName}:`, error);
    return "";
  }
}

// Safe image upload wrapper
function safeImageUpload(
  errors: string[],
  uri: string | null,
  fileName: string,
  metadata?: Record<string, string>
): Promise<string> {
  if (!uri || uri.trim() === "") {
    return Promise.resolve("");
  }
  
  return uploadImageToDrive(uri, fileName, metadata).catch((e: unknown) => {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.warn(`Image upload failed for ${fileName}: ${errorMsg}`);
    errors.push(`Image upload failed: ${fileName} - ${errorMsg}`);
    return "";
  });
}

// ─── Sheet Writing (Sheets Service) ──────────────────────────

async function writeToSheet(
  sheetName: string,
  headers: string[],
  rows: unknown[][]
): Promise<void> {
  if (!SHEETS_URL) throw new Error("Sheets URL not configured");
  
  // Sanitize rows to prevent Google Apps Script errors
  const sanitizedRows = rows.map(row => 
    row.map(cell => {
      if (cell === null || cell === undefined) return "";
      if (typeof cell === "string") return cell;
      if (typeof cell === "number") return cell;
      if (typeof cell === "boolean") return cell;
      return String(cell);
    })
  );
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for sheets
  
  try {
    const res = await fetch(SHEETS_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ 
        type: "rows", 
        sheetName, 
        headers, 
        rows: sanitizedRows 
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const text = await res.text();
    let parsed: { status?: string; message?: string };
    
    try { 
      parsed = JSON.parse(text); 
    } catch { 
      throw new Error(`Invalid response from Sheets service: ${text.slice(0, 100)}`);
    }
    
    if (parsed.status !== "success") {
      throw new Error(`Sheet "${sheetName}" write failed: ${parsed.message ?? text.slice(0, 200)}`);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Sheet "${sheetName}" write timeout`);
    }
    throw error;
  }
}

// Safe sheet writing wrapper
async function safeWriteSheet(
  errors: string[],
  sheetName: string,
  headers: string[],
  rows: unknown[][]
): Promise<void> {
  try {
    await writeToSheet(sheetName, headers, rows);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error(`Sheet write failed for ${sheetName}:`, errorMsg);
    errors.push(`Sheet write failed: ${sheetName} - ${errorMsg}`);
  }
}

// ─── Utility Functions ───────────────────────────────────────

function fmt(ts: number | undefined): string {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

// ─── Main Backup Function ────────────────────────────────────

export type BackupTarget = "full" | "standing" | "cutting" | "chopped" | "harvestField" | "harvestRecord" | "postHarvest";

export async function runSeparatedBackup(target: BackupTarget = "full"): Promise<{ ok: boolean; error?: string }> {
  if (!DRIVE_URL || !SHEETS_URL) {
    return { ok: false, error: "Drive URL or Sheets URL not configured" };
  }

  const errors: string[] = [];
  const imageErrors: string[] = [];

  const safeImg = (uri: string | null, name: string, meta?: Record<string, string>) =>
    safeImageUpload(imageErrors, uri, name, meta);

  const safeWrite = (name: string, headers: string[], rows: unknown[][]) =>
    safeWriteSheet(errors, name, headers, rows);

  try {
    const want = (t: BackupTarget) => target === "full" || target === t;

    // ── Standing ──────────────────────────────────────────────
    if (want("standing")) {
      console.log("Backing up standing fields...");
      const standingFields = (await getFields()).filter(
        (f): f is any => f.stage === "standing"
      );
      const fieldList = await getFieldList();
      const labelOf = (code: string) => fieldList.find((f) => f.code === code)?.label ?? "";
      const fid = (code: string) => labelOf(code) || `Field-${code}`;

      const rows = await Promise.all(
        standingFields.map(async (f) => {
          const id = fid(f.fieldCode);
          const [plant, leaf, cob] = await Promise.all([
            safeImg(f.plantPhoto, `${id}_standing-plant.jpg`),
            safeImg(f.leafPhoto, `${id}_standing-leaf.jpg`),
            safeImg(f.cobPhoto, `${id}_standing-cob.jpg`),
          ]);
          return [f.fieldCode, labelOf(f.fieldCode), fmt(f.createdAt), plant, leaf, cob];
        })
      );
      
      await safeWrite("Field – Standing", 
        ["Field Code", "Label", "Captured At", "Plant Photo", "Leaf Photo", "Cob Photo"], 
        rows
      );
    }

    // ── Cutting ───────────────────────────────────────────────
    if (want("cutting")) {
      console.log("Backing up cutting fields...");
      const cuttingFields = (await getFields()).filter(
        (f): f is any => f.stage === "cutting"
      );
      const fieldList = await getFieldList();
      const labelOf = (code: string) => fieldList.find((f) => f.code === code)?.label ?? "";
      const fid = (code: string) => labelOf(code) || `Field-${code}`;

      const rows = await Promise.all(
        cuttingFields.map(async (f) => {
          const id = fid(f.fieldCode);
          
          const zoneA = f.zoneA || { plantPhoto: null, cobPhoto: null, height: null, color: null, density: null };
          const zoneB = f.zoneB || { plantPhoto: null, cobPhoto: null, height: null, color: null, density: null };
          const zoneC = f.zoneC || { plantPhoto: null, cobPhoto: null, height: null, color: null, density: null };
          
          const [zaPlant, zaCob, zbPlant, zbCob, zcPlant, zcCob] = await Promise.all([
            safeImg(zoneA.plantPhoto, `${id}_zoneA-plant.jpg`),
            safeImg(zoneA.cobPhoto, `${id}_zoneA-cob.jpg`),
            safeImg(zoneB.plantPhoto, `${id}_zoneB-plant.jpg`),
            safeImg(zoneB.cobPhoto, `${id}_zoneB-cob.jpg`),
            safeImg(zoneC.plantPhoto, `${id}_zoneC-plant.jpg`),
            safeImg(zoneC.cobPhoto, `${id}_zoneC-cob.jpg`),
          ]);
          
          return [
            f.fieldCode, labelOf(f.fieldCode), fmt(f.createdAt),
            zaPlant, zaCob, zoneA.height || "", zoneA.color || "", zoneA.density || "",
            zbPlant, zbCob, zoneB.height || "", zoneB.color || "", zoneB.density || "",
            zcPlant, zcCob, zoneC.height || "", zoneC.color || "", zoneC.density || "",
            f.harvestMethod || "", f.cropCondition || "", f.cuttingHeight || "", f.lodging || "",
          ];
        })
      );
      
      await safeWrite("Field – Cutting", [
        "Field Code", "Label", "Captured At",
        "Zone A – Plant", "Zone A – Cob", "Zone A – Height", "Zone A – Color", "Zone A – Density",
        "Zone B – Plant", "Zone B – Cob", "Zone B – Height", "Zone B – Color", "Zone B – Density",
        "Zone C – Plant", "Zone C – Cob", "Zone C – Height", "Zone C – Color", "Zone C – Density",
        "Harvest Method", "Crop Condition", "Cutting Height", "Lodging",
      ], rows);
    }

    // ── Chopped ───────────────────────────────────────────────
    if (want("chopped")) {
      console.log("Backing up chopped fields...");
      const choppedFields = (await getFields()).filter(
        (f): f is any => f.stage === "chopped"
      );
      const fieldList = await getFieldList();
      const labelOf = (code: string) => fieldList.find((f) => f.code === code)?.label ?? "";
      const fid = (code: string) => labelOf(code) || `Field-${code}`;

      const rows = await Promise.all(
        choppedFields.map(async (f) => {
          const id = fid(f.fieldCode);
          const photo = await safeImg(f.photo, `${id}_chopped_photo.jpg`);
          return [
            f.fieldCode, labelOf(f.fieldCode), fmt(f.createdAt),
            photo, f.chopLength || "", f.uniformity || "", f.materialQuality || "", f.moisture || "",
          ];
        })
      );
      
      await safeWrite("Field – Chopped", [
        "Field Code", "Label", "Captured At", "Photo", "Chop Length", "Uniformity", "Material Quality", "Moisture"
      ], rows);
    }

    // ── Harvest field visits ──────────────────────────────────
    if (want("harvestField")) {
      console.log("Backing up harvest field visits...");
      const harvestFields = await getHarvestFields();
      const farmerPhotoUri = await getFarmerPhoto();
      const farmerUrl = await safeImg(farmerPhotoUri, "farmer-profile_farmer.jpg");

      const rows = await Promise.all(
        harvestFields.map(async (hf) => {
          const shortId = hf.id.substring(0, 8);
          const photos = hf.photos || { overview: null, leaf: null, cob: null };
          const health = hf.health || { plantStand: null, pest: null, disease: null, rainfall: null };
          
          const [overview, leaf, cob] = await Promise.all([
            safeImg(photos.overview, `HVT-${shortId}_harvest-overview.jpg`),
            safeImg(photos.leaf, `HVT-${shortId}_harvest-leaf.jpg`),
            safeImg(photos.cob, `HVT-${shortId}_harvest-cob.jpg`),
          ]);
          
          return [
            hf.id, fmt(hf.createdAt), hf.fieldArea || "", hf.cropType || "",
            health.plantStand || "", health.pest || "",
            health.disease || "", health.rainfall || "",
            farmerUrl, overview, leaf, cob,
          ];
        })
      );
      
      await safeWrite("Harvest – Field Visits", [
        "Visit ID", "Date", "Area (acres)", "Crop Type",
        "Plant Stand", "Pest Pressure", "Disease", "Rainfall",
        "Farmer Photo", "Field Overview", "Leaf Photo", "Cob Photo",
      ], rows);
    }

    // ── Harvest weight records ────────────────────────────────
    if (want("harvestRecord")) {
      console.log("Backing up harvest records...");
      const harvestRecords = await getHarvestRecords();
      const rows = harvestRecords.map((r) => [
        r.id, fmt(r.createdAt), r.harvestFieldId, r.weightKg, r.output,
      ]);
      await safeWrite("Harvest – Records",
        ["Record ID", "Date", "Visit ID", "Weight (kg)", "Output Type"],
        rows
      );
    }

    // ── Post-harvest batches ──────────────────────────────────
    if (want("postHarvest")) {
      console.log("Backing up post-harvest batches...");
      const postHarvest = await getPostHarvestBatches();
      const rows = await Promise.all(
        postHarvest.map(async (b) => {
          const smpId = `SMP-${b.id.substring(0, 8)}`;
          const meta = { fieldId: b.harvestFieldId.substring(0, 8) };
          const photos = b.photos || { storage: null, crossSection: null, sample: null, texture: null };
          
          const [storage, cross, sample, texture] = await Promise.all([
            safeImg(photos.storage, `${smpId}_silage-storage.jpg`, meta),
            safeImg(photos.crossSection, `${smpId}_silage-cross-section.jpg`, meta),
            safeImg(photos.sample, `${smpId}_silage-sample.jpg`, meta),
            safeImg(photos.texture, `${smpId}_silage-texture.jpg`, meta),
          ]);
          
          return [
            b.id, b.batchName || "", fmt(b.createdAt), b.harvestFieldId || "",
            b.ph || "", b.smell || "", b.mold || "",
            storage, cross, sample, texture,
          ];
        })
      );
      
      await safeWrite("Post Harvest – Batches", [
        "Batch ID", "Batch Name", "Date", "Visit ID",
        "pH", "Smell", "Mold",
        "Storage Photo", "Cross Section", "Sample Bag", "Texture",
      ], rows);
    }

    // ── Fields registry (only on full sync) ──────────────────
    if (target === "full") {
      console.log("Backing up fields registry...");
      const [fieldList, allFields] = await Promise.all([getFieldList(), getFields()]);
      const fieldRows = fieldList.map((f) => [
        f.code,
        f.label ?? "",
        f.locationCode ?? "",
        f.state ?? "",
        f.district ?? "",
        f.gps?.latitude ?? "",
        f.gps?.longitude ?? "",
        fmt(f.createdAt),
        allFields
          .filter((c) => c.fieldCode === f.code)
          .map((c) => c.stage.charAt(0).toUpperCase() + c.stage.slice(1))
          .join(", ") || "—",
      ]);
      
      await safeWrite("Fields",
        ["Code", "Label", "Location Code", "State", "District", "Latitude", "Longitude", "Created At", "Stages Completed"],
        fieldRows
      );
    }

    const allErrors = [...errors, ...imageErrors];
    if (allErrors.length > 0) {
      console.warn("Backup completed with errors:", allErrors);
      return { ok: false, error: allErrors.join(" | ") };
    }
    
    console.log("Backup completed successfully");
    return { ok: true };

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Backup failed:", errorMsg);
    return { ok: false, error: errorMsg };
  }
}