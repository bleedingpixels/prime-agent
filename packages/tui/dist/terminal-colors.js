export const QUERY_DEFAULT_FOREGROUND = "\x1b]10;?\x1b\\";
export const QUERY_DEFAULT_BACKGROUND = "\x1b]11;?\x1b\\";
const CUBE_VALUES = [0, 95, 135, 175, 215, 255];
const GRAY_VALUES = Array.from({ length: 24 }, (_, i) => 8 + i * 10);
const defaultColorListeners = new Set();
let defaultTerminalColors;
function clampChannel(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
}
function normalizeHexChannel(value) {
    if (!/^[0-9a-fA-F]{2,4}$/.test(value)) {
        return undefined;
    }
    const parsed = parseInt(value, 16);
    if (Number.isNaN(parsed)) {
        return undefined;
    }
    if (value.length <= 2) {
        return parsed;
    }
    const max = 16 ** value.length - 1;
    return Math.round((parsed / max) * 255);
}
function parseRgbPayload(payload) {
    const rgbMatch = payload.match(/^rgb:([0-9a-fA-F]{2,4})\/([0-9a-fA-F]{2,4})\/([0-9a-fA-F]{2,4})$/);
    if (rgbMatch) {
        const r = normalizeHexChannel(rgbMatch[1]);
        const g = normalizeHexChannel(rgbMatch[2]);
        const b = normalizeHexChannel(rgbMatch[3]);
        return r === undefined || g === undefined || b === undefined ? undefined : { r, g, b };
    }
    const hexMatch = payload.match(/^#?([0-9a-fA-F]{6})$/);
    if (!hexMatch) {
        return undefined;
    }
    const hex = hexMatch[1];
    return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
    };
}
function colorDistance(a, b) {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;
}
function findClosestIndex(value, values) {
    let minDist = Infinity;
    let minIdx = 0;
    for (let i = 0; i < values.length; i++) {
        const dist = Math.abs(value - values[i]);
        if (dist < minDist) {
            minDist = dist;
            minIdx = i;
        }
    }
    return minIdx;
}
function notifyDefaultColorListeners() {
    for (const listener of defaultColorListeners) {
        listener();
    }
}
export function rgbToHex(rgb) {
    const toHex = (value) => clampChannel(value).toString(16).padStart(2, "0");
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}
export function isLightColor(rgb) {
    return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b > 128;
}
export function blendColor(top, bottom, alpha) {
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    return {
        r: clampChannel(top.r * clampedAlpha + bottom.r * (1 - clampedAlpha)),
        g: clampChannel(top.g * clampedAlpha + bottom.g * (1 - clampedAlpha)),
        b: clampChannel(top.b * clampedAlpha + bottom.b * (1 - clampedAlpha)),
    };
}
export function rgbTo256(rgb) {
    const rIdx = findClosestIndex(rgb.r, CUBE_VALUES);
    const gIdx = findClosestIndex(rgb.g, CUBE_VALUES);
    const bIdx = findClosestIndex(rgb.b, CUBE_VALUES);
    const cubeRgb = { r: CUBE_VALUES[rIdx], g: CUBE_VALUES[gIdx], b: CUBE_VALUES[bIdx] };
    const cubeIndex = 16 + 36 * rIdx + 6 * gIdx + bIdx;
    const cubeDist = colorDistance(rgb, cubeRgb);
    const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
    const grayIdx = findClosestIndex(gray, GRAY_VALUES);
    const grayValue = GRAY_VALUES[grayIdx];
    const grayRgb = { r: grayValue, g: grayValue, b: grayValue };
    const grayIndex = 232 + grayIdx;
    const grayDist = colorDistance(rgb, grayRgb);
    const maxChannel = Math.max(rgb.r, rgb.g, rgb.b);
    const minChannel = Math.min(rgb.r, rgb.g, rgb.b);
    if (maxChannel - minChannel < 10 && grayDist < cubeDist) {
        return grayIndex;
    }
    return cubeIndex;
}
export function bestAnsiColor(rgb, mode) {
    if (mode === "truecolor") {
        return rgbToHex(rgb);
    }
    if (mode === "256color") {
        return rgbTo256(rgb);
    }
    return "";
}
export function parseOscColorResponse(sequence) {
    const match = sequence.match(/^\x1b\](10|11);([^\x07\x1b]+)(?:\x07|\x1b\\)$/);
    if (!match) {
        return undefined;
    }
    const rgb = parseRgbPayload(match[2]);
    if (!rgb) {
        return undefined;
    }
    return {
        kind: match[1] === "10" ? "foreground" : "background",
        rgb,
    };
}
export function detectBackgroundFromColorFgBg(value = process.env.COLORFGBG) {
    if (!value) {
        return undefined;
    }
    const parts = value.split(";");
    if (parts.length < 2) {
        return undefined;
    }
    const bg = parseInt(parts[1], 10);
    if (Number.isNaN(bg)) {
        return undefined;
    }
    return bg < 8 ? "dark" : "light";
}
export function getDefaultTerminalColors() {
    return defaultTerminalColors;
}
export function setDefaultTerminalColors(colors) {
    defaultTerminalColors = colors;
    notifyDefaultColorListeners();
}
export function clearDefaultTerminalColors() {
    setDefaultTerminalColors(undefined);
}
export function getTerminalBackgroundKind() {
    const bg = defaultTerminalColors?.background;
    if (bg) {
        return isLightColor(bg) ? "light" : "dark";
    }
    return detectBackgroundFromColorFgBg();
}
export function onDefaultTerminalColorsChange(listener) {
    defaultColorListeners.add(listener);
    return () => {
        defaultColorListeners.delete(listener);
    };
}
//# sourceMappingURL=terminal-colors.js.map