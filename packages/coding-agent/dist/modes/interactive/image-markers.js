/**
 * Pasted images are represented in the editor as `[image #N]` markers while the
 * image bytes are held aside in a registry keyed by N. The markers present in
 * the submitted text decide which images are attached to the prompt, so deleting
 * a marker drops its image and restoring it (undo, history, retry) brings it back
 * as long as the bytes are still in the registry.
 */
/** Matches `[image #N]` markers inserted when an image is pasted into the editor. */
const IMAGE_MARKER_REGEX = /\[image #(\d+)\]/g;
/** The marker text inserted into the editor for pasted image `id`. */
export function formatImageMarker(id) {
    return `[image #${id}]`;
}
/** Marker ids that appear in `text`, in order of appearance. */
export function imageMarkerIds(text) {
    return [...text.matchAll(IMAGE_MARKER_REGEX)]
        .map((match) => Number(match[1]))
        .filter((id) => Number.isSafeInteger(id));
}
/** Replace every image-marker spelling whose numeric id appears in `remaps`. */
export function remapImageMarkers(text, remaps) {
    return text.replace(IMAGE_MARKER_REGEX, (marker, id) => {
        const replacement = remaps.get(Number(id));
        return replacement === undefined ? marker : formatImageMarker(replacement);
    });
}
/**
 * Images from `pending` whose marker still appears in `text`, in paste order
 * (the map's insertion order). Each image is returned at most once even if its
 * marker is duplicated in the text.
 */
export function collectMarkedImages(pending, text) {
    if (pending.size === 0) {
        return [];
    }
    const present = new Set(imageMarkerIds(text));
    const images = [];
    for (const [id, image] of pending) {
        if (present.has(id)) {
            images.push(image);
        }
    }
    return images;
}
/**
 * Evict oldest entries (insertion order) from `images` until the total of
 * `sizeOf` is within `maxBytes`. Ids in `keep` are never evicted, so an image
 * whose marker is still live retains its bytes even if that holds the total
 * above the cap.
 */
export function evictImagesToBudget(images, sizeOf, maxBytes, keep) {
    let total = 0;
    for (const value of images.values()) {
        total += sizeOf(value);
    }
    for (const key of [...images.keys()]) {
        if (total <= maxBytes) {
            break;
        }
        if (keep.has(key)) {
            continue;
        }
        const value = images.get(key);
        if (value !== undefined) {
            total -= sizeOf(value);
            images.delete(key);
        }
    }
}
//# sourceMappingURL=image-markers.js.map