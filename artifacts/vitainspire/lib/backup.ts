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

const BACKUP_URL = process.env.EXPO_PUBLIC_BACKUP_URL ?? "";

export function isBackupConfigured(): boolean {
  return BACKUP_URL.length > 0;
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
  if (!uri || !BACKUP_URL) return "";
  const base64 = await uriToBase64(uri);
  if (!base64) return "";
  try {
    const res = await fetch(BACKUP_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ base64, fileName, mimeType: "image/jpeg", metadata: metadata ?? {} }),
    });
    const json = (await res.json()) as { status: string; url?: string };
    return json.status === "success" ? (json.url ?? "") : "";
  } catch {
    return "";
  }
}

async function writeSheet(
  sheetName: string,
  headers: string[],
  rows: unknown[][]
): Promise<void> {
  if (!BACKUP_URL) return;
  const res = await fetch(BACKUP_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ type: "rows", sheetName, headers, rows }),
  });
  const text = await res.text();
  let parsed: { status?: string };
  try { parsed = JSON.parse(text); } catch { parsed = {}; }
  if (parsed.status !== "success") {
    throw new Error(`Sheet "${sheetName}" write failed: ${text.slice(0, 120)}`);
  }
}

// ─── Main backup ─────────────────────────────────────────────

export async function runBackup(): Promise<{ ok: boolean; error?: string }> {
  if (!BACKUP_URL) return { ok: false, error: "No backup URL configured" };

  const sheetErrors: string[] = [];

  async function safeWriteSheet(
    sheetName: string,
    headers: string[],
    rows: unknown[][]
  ): Promise<void> {
    try {
      await writeSheet(sheetName, headers, rows);
    } catch (err) {
      sheetErrors.push(err instanceof Error ? err.message : `${sheetName} failed`);
    }
  }

  try {
    const [fieldList, fields, harvestFields, harvestRecords, postHarvest, farmerPhotoUri] =
      await Promise.all([
        getFieldList(),
        getFields(),
        getHarvestFields(),
        getHarvestRecords(),
        getPostHarvestBatches(),
        getFarmerPhoto(),
      ]);

    const labelOf = (code: string) =>
      fieldList.find((f) => f.code === code)?.label ?? "";

    const fid = (code: string) => {
      const lbl = labelOf(code);
      return lbl || `Field-${code}`;
    };

    // ── Fields registry sheet ──
    const fieldRows = fieldList.map((f) => [
      f.code,
      f.label ?? "",
      f.locationCode ?? "",
      f.state ?? "",
      f.district ?? "",
      f.gps?.latitude ?? "",
      f.gps?.longitude ?? "",
      fmt(f.createdAt),
      fields
        .filter((c) => c.fieldCode === f.code)
        .map((c) => c.stage.charAt(0).toUpperCase() + c.stage.slice(1))
        .join(", ") || "—",
    ]);

    // ── Standing captures ──
    const standingFields = fields.filter((f): f is StandingField => f.stage === "standing");
    const standingRows = await Promise.all(
      standingFields.map(async (f) => {
        const id = fid(f.fieldCode);
        const [plant, leaf, cob] = await Promise.all([
          uploadImage(f.plantPhoto, `${id}_standing-plant.jpg`),
          uploadImage(f.leafPhoto,  `${id}_standing-leafcob.jpg`),
          uploadImage(f.cobPhoto,   `${id}_standing-cob.jpg`),
        ]);
        return [f.fieldCode, labelOf(f.fieldCode), fmt(f.createdAt), plant, leaf, cob];
      })
    );

    // ── Cutting captures ──
    const cuttingFields = fields.filter((f): f is CuttingField => f.stage === "cutting");
    const cuttingRows = await Promise.all(
      cuttingFields.map(async (f) => {
        const id = fid(f.fieldCode);
        const [zaPlant, zaCob, zbPlant, zbCob, zcPlant, zcCob] = await Promise.all([
          uploadImage(f.zoneA?.plantPhoto ?? null, `${id}_zoneA-plant.jpg`),
          uploadImage(f.zoneA?.cobPhoto   ?? null, `${id}_zoneA-cob.jpg`),
          uploadImage(f.zoneB?.plantPhoto ?? null, `${id}_zoneB-plant.jpg`),
          uploadImage(f.zoneB?.cobPhoto   ?? null, `${id}_zoneB-cob.jpg`),
          uploadImage(f.zoneC?.plantPhoto ?? null, `${id}_zoneC-plant.jpg`),
          uploadImage(f.zoneC?.cobPhoto   ?? null, `${id}_zoneC-cob.jpg`),
        ]);
        return [
          f.fieldCode, labelOf(f.fieldCode), fmt(f.createdAt),
          zaPlant, zaCob, f.zoneA?.height ?? "", f.zoneA?.color ?? "", f.zoneA?.density ?? "",
          zbPlant, zbCob, f.zoneB?.height ?? "", f.zoneB?.color ?? "", f.zoneB?.density ?? "",
          zcPlant, zcCob, f.zoneC?.height ?? "", f.zoneC?.color ?? "", f.zoneC?.density ?? "",
          f.harvestMethod ?? "", f.cropCondition ?? "", f.cuttingHeight ?? "", f.lodging ?? "",
        ];
      })
    );

    // ── Chopped captures ──
    const choppedFields = fields.filter((f): f is ChoppedField => f.stage === "chopped");
    const choppedRows = await Promise.all(
      choppedFields.map(async (f) => {
        const id = fid(f.fieldCode);
        const photo = await uploadImage(f.photo, `${id}_chopped_photo.jpg`);
        return [
          f.fieldCode, labelOf(f.fieldCode), fmt(f.createdAt),
          photo, f.chopLength ?? "", f.uniformity ?? "", f.materialQuality ?? "", f.moisture ?? "",
        ];
      })
    );

    // ── Harvest field visits ──
    const farmerUrl = await uploadImage(farmerPhotoUri, "farmer-profile_farmer.jpg");
    const harvestFieldRows = await Promise.all(
      harvestFields.map(async (hf) => {
        const shortId = hf.id.substring(0, 8);
        const [overview, leaf, cob] = await Promise.all([
          uploadImage(hf.photos?.overview ?? null, `HVT-${shortId}_harvest-overview.jpg`),
          uploadImage(hf.photos?.leaf     ?? null, `HVT-${shortId}_harvest-leaf.jpg`),
          uploadImage(hf.photos?.cob      ?? null, `HVT-${shortId}_harvest-cob.jpg`),
        ]);
        return [
          hf.id, fmt(hf.createdAt), hf.fieldArea, hf.cropType,
          hf.health?.plantStand ?? "", hf.health?.pest ?? "",
          hf.health?.disease ?? "", hf.health?.rainfall ?? "",
          farmerUrl, overview, leaf, cob,
        ];
      })
    );

    // ── Harvest weight records ──
    const harvestRecordRows = harvestRecords.map((r) => [
      r.id, fmt(r.createdAt), r.harvestFieldId, r.weightKg, r.output,
    ]);

    // ── Post-harvest batches ──
    const postHarvestRows = await Promise.all(
      postHarvest.map(async (b) => {
        const smpId = `SMP-${b.id.substring(0, 8)}`;
        const meta = { fieldId: b.harvestFieldId.substring(0, 8) };
        const [storage, cross, sample, texture] = await Promise.all([
          uploadImage(b.photos?.storage      ?? null, `${smpId}_silage-storage.jpg`,       meta),
          uploadImage(b.photos?.crossSection ?? null, `${smpId}_silage-cross-section.jpg`, meta),
          uploadImage(b.photos?.sample       ?? null, `${smpId}_silage-sample.jpg`,        meta),
          uploadImage(b.photos?.texture      ?? null, `${smpId}_silage-texture.jpg`,       meta),
        ]);
        return [
          b.id, b.batchName, fmt(b.createdAt), b.harvestFieldId,
          b.ph, b.smell ?? "", b.mold ?? "",
          storage, cross, sample, texture,
        ];
      })
    );

    // ── Write all sheets independently so one failure doesn't block others ──
    await safeWriteSheet("Fields",
      ["Code", "Label", "Location Code", "State", "District", "Latitude", "Longitude", "Created At", "Stages Completed"],
      fieldRows
    );
    await safeWriteSheet("Field – Standing",
      ["Field Code", "Label", "Captured At", "Plant Photo", "Leaf Photo", "Cob Photo"],
      standingRows
    );
    await safeWriteSheet("Field – Cutting", [
      "Field Code", "Label", "Captured At",
      "Zone A – Plant", "Zone A – Cob", "Zone A – Height", "Zone A – Color", "Zone A – Density",
      "Zone B – Plant", "Zone B – Cob", "Zone B – Height", "Zone B – Color", "Zone B – Density",
      "Zone C – Plant", "Zone C – Cob", "Zone C – Height", "Zone C – Color", "Zone C – Density",
      "Harvest Method", "Crop Condition", "Cutting Height", "Lodging",
    ], cuttingRows);
    await safeWriteSheet("Field – Chopped",
      ["Field Code", "Label", "Captured At", "Photo", "Chop Length", "Uniformity", "Material Quality", "Moisture"],
      choppedRows
    );
    await safeWriteSheet("Harvest – Field Visits", [
      "Visit ID", "Date", "Area (acres)", "Crop Type",
      "Plant Stand", "Pest Pressure", "Disease", "Rainfall",
      "Farmer Photo", "Field Overview", "Leaf Photo", "Cob Photo",
    ], harvestFieldRows);
    await safeWriteSheet("Harvest – Records",
      ["Record ID", "Date", "Visit ID", "Weight (kg)", "Output Type"],
      harvestRecordRows
    );
    await safeWriteSheet("Post Harvest – Batches", [
      "Batch ID", "Batch Name", "Date", "Visit ID",
      "pH", "Smell", "Mold",
      "Storage Photo", "Cross Section", "Sample Bag", "Texture",
    ], postHarvestRows);

    if (sheetErrors.length > 0) {
      return { ok: false, error: sheetErrors.join(" | ") };
    }

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
