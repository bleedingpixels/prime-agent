import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { setKittyProtocolActive } from "./keys.js";
import { StdinBuffer } from "./stdin-buffer.js";
import { parseOscColorResponse, QUERY_DEFAULT_BACKGROUND, QUERY_DEFAULT_FOREGROUND, setDefaultTerminalColors, } from "./terminal-colors.js";
const cjsRequire = createRequire(import.meta.url);
const TERMINAL_PROGRESS_KEEPALIVE_MS = 1000;
const TERMINAL_PROGRESS_ACTIVE_SEQUENCE = "\x1b]9;4;3\x07";
const TERMINAL_PROGRESS_CLEAR_SEQUENCE = "\x1b]9;4;0;\x07";
// A preserved alternate screen is adopted by the next ProcessTerminal during in-process handoff.
let pendingAltScreenHandoff;
// Keep stdin raw and drain input while a preserved fullscreen frame waits for
// the next in-process TUI. Worker-backed session attach can make this handoff
// noticeably longer; restoring cooked mode during the gap makes arrow escape
// sequences echo into the preserved frame.
let pendingInputHandoff;
function consumeAltScreenHandoff() {
    if (!pendingAltScreenHandoff) {
        return false;
    }
    pendingAltScreenHandoff = undefined;
    return true;
}
function beginInputHandoff(token, wasRaw) {
    const inheritedWasRaw = pendingInputHandoff?.wasRaw ?? wasRaw;
    if (pendingInputHandoff) {
        process.stdin.removeListener("data", pendingInputHandoff.discardHandler);
    }
    const discardHandler = (_data) => { };
    pendingInputHandoff = { token, wasRaw: inheritedWasRaw, discardHandler };
    process.stdin.on("data", discardHandler);
    process.stdin.resume();
}
function consumeInputHandoff() {
    const handoff = pendingInputHandoff;
    if (!handoff) {
        return undefined;
    }
    process.stdin.removeListener("data", handoff.discardHandler);
    pendingInputHandoff = undefined;
    return handoff.wasRaw;
}
function cancelInputHandoff(token) {
    const handoff = pendingInputHandoff;
    if (!handoff || handoff.token !== token) {
        return;
    }
    process.stdin.removeListener("data", handoff.discardHandler);
    pendingInputHandoff = undefined;
    process.stdin.pause();
    if (process.stdin.setRawMode) {
        process.stdin.setRawMode(handoff.wasRaw);
    }
}
/**
 * Real terminal using process.stdin/stdout
 */
export class ProcessTerminal {
    wasRaw = false;
    started = false;
    inputHandler;
    resizeHandler;
    _kittyProtocolActive = false;
    _modifyOtherKeysActive = false;
    altScreenHandoffToken = Symbol("altScreenHandoff");
    _altScreenActive = consumeAltScreenHandoff();
    _mouseTrackingActive = false;
    stdinBuffer;
    stdinDataHandler;
    keyboardProtocolFallbackTimer;
    progressInterval;
    defaultColorProbe;
    writeLogPath = (() => {
        const env = process.env.PI_TUI_WRITE_LOG || "";
        if (!env)
            return "";
        try {
            if (fs.statSync(env).isDirectory()) {
                const now = new Date();
                const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
                return path.join(env, `tui-${ts}-${process.pid}.log`);
            }
        }
        catch {
            // Not an existing directory - use as-is (file path)
        }
        return env;
    })();
    get kittyProtocolActive() {
        return this._kittyProtocolActive;
    }
    start(onInput, onResize) {
        this.started = true;
        this.inputHandler = onInput;
        this.resizeHandler = onResize;
        // Save previous state and enable raw mode
        this.wasRaw = consumeInputHandoff() ?? process.stdin.isRaw ?? false;
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
        }
        process.stdin.setEncoding("utf8");
        process.stdin.resume();
        // Enable bracketed paste mode - terminal will wrap pastes in \x1b[200~ ... \x1b[201~
        process.stdout.write("\x1b[?2004h");
        // Set up resize handler immediately
        process.stdout.on("resize", this.resizeHandler);
        // Refresh terminal dimensions - they may be stale after suspend/resume
        // (SIGWINCH is lost while process is stopped). Unix only.
        if (process.platform !== "win32") {
            process.kill(process.pid, "SIGWINCH");
        }
        // On Windows, enable ENABLE_VIRTUAL_TERMINAL_INPUT so the console sends
        // VT escape sequences (e.g. \x1b[Z for Shift+Tab) instead of raw console
        // events that lose modifier information. Must run AFTER setRawMode(true)
        // since that resets console mode flags.
        this.enableWindowsVTInput();
        // Query and enable Kitty keyboard protocol
        // The query handler intercepts input temporarily, then installs the user's handler
        // See: https://sw.kovidgoyal.net/kitty/keyboard-protocol/
        this.queryAndEnableKittyProtocol();
    }
    /**
     * Set up StdinBuffer to split batched input into individual sequences.
     * This ensures components receive single events, making matchesKey/isKeyRelease work correctly.
     *
     * Also watches for Kitty protocol response and enables it when detected.
     * This is done here (after stdinBuffer parsing) rather than on raw stdin
     * to handle the case where the response arrives split across multiple events.
     */
    setupStdinBuffer() {
        this.stdinBuffer = new StdinBuffer({ timeout: 10 });
        // Kitty protocol response pattern: \x1b[?<flags>u
        const kittyResponsePattern = /^\x1b\[\?(\d+)u$/;
        // Forward individual sequences to the input handler
        this.stdinBuffer.on("data", (sequence) => {
            if (this.handleDefaultColorProbeResponse(sequence)) {
                return;
            }
            // Check for Kitty protocol response (only if not already enabled)
            if (!this._kittyProtocolActive) {
                const match = sequence.match(kittyResponsePattern);
                if (match) {
                    this.clearKeyboardProtocolFallbackTimer();
                    this._kittyProtocolActive = true;
                    setKittyProtocolActive(true);
                    // Enable Kitty keyboard protocol (push flags)
                    // Flag 1 = disambiguate escape codes
                    // Flag 2 = report event types (press/repeat/release)
                    // Flag 4 = report alternate keys (shifted key, base layout key)
                    // Base layout key enables shortcuts to work with non-Latin keyboard layouts
                    process.stdout.write("\x1b[>7u");
                    return; // Don't forward protocol response to TUI
                }
            }
            if (this.inputHandler) {
                this.inputHandler(sequence);
            }
        });
        // Re-wrap paste content with bracketed paste markers for existing editor handling
        this.stdinBuffer.on("paste", (content) => {
            if (this.inputHandler) {
                this.inputHandler(`\x1b[200~${content}\x1b[201~`);
            }
        });
        // Handler that pipes stdin data through the buffer
        this.stdinDataHandler = (data) => {
            this.stdinBuffer.process(data);
        };
    }
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
    queryAndEnableKittyProtocol() {
        this.setupStdinBuffer();
        process.stdin.on("data", this.stdinDataHandler);
        this.queryDefaultTerminalColors();
        process.stdout.write("\x1b[?u");
        this.clearKeyboardProtocolFallbackTimer();
        this.keyboardProtocolFallbackTimer = setTimeout(() => {
            this.keyboardProtocolFallbackTimer = undefined;
            if (!this._kittyProtocolActive && !this._modifyOtherKeysActive) {
                process.stdout.write("\x1b[>4;2m");
                this._modifyOtherKeysActive = true;
            }
        }, 150);
    }
    clearKeyboardProtocolFallbackTimer() {
        if (!this.keyboardProtocolFallbackTimer) {
            return;
        }
        clearTimeout(this.keyboardProtocolFallbackTimer);
        this.keyboardProtocolFallbackTimer = undefined;
    }
    queryDefaultTerminalColors() {
        if (process.stdin.isTTY !== true || process.stdout.isTTY !== true) {
            return;
        }
        this.finishDefaultColorProbe();
        this.defaultColorProbe = {
            timeout: setTimeout(() => this.finishDefaultColorProbe(), 100),
        };
        process.stdout.write(QUERY_DEFAULT_FOREGROUND);
        process.stdout.write(QUERY_DEFAULT_BACKGROUND);
    }
    handleDefaultColorProbeResponse(sequence) {
        const response = parseOscColorResponse(sequence);
        if (!response) {
            return false;
        }
        if (!this.defaultColorProbe) {
            return true;
        }
        this.defaultColorProbe[response.kind] = response.rgb;
        if (this.defaultColorProbe.foreground && this.defaultColorProbe.background) {
            this.finishDefaultColorProbe();
        }
        return true;
    }
    finishDefaultColorProbe() {
        if (!this.defaultColorProbe) {
            return;
        }
        const { foreground, background, timeout } = this.defaultColorProbe;
        clearTimeout(timeout);
        this.defaultColorProbe = undefined;
        if (foreground && background) {
            setDefaultTerminalColors({ foreground, background });
            this.resizeHandler?.();
        }
    }
    /**
     * On Windows, add ENABLE_VIRTUAL_TERMINAL_INPUT (0x0200) to the stdin
     * console handle so the terminal sends VT sequences for modified keys
     * (e.g. \x1b[Z for Shift+Tab). Without this, libuv's ReadConsoleInputW
     * discards modifier state and Shift+Tab arrives as plain \t.
     */
    enableWindowsVTInput() {
        if (process.platform !== "win32")
            return;
        try {
            // Dynamic require to avoid bundling koffi's 74MB of cross-platform
            // native binaries into every compiled binary. Koffi is only needed
            // on Windows for VT input support.
            const koffi = cjsRequire("koffi");
            const k32 = koffi.load("kernel32.dll");
            const GetStdHandle = k32.func("void* __stdcall GetStdHandle(int)");
            const GetConsoleMode = k32.func("bool __stdcall GetConsoleMode(void*, _Out_ uint32_t*)");
            const SetConsoleMode = k32.func("bool __stdcall SetConsoleMode(void*, uint32_t)");
            const STD_INPUT_HANDLE = -10;
            const ENABLE_VIRTUAL_TERMINAL_INPUT = 0x0200;
            const handle = GetStdHandle(STD_INPUT_HANDLE);
            const mode = new Uint32Array(1);
            GetConsoleMode(handle, mode);
            SetConsoleMode(handle, mode[0] | ENABLE_VIRTUAL_TERMINAL_INPUT);
        }
        catch {
            // koffi not available — Shift+Tab won't be distinguishable from Tab
        }
    }
    async drainInput(maxMs = 1000, idleMs = 50) {
        if (this._kittyProtocolActive) {
            // Disable Kitty keyboard protocol first so any late key releases
            // do not generate new Kitty escape sequences.
            process.stdout.write("\x1b[<u");
            this._kittyProtocolActive = false;
            setKittyProtocolActive(false);
        }
        if (this._modifyOtherKeysActive) {
            process.stdout.write("\x1b[>4;0m");
            this._modifyOtherKeysActive = false;
        }
        const previousHandler = this.inputHandler;
        this.inputHandler = undefined;
        let lastDataTime = Date.now();
        const onData = () => {
            lastDataTime = Date.now();
        };
        process.stdin.on("data", onData);
        const endTime = Date.now() + maxMs;
        try {
            while (true) {
                const now = Date.now();
                const timeLeft = endTime - now;
                if (timeLeft <= 0)
                    break;
                if (now - lastDataTime >= idleMs)
                    break;
                await new Promise((resolve) => setTimeout(resolve, Math.min(idleMs, timeLeft)));
            }
        }
        finally {
            process.stdin.removeListener("data", onData);
            this.inputHandler = previousHandler;
        }
    }
    stop(options = {}) {
        const wasStarted = this.started;
        this.started = false;
        this.finishDefaultColorProbe();
        this.clearKeyboardProtocolFallbackTimer();
        if (this.clearProgressInterval()) {
            process.stdout.write(TERMINAL_PROGRESS_CLEAR_SEQUENCE);
        }
        if (this._mouseTrackingActive) {
            process.stdout.write("\x1b[?1006l\x1b[?1002l");
            this._mouseTrackingActive = false;
        }
        if (this._altScreenActive) {
            if (options.preserveAltScreen) {
                pendingAltScreenHandoff = this.altScreenHandoffToken;
                this._altScreenActive = false;
            }
            else {
                this.releaseAltScreen();
            }
        }
        else if (!options.preserveAltScreen) {
            this.releaseAltScreen();
        }
        // Disable bracketed paste mode
        process.stdout.write("\x1b[?2004l");
        // Disable Kitty keyboard protocol if not already done by drainInput()
        if (this._kittyProtocolActive) {
            process.stdout.write("\x1b[<u");
            this._kittyProtocolActive = false;
            setKittyProtocolActive(false);
        }
        if (this._modifyOtherKeysActive) {
            process.stdout.write("\x1b[>4;0m");
            this._modifyOtherKeysActive = false;
        }
        // Clean up StdinBuffer
        if (this.stdinBuffer) {
            this.stdinBuffer.destroy();
            this.stdinBuffer = undefined;
        }
        // Remove event handlers
        if (this.stdinDataHandler) {
            process.stdin.removeListener("data", this.stdinDataHandler);
            this.stdinDataHandler = undefined;
        }
        this.inputHandler = undefined;
        if (this.resizeHandler) {
            process.stdout.removeListener("resize", this.resizeHandler);
            this.resizeHandler = undefined;
        }
        if (options.preserveAltScreen && wasStarted) {
            beginInputHandoff(this.altScreenHandoffToken, this.wasRaw);
        }
        else {
            // Pause stdin to prevent any buffered input (e.g., Ctrl+D) from being
            // re-interpreted after raw mode is disabled. This fixes a race condition
            // where Ctrl+D could close the parent shell over SSH.
            process.stdin.pause();
            // Restore raw mode state
            if (process.stdin.setRawMode) {
                process.stdin.setRawMode(this.wasRaw);
            }
        }
    }
    write(data) {
        process.stdout.write(data);
        if (this.writeLogPath) {
            try {
                fs.appendFileSync(this.writeLogPath, data, { encoding: "utf8" });
            }
            catch {
                // Ignore logging errors
            }
        }
    }
    get columns() {
        return process.stdout.columns || Number(process.env.COLUMNS) || 80;
    }
    get rows() {
        return process.stdout.rows || Number(process.env.LINES) || 24;
    }
    moveBy(lines) {
        if (lines > 0) {
            // Move down
            process.stdout.write(`\x1b[${lines}B`);
        }
        else if (lines < 0) {
            // Move up
            process.stdout.write(`\x1b[${-lines}A`);
        }
        // lines === 0: no movement
    }
    hideCursor() {
        process.stdout.write("\x1b[?25l");
    }
    showCursor() {
        process.stdout.write("\x1b[?25h");
    }
    clearLine() {
        process.stdout.write("\x1b[K");
    }
    clearFromCursor() {
        process.stdout.write("\x1b[J");
    }
    clearScreen() {
        process.stdout.write("\x1b[2J\x1b[H"); // Clear screen and move to home (1,1)
    }
    enterAltScreen() {
        if (this._altScreenActive)
            return;
        if (this.ownsPendingAltScreenHandoff()) {
            pendingAltScreenHandoff = undefined;
            this._altScreenActive = true;
            return;
        }
        this._altScreenActive = true;
        this.write("\x1b[?1049h");
    }
    leaveAltScreen() {
        this.releaseAltScreen();
    }
    releaseAltScreen() {
        const ownsPendingHandoff = this.ownsPendingAltScreenHandoff();
        if (!this._altScreenActive && !ownsPendingHandoff)
            return;
        this._altScreenActive = false;
        if (ownsPendingHandoff) {
            pendingAltScreenHandoff = undefined;
            cancelInputHandoff(this.altScreenHandoffToken);
        }
        this.write("\x1b[?1049l");
    }
    get altScreenActive() {
        return this._altScreenActive;
    }
    ownsPendingAltScreenHandoff() {
        return pendingAltScreenHandoff === this.altScreenHandoffToken;
    }
    setMouseTracking(enabled) {
        if (enabled === this._mouseTrackingActive)
            return;
        this._mouseTrackingActive = enabled;
        // ?1002 (button-event tracking) reports drag motion for in-app selection
        // but not hover, keeping passive mouse movement unreported.
        this.write(enabled ? "\x1b[?1002h\x1b[?1006h" : "\x1b[?1006l\x1b[?1002l");
    }
    get mouseTrackingActive() {
        return this._mouseTrackingActive;
    }
    setTitle(title) {
        // OSC 0;title BEL - set terminal window title
        process.stdout.write(`\x1b]0;${title}\x07`);
    }
    setProgress(active) {
        if (active) {
            // OSC 9;4;3 - indeterminate progress
            process.stdout.write(TERMINAL_PROGRESS_ACTIVE_SEQUENCE);
            if (!this.progressInterval) {
                this.progressInterval = setInterval(() => {
                    process.stdout.write(TERMINAL_PROGRESS_ACTIVE_SEQUENCE);
                }, TERMINAL_PROGRESS_KEEPALIVE_MS);
            }
        }
        else {
            this.clearProgressInterval();
            // OSC 9;4;0 - clear progress
            process.stdout.write(TERMINAL_PROGRESS_CLEAR_SEQUENCE);
        }
    }
    clearProgressInterval() {
        if (!this.progressInterval)
            return false;
        clearInterval(this.progressInterval);
        this.progressInterval = undefined;
        return true;
    }
}
//# sourceMappingURL=terminal.js.map