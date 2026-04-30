"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_storage_paths_1 = require("../lib/supabase-storage-paths");
function expectEqual(actual, expected, label) {
    if (actual !== expected) {
        throw new Error(`${label}\nExpected: ${expected}\nActual:   ${actual}`);
    }
}
function expectIncludes(actual, expectedFragment, label) {
    if (!actual.includes(expectedFragment)) {
        throw new Error(`${label}\nExpected to include: ${expectedFragment}\nActual: ${actual}`);
    }
}
function testStandingPathsUseFieldCaptureId() {
    const recordId = "fc-123";
    const plantPath = (0, supabase_storage_paths_1.buildStandingPath)(recordId, "a", "plant");
    const leafPath = (0, supabase_storage_paths_1.buildStandingPath)(recordId, "b", "leaf");
    const cobPath = (0, supabase_storage_paths_1.buildStandingPath)(recordId, "c", "cob");
    expectEqual(plantPath, "field-captures/fc-123/zone-a-plant.jpg", "standing plant path");
    expectEqual(leafPath, "field-captures/fc-123/zone-b-leaf.jpg", "standing leaf path");
    expectEqual(cobPath, "field-captures/fc-123/zone-c-cob.jpg", "standing cob path");
}
function testCuttingPathsUseFieldCaptureId() {
    const recordId = "fc-789";
    expectEqual((0, supabase_storage_paths_1.buildCuttingPath)(recordId, "a", "plant"), "field-captures/fc-789/zone-a-plant.jpg", "cutting zone a plant path");
    expectEqual((0, supabase_storage_paths_1.buildCuttingPath)(recordId, "c", "cob"), "field-captures/fc-789/zone-c-cob.jpg", "cutting zone c cob path");
}
function testChoppedPathUsesFieldCaptureId() {
    expectEqual((0, supabase_storage_paths_1.buildChoppedPath)("fc-333"), "field-captures/fc-333/photo.jpg", "chopped photo path");
}
function testHarvestPathsUseVisitId() {
    const visitId = "hv-444";
    expectEqual((0, supabase_storage_paths_1.buildHarvestVisitPath)(visitId, "overview"), "harvest-visits/hv-444/overview.jpg", "harvest overview path");
    expectEqual((0, supabase_storage_paths_1.buildHarvestVisitPath)(visitId, "leaf"), "harvest-visits/hv-444/leaf.jpg", "harvest leaf path");
    expectEqual((0, supabase_storage_paths_1.buildHarvestVisitPath)(visitId, "cob"), "harvest-visits/hv-444/cob.jpg", "harvest cob path");
}
function testPostHarvestPathsUseBatchId() {
    const batchId = "phb-555";
    expectEqual((0, supabase_storage_paths_1.buildPostHarvestPath)(batchId, "storage"), "post-harvest-batches/phb-555/storage.jpg", "post-harvest storage path");
    expectEqual((0, supabase_storage_paths_1.buildPostHarvestPath)(batchId, "cross-section"), "post-harvest-batches/phb-555/cross-section.jpg", "post-harvest cross-section path");
}
function testFarmerPathIsShared() {
    expectEqual((0, supabase_storage_paths_1.buildFarmerProfilePath)(), "harvest-visits/shared/farmer-profile.jpg", "farmer profile path");
}
function testRecordImageAssociationByIdFragment() {
    const recordIds = {
        standing: "standing-record-1",
        cutting: "cutting-record-1",
        chopped: "chopped-record-1",
        harvestVisit: "harvest-visit-1",
        postHarvestBatch: "post-batch-1",
    };
    const associatedPaths = [
        (0, supabase_storage_paths_1.buildStandingPath)(recordIds.standing, "a", "plant"),
        (0, supabase_storage_paths_1.buildCuttingPath)(recordIds.cutting, "b", "cob"),
        (0, supabase_storage_paths_1.buildChoppedPath)(recordIds.chopped),
        (0, supabase_storage_paths_1.buildHarvestVisitPath)(recordIds.harvestVisit, "overview"),
        (0, supabase_storage_paths_1.buildPostHarvestPath)(recordIds.postHarvestBatch, "sample"),
    ];
    expectIncludes(associatedPaths[0], `/${recordIds.standing}/`, "standing association");
    expectIncludes(associatedPaths[1], `/${recordIds.cutting}/`, "cutting association");
    expectIncludes(associatedPaths[2], `/${recordIds.chopped}/`, "chopped association");
    expectIncludes(associatedPaths[3], `/${recordIds.harvestVisit}/`, "harvest visit association");
    expectIncludes(associatedPaths[4], `/${recordIds.postHarvestBatch}/`, "post-harvest association");
}
function run() {
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
