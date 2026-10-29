/**
 * Pasted images are represented in the editor as `[image #N]` markers while the
 * image bytes are held aside in a registry keyed by N. The markers present in
 * the submitted text decide which images are attached to the prompt, so deleting
 * a marker drops its image and restoring it (undo, history, retry) brings it back
 * as long as the bytes are still in the registry.
 */
/** The marker text inserted into the editor for pasted image `id`. */
export declare function formatImageMarker(id: number): string;
/** Marker ids that appear in `text`, in order of appearance. */
export declare function imageMarkerIds(text: string): number[];
/** Replace every image-marker spelling whose numeric id appears in `remaps`. */
export declare function remapImageMarkers(text: string, remaps: ReadonlyMap<number, number>): string;
/**
 * Images from `pending` whose marker still appears in `text`, in paste order
 * (the map's insertion order). Each image is returned at most once even if its
 * marker is duplicated in the text.
 */
export declare function collectMarkedImages<T>(pending: ReadonlyMap<number, T>, text: string): T[];
/**
 * Evict oldest entries (insertion order) from `images` until the total of
 * `sizeOf` is within `maxBytes`. Ids in `keep` are never evicted, so an image
 * whose marker is still live retains its bytes even if that holds the total
 * above the cap.
 */
export declare function evictImagesToBudget<T>(images: Map<number, T>, sizeOf: (value: T) => number, maxBytes: number, keep: ReadonlySet<number>): void;
//# sourceMappingURL=image-markers.d.ts.map