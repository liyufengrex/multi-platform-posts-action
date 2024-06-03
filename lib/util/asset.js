"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssetUrl = void 0;
const ASSETS_PATH = 'https://raw.githubusercontent.com/liyufengrex/multi-platform-posts-action/main/assets/';
function getAssetUrl(asset) {
    return ASSETS_PATH + asset;
}
exports.getAssetUrl = getAssetUrl;
