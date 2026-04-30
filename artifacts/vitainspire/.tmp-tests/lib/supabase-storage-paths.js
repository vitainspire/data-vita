"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFieldCapturePath = buildFieldCapturePath;
exports.buildStandingPath = buildStandingPath;
exports.buildCuttingPath = buildCuttingPath;
exports.buildChoppedPath = buildChoppedPath;
exports.buildHarvestVisitPath = buildHarvestVisitPath;
exports.buildFarmerProfilePath = buildFarmerProfilePath;
exports.buildPostHarvestPath = buildPostHarvestPath;
function buildFieldCapturePath(fieldCaptureId, imageName) {
    return `field-captures/${fieldCaptureId}/${imageName}.jpg`;
}
function buildStandingPath(fieldCaptureId, zone, kind) {
    return buildFieldCapturePath(fieldCaptureId, `zone-${zone}-${kind}`);
}
function buildCuttingPath(fieldCaptureId, zone, kind) {
    return buildFieldCapturePath(fieldCaptureId, `zone-${zone}-${kind}`);
}
function buildChoppedPath(fieldCaptureId) {
    return buildFieldCapturePath(fieldCaptureId, "photo");
}
function buildHarvestVisitPath(harvestVisitId, kind) {
    return `harvest-visits/${harvestVisitId}/${kind}.jpg`;
}
function buildFarmerProfilePath() {
    return "harvest-visits/shared/farmer-profile.jpg";
}
function buildPostHarvestPath(postHarvestBatchId, kind) {
    return `post-harvest-batches/${postHarvestBatchId}/${kind}.jpg`;
}
