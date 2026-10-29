export interface Rgb {
    r: number;
    g: number;
    b: number;
}
export interface DefaultTerminalColors {
    foreground: Rgb;
    background: Rgb;
}
export type TerminalBackgroundKind = "dark" | "light";
export type TerminalColorMode = "truecolor" | "256color" | "ansi16" | "unknown";
export type OscColorKind = "foreground" | "background";
export interface OscColorResponse {
    kind: OscColorKind;
    rgb: Rgb;
}
export declare const QUERY_DEFAULT_FOREGROUND = "\u001B]10;?\u001B\\";
export declare const QUERY_DEFAULT_BACKGROUND = "\u001B]11;?\u001B\\";
export declare function rgbToHex(rgb: Rgb): string;
export declare function isLightColor(rgb: Rgb): boolean;
export declare function blendColor(top: Rgb, bottom: Rgb, alpha: number): Rgb;
export declare function rgbTo256(rgb: Rgb): number;
export declare function bestAnsiColor(rgb: Rgb, mode: TerminalColorMode): string | number;
export declare function parseOscColorResponse(sequence: string): OscColorResponse | undefined;
export declare function detectBackgroundFromColorFgBg(value?: string | undefined): TerminalBackgroundKind | undefined;
export declare function getDefaultTerminalColors(): DefaultTerminalColors | undefined;
export declare function setDefaultTerminalColors(colors: DefaultTerminalColors | undefined): void;
export declare function clearDefaultTerminalColors(): void;
export declare function getTerminalBackgroundKind(): TerminalBackgroundKind | undefined;
export declare function onDefaultTerminalColorsChange(listener: () => void): () => void;
//# sourceMappingURL=terminal-colors.d.ts.map