import {
  buildChoppedPath,
  buildCuttingPath,
  buildFarmerProfilePath,
  buildHarvestVisitPath,
  buildPostHarvestPath,
  buildStandingPath,
} from "../lib/supabase-storage-paths";

function expectEqual(actual: string, expected: string, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}\nExpected: ${expected}\nActual:   ${actual}`);
  }
}

function expectIncludes(actual: string, expectedFragment: string, label: string): void {
  if (!actual.includes(expectedFragment)) {
    throw new Error(`${label}\nExpected to include: ${expectedFragment}\nActual: ${actual}`);
  }
}

function testStandingPathsUseFieldCaptureId(): void {
  const recordId = "fc-123";
  const plantPath = buildStandingPath(recordId, "a", "plant");
  const leafPath = buildStandingPath(recordId, "b", "leaf");
  const cobPath = buildStandingPath(recordId, "c", "cob");

  expectEqual(plantPath, "field-captures/fc-123/zone-a-plant.jpg", "standing plant path");
  expectEqual(leafPath, "field-captures/fc-123/zone-b-leaf.jpg", "standing leaf path");
  expectEqual(cobPath, "field-captures/fc-123/zone-c-cob.jpg", "standing cob path");
}

function testCuttingPathsUseFieldCaptureId(): void {
  const recordId = "fc-789";
  expectEqual(
    buildCuttingPath(recordId, "a", "plant"),
    "field-captures/fc-789/zone-a-plant.jpg",
    "cutting zone a plant path",
  );
  expectEqual(
    buildCuttingPath(recordId, "c", "cob"),
    "field-captures/fc-789/zone-c-cob.jpg",
    "cutting zone c cob path",
  );
}

function testChoppedPathUsesFieldCaptureId(): void {
  expectEqual(buildChoppedPath("fc-333"), "field-captures/fc-333/photo.jpg", "chopped photo path");
}

function testHarvestPathsUseVisitId(): void {
  const visitId = "hv-444";
  expectEqual(
    buildHarvestVisitPath(visitId, "overview"),
    "harvest-visits/hv-444/overview.jpg",
    "harvest overview path",
  );
  expectEqual(
    buildHarvestVisitPath(visitId, "leaf"),
    "harvest-visits/hv-444/leaf.jpg",
    "harvest leaf path",
  );
  expectEqual(
    buildHarvestVisitPath(visitId, "cob"),
    "harvest-visits/hv-444/cob.jpg",
    "harvest cob path",
  );
}

function testPostHarvestPathsUseBatchId(): void {
  const batchId = "phb-555";
  expectEqual(
    buildPostHarvestPath(batchId, "storage"),
    "post-harvest-batches/phb-555/storage.jpg",
    "post-harvest storage path",
  );
  expectEqual(
    buildPostHarvestPath(batchId, "cross-section"),
    "post-harvest-batches/phb-555/cross-section.jpg",
    "post-harvest cross-section path",
  );
}

function testFarmerPathIsShared(): void {
  expectEqual(
    buildFarmerProfilePath(),
    "harvest-visits/shared/farmer-profile.jpg",
    "farmer profile path",
  );
}

function testRecordImageAssociationByIdFragment(): void {
  const recordIds = {
    standing: "standing-record-1",
    cutting: "cutting-record-1",
    chopped: "chopped-record-1",
    harvestVisit: "harvest-visit-1",
    postHarvestBatch: "post-batch-1",
  };

  const associatedPaths = [
    buildStandingPath(recordIds.standing, "a", "plant"),
    buildCuttingPath(recordIds.cutting, "b", "cob"),
    buildChoppedPath(recordIds.chopped),
    buildHarvestVisitPath(recordIds.harvestVisit, "overview"),
    buildPostHarvestPath(recordIds.postHarvestBatch, "sample"),
  ];

  expectIncludes(associatedPaths[0], `/${recordIds.standing}/`, "standing association");
  expectIncludes(associatedPaths[1], `/${recordIds.cutting}/`, "cutting association");
  expectIncludes(associatedPaths[2], `/${recordIds.chopped}/`, "chopped association");
  expectIncludes(associatedPaths[3], `/${recordIds.harvestVisit}/`, "harvest visit association");
  expectIncludes(associatedPaths[4], `/${recordIds.postHarvestBatch}/`, "post-harvest association");
}

function run(): void {
  testStandingPathsUseFieldCaptureId();
  testCuttingPathsUseFieldCaptureId();
  testChoppedPathUsesFieldCaptureId();
  testHarvestPathsUseVisitId();
  testPostHarvestPathsUseBatchId();
  testFarmerPathIsShared();
  testRecordImageAssociationByIdFragment();
  console.log("✅ supabase-storage-paths tests passed");
}

run();
