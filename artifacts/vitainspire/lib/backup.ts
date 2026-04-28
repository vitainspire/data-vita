import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

import {
  ChoppedField,
  CuttingField,
  getFarmerPhoto,
  getFieldList,
  getFields,
  getHarvestFields,
  getHarvestRecords,
  getPostHarvestBatches,
  StandingField,
} from "./storage";

const DRIVE_URL  = process.env.EXPO_PUBLIC_DRIVE_URL  ?? "";
const SHEETS_URL = process.env.EXPO_PUBLIC_SHEETS_URL ?? "";

export type BackupTarget =
  | "standing"
  | "cutting"
  | "chopped"
  | "harvestField"
  | "harvestRecord"
  | "postHarvest"
  | "full";

export function isBackupConfigured(): boolean {
  return DRIVE_URL.length > 0 && SHEETS_URL.length > 0;
}

// ─── Helpers ─────────────────────────────────────────────────

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

function fmt(ts: number | undefined): string {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

async function uploadImage(
  uri: string | null,
  fileName: string,
  metadata?: Record<string, string>
): Promise<string> {
  if (!uri || !DRIVE_URL) return "";

  const base64 = await uriToBase64(uri);
  if (!base64) return "";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(DRIVE_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ base64, fileName, mimeType: "image/jpeg", metadata: metadata ?? {} }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const text = await res.text();
    let json: { status: string; url?: string; message?: string };
    try { json = JSON.parse(text); } catch { throw new Error(`${fileName}: bad response`); }
    if (json.status !== "success") throw new Error(`${fileName}: ${json.message ?? "upload failed"}`);
    return json.url ?? "";
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${fileName}: upload timeout`);
    }
    throw error;
  }
}

// Safe wrapper — returns "" and collects errors instead of throwing.
function img(
  errors: string[],
  uri: string | null,
  fileName: string,
  metadata?: Record<string, string>
): Promise<string> {
  if (!uri || uri.trim() === "") return Promise.resolve("");
  return uploadImage(uri, fileName, metadata).catch((e: unknown) => {
    errors.push(`Image upload failed: ${fileName} – ${e instanceof Error ? e.message : String(e)}`);
    return "";
  });
}

async function writeSheet(
  sheetName: string,
  headers: string[],
  rows: unknown[][]
): Promise<void> {
  if (!SHEETS_URL) return;
  const sanitizedRows = rows.map((row) =>
    row.map((cell) => {
      if (cell === null || cell === undefined) return "";
      if (typeof cell === "string" || typeof cell === "number") return cell;
      return String(cell);
    })
  );
  const res = await fetch(SHEETS_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ type: "rows", sheetName, headers, rows: sanitizedRows }),
  });
  const text = await res.text();
  let parsed: { status?: string; message?: string };
  try { parsed = JSON.parse(text); } catch { parsed = {}; }
  if (parsed.status !== "success") {
    throw new Error(`Sheet "${sheetName}" write failed: ${text.slice(0, 200)}`);
  }
}

// ─── Google Apps Script Backup ──────────────────────────────

async function runGoogleBackup(target: BackupTarget): Promise<{ ok: boolean; error?: string }> {
  const errors: string[] = [];
  const imageErrors: string[] = [];

  async function safeWrite(name: string, headers: string[], rows: unknown[][]): Promise<void> {
    try { await writeSheet(name, headers, rows); }
    catch (e) { errors.push(e instanceof Error ? e.message : String(e)); }
  }

  const u = (uri: string | null, name: string, meta?: Record<string, string>) =>
    img(imageErrors, uri, name, meta);

  try {
    const want = (t: BackupTarget) => target === "full" || target === t;

    // ── Standing ──────────────────────────────────────────────
    if (want("standing")) {
      const standingFields = (await getFields()).filter(
        (f): f is StandingField => f.stage === "standing"
      );
      const fieldList = await getFieldList();
      const labelOf = (code: string) => fieldList.find((f) => f.code === code)?.label ?? "";
      const fid = (code: string) => labelOf(code) || `Field-${code}`;

      const rows = await Promise.all(
        standingFields.map(async (f) => {
          const id = fid(f.fieldCode);
          const zA = f.zoneA ?? {};
          const zB = f.zoneB ?? {};
          const zC = f.zoneC ?? {};
          const smeta = { stage: "standing", fieldId: id };
          const [zaPlant, zaLeaf, zaCob, zbPlant, zbLeaf, zbCob, zcPlant, zcLeaf, zcCob] =
            await Promise.all([
              u(zA.plantPhoto ?? null, `${id}_zoneA-plant.jpg`, smeta),
              u(zA.leafPhoto ?? null,  `${id}_zoneA-leaf.jpg`,  smeta),
              u(zA.cobPhoto ?? null,   `${id}_zoneA-cob.jpg`,   smeta),
              u(zB.plantPhoto ?? null, `${id}_zoneB-plant.jpg`, smeta),
              u(zB.leafPhoto ?? null,  `${id}_zoneB-leaf.jpg`,  smeta),
              u(zB.cobPhoto ?? null,   `${id}_zoneB-cob.jpg`,   smeta),
              u(zC.plantPhoto ?? null, `${id}_zoneC-plant.jpg`, smeta),
              u(zC.leafPhoto ?? null,  `${id}_zoneC-leaf.jpg`,  smeta),
              u(zC.cobPhoto ?? null,   `${id}_zoneC-cob.jpg`,   smeta),
            ]);
          return [
            f.fieldCode, labelOf(f.fieldCode), fmt(f.createdAt),
            zaPlant, zaLeaf, zaCob,
            zbPlant, zbLeaf, zbCob,
            zcPlant, zcLeaf, zcCob,
            zA.height ?? "", zA.color ?? "", zA.density ?? "",
            zB.height ?? "", zB.color ?? "", zB.density ?? "",
            zC.height ?? "", zC.color ?? "", zC.density ?? "",
          ];
        })
      );
      await safeWrite("Field – Standing", [
        "Field Code", "Label", "Captured At",
        "Zone A – Plant", "Zone A – Leaf", "Zone A – Cob",
        "Zone B – Plant", "Zone B – Leaf", "Zone B – Cob",
        "Zone C – Plant", "Zone C – Leaf", "Zone C – Cob",
        "Zone A – Height", "Zone A – Color", "Zone A – Density",
        "Zone B – Height", "Zone B – Color", "Zone B – Density",
        "Zone C – Height", "Zone C – Color", "Zone C – Density",
      ], rows);
    }

    // ── Cutting ───────────────────────────────────────────────
    if (want("cutting")) {
      const cuttingFields = (await getFields()).filter(
        (f): f is CuttingField => f.stage === "cutting"
      );
      const fieldList = await getFieldList();
      const labelOf = (code: string) => fieldList.find((f) => f.code === code)?.label ?? "";
      const fid = (code: string) => labelOf(code) || `Field-${code}`;

      const rows = await Promise.all(
        cuttingFields.map(async (f) => {
          const id = fid(f.fieldCode);
          const zA = f.zoneA ?? {};
          const zB = f.zoneB ?? {};
          const zC = f.zoneC ?? {};
          const cmeta = { stage: "cutting", fieldId: id };
          const [zaPlant, zaCob, zbPlant, zbCob, zcPlant, zcCob] = await Promise.all([
            u(zA.plantPhoto ?? null, `${id}_zoneA-plant.jpg`, cmeta),
            u(zA.cobPhoto ?? null,   `${id}_zoneA-cob.jpg`,   cmeta),
            u(zB.plantPhoto ?? null, `${id}_zoneB-plant.jpg`, cmeta),
            u(zB.cobPhoto ?? null,   `${id}_zoneB-cob.jpg`,   cmeta),
            u(zC.plantPhoto ?? null, `${id}_zoneC-plant.jpg`, cmeta),
            u(zC.cobPhoto ?? null,   `${id}_zoneC-cob.jpg`,   cmeta),
          ]);
          return [
            f.fieldCode, labelOf(f.fieldCode), fmt(f.createdAt),
            zaPlant, zaCob, zA.height ?? "", zA.color ?? "", zA.density ?? "",
            zbPlant, zbCob, zB.height ?? "", zB.color ?? "", zB.density ?? "",
            zcPlant, zcCob, zC.height ?? "", zC.color ?? "", zC.density ?? "",
            f.harvestMethod ?? "", f.cropCondition ?? "", f.cuttingHeight ?? "", f.lodging ?? "",
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
      const choppedFields = (await getFields()).filter(
        (f): f is ChoppedField => f.stage === "chopped"
      );
      const fieldList = await getFieldList();
      const labelOf = (code: string) => fieldList.find((f) => f.code === code)?.label ?? "";
      const fid = (code: string) => labelOf(code) || `Field-${code}`;

      const rows = await Promise.all(
        choppedFields.map(async (f) => {
          const id = fid(f.fieldCode);
          const photo = await u(f.photo ?? null, `${id}_chopped-photo.jpg`, { stage: "chopped", fieldId: id });
          return [
            f.fieldCode, labelOf(f.fieldCode), fmt(f.createdAt),
            photo, f.chopLength ?? "", f.uniformity ?? "", f.materialQuality ?? "", f.moisture ?? "",
          ];
        })
      );
      await safeWrite("Field – Chopped",
        ["Field Code", "Label", "Captured At", "Photo", "Chop Length", "Uniformity", "Material Quality", "Moisture"],
        rows
      );
    }

    // ── Harvest field visits ──────────────────────────────────
    if (want("harvestField")) {
      const harvestFields = await getHarvestFields();
      const farmerPhotoUri = await getFarmerPhoto();
      const farmerUrl = await u(farmerPhotoUri, "farmer-profile_farmer.jpg");

      const rows = await Promise.all(
        harvestFields.map(async (hf) => {
          const shortId = hf.id.substring(0, 8);
          const photos = hf.photos ?? {};
          const health = hf.health ?? {};
          const [overview, leaf, cob] = await Promise.all([
            u(photos.overview ?? null, `HVT-${shortId}_harvest-overview.jpg`),
            u(photos.leaf ?? null,     `HVT-${shortId}_harvest-leaf.jpg`),
            u(photos.cob ?? null,      `HVT-${shortId}_harvest-cob.jpg`),
          ]);
          return [
            hf.id, fmt(hf.createdAt), hf.fieldArea ?? "", hf.cropType ?? "",
            health.plantStand ?? "", health.pest ?? "",
            health.disease ?? "", health.rainfall ?? "",
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
      const harvestRecords = await getHarvestRecords();
      const rows = harvestRecords.map((r) => [
        r.id, fmt(r.createdAt), r.harvestFieldId, r.weightKg, r.output ?? "",
      ]);
      await safeWrite("Harvest – Records",
        ["Record ID", "Date", "Visit ID", "Weight (kg)", "Output Type"],
        rows
      );
    }

    // ── Post-harvest batches ──────────────────────────────────
    if (want("postHarvest")) {
      const postHarvest = await getPostHarvestBatches();
      const rows = await Promise.all(
        postHarvest.map(async (b) => {
          const smpId = `SMP-${b.id.substring(0, 8)}`;
          const meta = { fieldId: b.harvestFieldId.substring(0, 8) };
          const photos = b.photos ?? {};
          const [storage, cross, sample, texture] = await Promise.all([
            u(photos.storage ?? null,      `${smpId}_silage-storage.jpg`, meta),
            u(photos.crossSection ?? null, `${smpId}_silage-cross-section.jpg`, meta),
            u(photos.sample ?? null,       `${smpId}_silage-sample.jpg`, meta),
            u(photos.texture ?? null,      `${smpId}_silage-texture.jpg`, meta),
          ]);
          return [
            b.id, b.batchName ?? "", fmt(b.createdAt), b.harvestFieldId,
            b.ph ?? "", b.smell ?? "", b.mold ?? "",
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

    // ── Fields registry (full sync only) ─────────────────────
    if (target === "full") {
      const [fieldList, allFields] = await Promise.all([getFieldList(), getFields()]);
      const fieldRows = fieldList.map((f) => [
        f.code, f.label ?? "", f.locationCode ?? "",
        f.state ?? "", f.district ?? "",
        f.gps?.latitude ?? "", f.gps?.longitude ?? "",
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
    return allErrors.length > 0
      ? { ok: false, error: allErrors.join(" | ") }
      : { ok: true };

  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Public API ───────────────────────────────────────────────

export async function runBackup(
  target: BackupTarget = "full"
): Promise<{ ok: boolean; error?: string }> {
  if (!DRIVE_URL || !SHEETS_URL) {
    return {
      ok: false,
      error: "Backup not configured. Add EXPO_PUBLIC_DRIVE_URL and EXPO_PUBLIC_SHEETS_URL to .env and restart Expo.",
    };
  }
  return runGoogleBackup(target);
}
