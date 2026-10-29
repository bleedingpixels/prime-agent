/**
 * Minimal terminal interface for TUI
 */
export interface Terminal {
    start(onInput: (data: string) => void, onResize: () => void): void;
    stop(options?: TerminalStopOptions): void;
    /**
     * Drain stdin before exiting to prevent Kitty key release events from
     * leaking to the parent shell over slow SSH connections.
     * @param maxMs - Maximum time to drain (default: 1000ms)
     * @param idleMs - Exit early if no input arrives within this time (default: 50ms)
     */
    drainInput(maxMs?: number, idleMs?: number): Promise<void>;
    write(data: string): void;
    get columns(): number;
    get rows(): number;
    get kittyProtocolActive(): boolean;
    moveBy(lines: number): void;
    hideCursor(): void;
    showCursor(): void;
    clearLine(): void;
    clearFromCursor(): void;
    clearScreen(): void;
    enterAltScreen(): void;
    leaveAltScreen(): void;
    get altScreenActive(): boolean;
    setMouseTracking(enabled: boolean): void;
    get mouseTrackingActive(): boolean;
    setTitle(title: string): void;
    setProgress(active: boolean): void;
}
export interface TerminalStopOptions {
    preserveAltScreen?: boolean;
}
/**
 * Real terminal using process.stdin/stdout
 */
export declare class ProcessTerminal implements Terminal {
    private wasRaw;
    private started;
    private inputHandler?;
    private resizeHandler?;
    private _kittyProtocolActive;
    private _modifyOtherKeysActive;
    private readonly altScreenHandoffToken;
    private _altScreenActive;
    private _mouseTrackingActive;
    private stdinBuffer?;
    private stdinDataHandler?;
    private keyboardProtocolFallbackTimer?;
    private progressInterval?;
    private defaultColorProbe?;
    private writeLogPath;
    get kittyProtocolActive(): boolean;
    start(onInput: (data: string) => void, onResize: () => void): void;
    /**
     * Set up StdinBuffer to split batched input into individual sequences.
     * This ensures components receive single events, making matchesKey/isKeyRelease work correctly.
     *
     * Also watches for Kitty protocol response and enables it when detected.
     * This is done here (after stdinBuffer parsing) rather than on raw stdin
     * to handle the case where the response arrives split across multiple events.
     */
    private setupStdinBuffer;
    /**
     * Query terminal for Kitty keyboard protocol support and enable if available.
     *
     * Sends CSI ? u to query current flags. If terminal responds with CSI ? <flags> u,
     * it supports the protocol and we enable it with CSI > 1 u.
     *
     * If no Kitty response arrives shortly after startup, fall back to enabling
     * xterm modifyOtherKeys mode 2. This is needed for tmux, which can forward
     * modified enter keys as CSI-u when extended-keys is enabled, but may not
     * answer the Kitty protocol query.
     *
     * The response is detected in setupStdinBuffer's data handler, which properly
     * handles the case where the response arrives split across multiple stdin events.
     */
    private queryAndEnableKittyProtocol;
    private clearKeyboardProtocolFallbackTimer;
    private queryDefaultTerminalColors;
    private handleDefaultColorProbeResponse;
    private finishDefaultColorProbe;
    /**
     * On Windows, add ENABLE_VIRTUAL_TERMINAL_INPUT (0x0200) to the stdin
     * console handle so the terminal sends VT sequences for modified keys
     * (e.g. \x1b[Z for Shift+Tab). Without this, libuv's ReadConsoleInputW
     * discards modifier state and Shift+Tab arrives as plain \t.
     */
    private enableWindowsVTInput;
    drainInput(maxMs?: number, idleMs?: number): Promise<void>;
    stop(options?: TerminalStopOptions): void;
    write(data: string): void;
    get columns(): number;
    get rows(): number;
    moveBy(lines: number): void;
    hideCursor(): void;
    showCursor(): void;
    clearLine(): void;
    clearFromCursor(): void;
    clearScreen(): void;
    enterAltScreen(): void;
    leaveAltScreen(): void;
    private releaseAltScreen;
    get altScreenActive(): boolean;
    private ownsPendingAltScreenHandoff;
    setMouseTracking(enabled: boolean): void;
    get mouseTrackingActive(): boolean;
    setTitle(title: string): void;
    setProgress(active: boolean): void;
    private clearProgressInterval;
}
//# sourceMappingURL=terminal.d.ts.map