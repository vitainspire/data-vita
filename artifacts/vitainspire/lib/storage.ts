import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  fields: "vitainspire:fields",
  harvestFields: "vitainspire:harvestFields",
  harvestRecords: "vitainspire:harvestRecords",
  postHarvest: "vitainspire:postHarvest",
  farmerPhoto: "vitainspire:farmerPhoto",
};

export function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 11);
}

export type FieldStage = "standing" | "cutting" | "chopped";

export type StandingField = {
  id: string;
  stage: "standing";
  createdAt: number;
  plantPhoto: string | null;
  leafPhoto: string | null;
  cobPhoto: string | null;
};

export type ZoneData = {
  plantPhoto: string | null;
  cobPhoto: string | null;
  height: string | null;
  color: string | null;
  density: string | null;
};

export type CuttingField = {
  id: string;
  stage: "cutting";
  createdAt: number;
  zoneA: ZoneData;
  zoneB: ZoneData;
  zoneC: ZoneData;
};

export type ChoppedField = {
  id: string;
  stage: "chopped";
  createdAt: number;
  photo: string | null;
  chopSize: string | null;
  moisture: string | null;
};

export type FieldRecord = StandingField | CuttingField | ChoppedField;

export type HarvestField = {
  id: string;
  createdAt: number;
  fieldArea: string;
  cropType: string;
  health: {
    plantStand: string | null;
    pest: string | null;
    disease: string | null;
    rainfall: string | null;
  };
  photos: {
    overview: string | null;
    leaf: string | null;
    cob: string | null;
  };
  farmerPhoto: string | null;
};

export type HarvestRecord = {
  id: string;
  createdAt: number;
  harvestFieldId: string;
  weightKg: string;
  output: string;
};

export type PostHarvestBatch = {
  id: string;
  createdAt: number;
  harvestFieldId: string;
  batchName: string;
  photos: {
    storage: string | null;
    crossSection: string | null;
    sample: string | null;
    texture: string | null;
  };
  ph: string;
  smell: string | null;
  mold: string | null;
};

async function readList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function getFields(): Promise<FieldRecord[]> {
  return readList<FieldRecord>(KEYS.fields);
}

export async function saveField(field: FieldRecord): Promise<void> {
  const all = await getFields();
  all.unshift(field);
  await writeList(KEYS.fields, all);
}

export async function getHarvestFields(): Promise<HarvestField[]> {
  return readList<HarvestField>(KEYS.harvestFields);
}

export async function saveHarvestField(field: HarvestField): Promise<void> {
  const all = await getHarvestFields();
  all.unshift(field);
  await writeList(KEYS.harvestFields, all);
}

export async function getHarvestRecords(): Promise<HarvestRecord[]> {
  return readList<HarvestRecord>(KEYS.harvestRecords);
}

export async function saveHarvestRecord(record: HarvestRecord): Promise<void> {
  const all = await getHarvestRecords();
  all.unshift(record);
  await writeList(KEYS.harvestRecords, all);
}

export async function getPostHarvestBatches(): Promise<PostHarvestBatch[]> {
  return readList<PostHarvestBatch>(KEYS.postHarvest);
}

export async function savePostHarvestBatch(
  batch: PostHarvestBatch,
): Promise<void> {
  const all = await getPostHarvestBatches();
  all.unshift(batch);
  await writeList(KEYS.postHarvest, all);
}

export async function getFarmerPhoto(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.farmerPhoto);
}

export async function setFarmerPhoto(uri: string | null): Promise<void> {
  if (uri === null) {
    await AsyncStorage.removeItem(KEYS.farmerPhoto);
  } else {
    await AsyncStorage.setItem(KEYS.farmerPhoto, uri);
  }
}
