import { type ImageDimensions } from "../terminal-image.js";
import type { Component } from "../tui.js";
export declare function withFullscreenImageFallback<T>(render: () => T): T;
export interface ImageTheme {
    fallbackColor: (str: string) => string;
}
export interface ImageOptions {
    maxWidthCells?: number;
    maxHeightCells?: number;
    filename?: string;
    /** Render metadata instead of terminal graphics. */
    fallbackOnly?: boolean;
    fallbackPrefix?: string;
    /** Kitty image ID. If provided, reuses this ID (for animations/updates). */
    imageId?: number;
}
export declare class Image implements Component {
    private base64Data;
    private mimeType;
    private dimensions;
    private theme;
    private options;
    private imageId?;
    private cachedLines?;
    private cachedWidth?;
    private cachedFullscreenFallback?;
    constructor(base64Data: string, mimeType: string, theme: ImageTheme, options?: ImageOptions, dimensions?: ImageDimensions);
    /** Get the Kitty image ID used by this image (if any). */
    getImageId(): number | undefined;
    invalidate(): void;
    render(width: number): string[];
}
//# sourceMappingURL=image.d.ts.map