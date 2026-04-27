import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  fieldList: "vitainspire:fieldList",
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

export type Field = {
  code: string;
  createdAt: number;
  label?: string;
};

export type StandingField = {
  id: string;
  fieldCode: string;
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
  fieldCode: string;
  stage: "cutting";
  createdAt: number;
  zoneA: ZoneData;
  zoneB: ZoneData;
  zoneC: ZoneData;
};

export type ChoppedField = {
  id: string;
  fieldCode: string;
  stage: "chopped";
  createdAt: number;
  photo: string | null;
  chopSize: string | null;
  moisture: string | null;
};

export type FieldRecord = StandingField | CuttingField | ChoppedField;

export type FieldGroup = {
  code: string;
  createdAt: number;
  lastUpdated: number;
  stages: {
    standing?: StandingField;
    cutting?: CuttingField;
    chopped?: ChoppedField;
  };
};

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

export async function getFieldList(): Promise<Field[]> {
  return readList<Field>(KEYS.fieldList);
}

export async function addField(field: Field): Promise<void> {
  const all = await getFieldList();
  if (all.some((f) => f.code === field.code)) return;
  all.unshift(field);
  await writeList(KEYS.fieldList, all);
}

export async function deleteField(code: string): Promise<void> {
  const all = await getFieldList();
  await writeList(
    KEYS.fieldList,
    all.filter((f) => f.code !== code),
  );
  const captures = await getFields();
  await writeList(
    KEYS.fields,
    captures.filter((c) => c.fieldCode !== code),
  );
}

export async function getNextFieldCode(): Promise<string> {
  const all = await getFieldList();
  let max = 0;
  for (const f of all) {
    const m = f.code.match(/AP-KNL-(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  const next = (max + 1).toString().padStart(3, "0");
  return `AP-KNL-${next}`;
}

export async function getFields(): Promise<FieldRecord[]> {
  return readList<FieldRecord>(KEYS.fields);
}

export async function saveField(field: FieldRecord): Promise<void> {
  const all = await getFields();
  all.unshift(field);
  await writeList(KEYS.fields, all);
  await addField({ code: field.fieldCode, createdAt: field.createdAt });
}

export async function getFieldGroups(): Promise<FieldGroup[]> {
  const [list, captures] = await Promise.all([getFieldList(), getFields()]);
  const map = new Map<string, FieldGroup>();
  for (const f of list) {
    map.set(f.code, {
      code: f.code,
      createdAt: f.createdAt,
      lastUpdated: f.createdAt,
      stages: {},
    });
  }
  for (const c of captures) {
    let group = map.get(c.fieldCode);
    if (!group) {
      group = {
        code: c.fieldCode,
        createdAt: c.createdAt,
        lastUpdated: c.createdAt,
        stages: {},
      };
      map.set(c.fieldCode, group);
    }
    group.lastUpdated = Math.max(group.lastUpdated, c.createdAt);
    if (c.stage === "standing") group.stages.standing = c;
    if (c.stage === "cutting") group.stages.cutting = c;
    if (c.stage === "chopped") group.stages.chopped = c;
  }
  return Array.from(map.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
}

export async function getFieldGroup(code: string): Promise<FieldGroup | null> {
  const all = await getFieldGroups();
  return all.find((g) => g.code === code) || null;
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
