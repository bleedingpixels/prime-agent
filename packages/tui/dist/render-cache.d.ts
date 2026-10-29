export declare class VersionedRenderCache {
    private cachedWidth?;
    private cachedVersion?;
    private cachedLines?;
    get(width: number, version: number): string[] | undefined;
    set(width: number, version: number, lines: string[]): string[];
    invalidate(): void;
}
//# sourceMappingURL=render-cache.d.ts.map