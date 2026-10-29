export interface RenderDiffOptions {
    /** File path (unused, kept for API compatibility) */
    filePath?: string;
}
/**
 * Render a diff string with colored lines and intra-line change highlighting.
 * - Context lines: dim/gray
 * - Removed lines: red, with inverse on changed tokens
 * - Added lines: green, with inverse on changed tokens
 */
export declare function renderDiff(diffText: string, _options?: RenderDiffOptions): string;
export interface RichDiffOptions {
    /** Language id for syntax highlighting the diff content (e.g. "typescript"). */
    language?: string;
}
/** A dim `⋮` row separating non-adjacent hunks of one file's diff. */
export declare function renderDiffSeparator(contentWidth: number): string;
/** Render a unified diff as full-width rows: green/red blocks, syntax-highlighted. */
export declare function renderRichDiff(diffText: string, contentWidth: number, options?: RichDiffOptions): string[];
//# sourceMappingURL=diff.d.ts.map