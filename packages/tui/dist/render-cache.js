export class VersionedRenderCache {
    cachedWidth;
    cachedVersion;
    cachedLines;
    get(width, version) {
        if (this.cachedWidth === width && this.cachedVersion === version) {
            return this.cachedLines;
        }
        return undefined;
    }
    set(width, version, lines) {
        this.cachedWidth = width;
        this.cachedVersion = version;
        this.cachedLines = lines;
        return lines;
    }
    invalidate() {
        this.cachedWidth = undefined;
        this.cachedVersion = undefined;
        this.cachedLines = undefined;
    }
}
//# sourceMappingURL=render-cache.js.map