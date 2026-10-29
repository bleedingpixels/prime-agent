/**
 * Best-effort LaTeX math to Unicode plain text conversion for terminal display.
 *
 * The goal is readable math in a monospace grid, not faithful typesetting:
 * symbols map to their Unicode equivalents (\sum → ∑, \alpha → α), scripts use
 * Unicode sub/superscript characters when every character is available
 * (x_{t-k} → xₜ₋ₖ) and stay in TeX notation otherwise (x_\theta → x_θ), and
 * structural commands degrade to linear notation (\frac{a}{b} → a/b).
 * Unknown commands keep their name with the backslash dropped, so output is
 * never worse than the raw source.
 */
/**
 * Convert LaTeX math source to Unicode plain text.
 *
 * Newlines in the source are preserved and "\\" becomes a newline, so
 * multi-line display math (aligned environments) renders on multiple lines.
 * Runs of spaces collapse to one — TeX treats source whitespace as
 * insignificant, and spacing commands otherwise leave double gaps.
 */
export declare function latexToUnicode(tex: string): string;
//# sourceMappingURL=latex.d.ts.map