/**
 * Utilities for formatting keybinding hints in the UI.
 */
import { getKeybindings } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.js";
function normalizeKeyPart(part) {
    return part === "escape" ? "esc" : part;
}
function formatArrowKey(part) {
    switch (part) {
        case "up":
            return "↑";
        case "down":
            return "↓";
        case "left":
            return "←";
        case "right":
            return "→";
        default:
            return undefined;
    }
}
function formatKeyPart(part, platform) {
    const normalized = normalizeKeyPart(part);
    const arrow = formatArrowKey(normalized);
    if (arrow)
        return arrow;
    // Terminals send the literal Control key on macOS, so never label it Cmd.
    if (platform === "darwin" && normalized === "alt") {
        return "Option";
    }
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
export function formatKeyText(key, platform = process.platform) {
    return key
        .split("/")
        .map((binding) => binding
        .split("+")
        .map((part) => formatKeyPart(part, platform))
        .join("+"))
        .join("/");
}
function formatKeys(keys, options = {}) {
    const displayKeys = options.primaryOnly ? keys.slice(0, 1) : keys;
    if (displayKeys.length === 0)
        return "";
    if (displayKeys.length === 1)
        return formatKeyText(displayKeys[0]);
    return formatKeyText(displayKeys.join("/"));
}
export function keyText(keybinding, options = {}) {
    return formatKeys(getKeybindings().getKeys(keybinding), options);
}
export function keyHint(keybinding, description, options = {}) {
    return theme.fg("dim", keyText(keybinding, options)) + theme.fg("muted", ` ${description}`);
}
/** Canonical bracketed expand/collapse hint, e.g. `(Ctrl+O to expand)`, fully dim. */
export function expandCollapseHint(keybinding, expanded) {
    return theme.fg("dim", `(${keyText(keybinding)} ${expanded ? "to collapse" : "to expand"})`);
}
export function rawKeyHint(key, description) {
    return theme.fg("dim", formatKeyText(key)) + theme.fg("muted", ` ${description}`);
}
//# sourceMappingURL=keybinding-hints.js.map