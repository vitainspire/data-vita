export type Zone = "a" | "b" | "c";
export type StandingImageKind = "plant" | "leaf" | "cob";
export type CuttingImageKind = "plant" | "cob";
export type HarvestVisitImageKind = "overview" | "leaf" | "cob";
export type PostHarvestImageKind = "storage" | "cross-section" | "sample" | "texture";

export function buildFieldCapturePath(
  fieldCaptureId: string,
  imageName: string,
): string {
  return `field-captures/${fieldCaptureId}/${imageName}.jpg`;
}

export function buildStandingPath(
  fieldCaptureId: string,
  zone: Zone,
  kind: StandingImageKind,
): string {
  return buildFieldCapturePath(fieldCaptureId, `zone-${zone}-${kind}`);
}

export function buildCuttingPath(
  fieldCaptureId: string,
  zone: Zone,
  kind: CuttingImageKind,
): string {
  return buildFieldCapturePath(fieldCaptureId, `zone-${zone}-${kind}`);
}

export function buildChoppedPath(fieldCaptureId: string): string {
  return buildFieldCapturePath(fieldCaptureId, "photo");
}

export function buildHarvestVisitPath(
  harvestVisitId: string,
  kind: HarvestVisitImageKind,
): string {
  return `harvest-visits/${harvestVisitId}/${kind}.jpg`;
}

export function buildFarmerProfilePath(): string {
  return "harvest-visits/shared/farmer-profile.jpg";
}

export function buildPostHarvestPath(
  postHarvestBatchId: string,
  kind: PostHarvestImageKind,
): string {
  return `post-harvest-batches/${postHarvestBatchId}/${kind}.jpg`;
}
