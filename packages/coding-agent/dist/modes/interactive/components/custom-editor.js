import { CURSOR_MARKER, Editor, truncateToWidth, visibleWidth, } from "@earendil-works/pi-tui";
/**
 * Custom editor that handles app-level keybindings for coding-agent.
 */
export class CustomEditor extends Editor {
    keybindings;
    defaultPromptPrefix;
    configuredPaddingX;
    placeholder;
    placeholderColor;
    isArgumentCommand;
    actionHandlers = new Map();
    // Special handlers that can be dynamically replaced
    onEscape;
    onCtrlD;
    onPasteImage;
    onMoveBelowPrompt;
    onAgentsBack;
    /** When set, the returned line is rendered inside the top of the editor box. */
    getHeaderLine;
    /** Handler for extension-registered shortcuts. Returns true if handled. */
    onExtensionShortcut;
    constructor(tui, theme, keybindings, options) {
        const promptPrefix = options?.promptPrefix ?? "> ";
        super(tui, theme, { ...options, promptPrefix });
        this.keybindings = keybindings;
        this.defaultPromptPrefix = promptPrefix;
        this.configuredPaddingX = options?.paddingX ?? 0;
        this.placeholder = options?.placeholder;
        this.placeholderColor = options?.placeholderColor ?? ((text) => text);
        this.isArgumentCommand = options?.isArgumentCommand ?? (() => false);
    }
    getPromptPrefix() {
        return this.getBashPromptInfo(this.getLines()[0] ?? "")?.promptPrefix ?? this.defaultPromptPrefix;
    }
    formatPromptPrefix(prefix) {
        return prefix.startsWith("!") ? this.borderColor(prefix) : prefix;
    }
    getHiddenTextPrefixLength(lineIndex, line) {
        if (lineIndex !== 0) {
            return 0;
        }
        return this.getBashPromptInfo(line)?.hiddenTextPrefixLength ?? 0;
    }
    styleDisplayText(displayText, layoutLineIndex, lineText, cursorCol) {
        const commandColor = this.commandColor;
        if (!commandColor || layoutLineIndex !== 0) {
            return displayText;
        }
        const match = /^(\s*)\/(\S+)/.exec(lineText);
        if (!match) {
            return displayText;
        }
        const [token, leadingWhitespace, name] = match;
        if (!this.isArgumentCommand(name)) {
            return displayText;
        }
        const tokenStart = leadingWhitespace.length;
        const tokenEnd = token.length;
        if (cursorCol !== undefined && cursorCol < tokenEnd) {
            return displayText;
        }
        const before = displayText.slice(0, tokenStart);
        const tokenText = displayText.slice(tokenStart, tokenEnd);
        const after = displayText.slice(tokenEnd);
        return `${before}${commandColor(tokenText)}${after}`;
    }
    getBashPromptInfo(line) {
        const trimmedLine = line.trimStart();
        const leadingWhitespaceLength = line.length - trimmedLine.length;
        if (trimmedLine.startsWith("!!")) {
            return {
                promptPrefix: "!! ",
                hiddenTextPrefixLength: leadingWhitespaceLength + (trimmedLine.startsWith("!! ") ? 3 : 2),
            };
        }
        if (trimmedLine.startsWith("!")) {
            return {
                promptPrefix: "! ",
                hiddenTextPrefixLength: leadingWhitespaceLength + (trimmedLine.startsWith("! ") ? 2 : 1),
            };
        }
        return undefined;
    }
    /**
     * Register a handler for an app action.
     */
    onAction(action, handler) {
        this.actionHandlers.set(action, handler);
    }
    render(width) {
        let lines = super.render(width);
        if (this.placeholder && this.getText().length === 0 && lines.length >= 2) {
            lines = [lines[0], this.renderPlaceholderLine(width), ...lines.slice(2)];
        }
        const headerLine = this.getHeaderLine?.();
        if (headerLine !== undefined && lines.length >= 2) {
            lines = [
                lines[0],
                this.renderHeaderContentLine(headerLine, width),
                this.renderHeaderContentLine("", width),
                ...lines.slice(1),
            ];
        }
        return lines;
    }
    setPlaceholder(placeholder) {
        this.placeholder = placeholder;
        this.invalidate();
    }
    handleInput(data) {
        // Check extension-registered shortcuts first
        if (this.onExtensionShortcut?.(data)) {
            return;
        }
        const repeatedClearInput = this.splitRepeatedKeybinding(data, "app.input.clear");
        if (repeatedClearInput) {
            for (const input of repeatedClearInput) {
                this.handleInput(input);
            }
            return;
        }
        // Check for paste image keybinding
        if (this.keybindings.matches(data, "app.clipboard.pasteImage")) {
            this.onPasteImage?.();
            return;
        }
        // Check app keybindings first
        if (this.keybindings.matches(data, "app.agents.back") && this.onAgentsBack?.()) {
            return;
        }
        // Clear input
        if (this.keybindings.matches(data, "app.input.clear")) {
            const hadAutocomplete = this.isShowingAutocomplete();
            if (hadAutocomplete) {
                this.cancelAutocomplete();
            }
            const handler = this.onEscape ?? this.actionHandlers.get("app.input.clear");
            if (handler) {
                handler();
                return;
            }
            if (hadAutocomplete) {
                return;
            }
            super.handleInput(data);
            return;
        }
        // Exit (Ctrl+D) - only when editor is empty
        if (this.keybindings.matches(data, "app.exit")) {
            if (this.getText().length === 0) {
                const handler = this.onCtrlD ?? this.actionHandlers.get("app.exit");
                if (handler)
                    handler();
                return;
            }
            // Fall through to editor handling for delete-char-forward when not empty
        }
        // Check all other app actions
        for (const [action, handler] of this.actionHandlers) {
            if (action !== "app.input.clear" &&
                action !== "app.exit" &&
                (action !== "app.shortcuts" || this.getText().length === 0) &&
                this.keybindings.matches(data, action)) {
                if ((action === "app.clear" || action === "app.interrupt") && this.isShowingAutocomplete()) {
                    this.cancelAutocomplete();
                }
                handler();
                return;
            }
        }
        if (this.keybindings.matches(data, "tui.editor.cursorDown") &&
            !this.isShowingAutocomplete() &&
            !this.isHistoryNavigationActive() &&
            this.isCursorAtEnd() &&
            this.onMoveBelowPrompt?.()) {
            return;
        }
        // Pass to parent for editor handling
        super.handleInput(data);
    }
    isCursorAtEnd() {
        const lines = this.getLines();
        const cursor = this.getCursor();
        return cursor.line === lines.length - 1 && cursor.col === (lines[cursor.line]?.length ?? 0);
    }
    splitRepeatedKeybinding(data, keybinding) {
        const inputs = [];
        let offset = 0;
        while (offset < data.length) {
            let match;
            for (let end = offset + 1; end <= data.length; end++) {
                const candidate = data.slice(offset, end);
                if (this.keybindings.matches(candidate, keybinding)) {
                    match = candidate;
                    offset = end;
                    break;
                }
            }
            if (!match) {
                return undefined;
            }
            inputs.push(match);
        }
        return inputs.length > 1 ? inputs : undefined;
    }
    getEffectivePaddingX(width) {
        const maxPadding = Math.max(0, Math.floor((width - 1) / 2));
        const configuredPaddingX = Math.min(this.configuredPaddingX, maxPadding);
        return this.backgroundColor !== undefined
            ? Math.min(Math.max(configuredPaddingX, 2), maxPadding)
            : configuredPaddingX;
    }
    renderHeaderContentLine(content, width) {
        const paddingX = this.getEffectivePaddingX(width);
        const contentWidth = Math.max(1, width - paddingX * 2);
        const line = `${" ".repeat(paddingX)}${truncateToWidth(content, contentWidth)}`;
        const padded = line + " ".repeat(Math.max(0, width - visibleWidth(line)));
        const backgroundColor = this.backgroundColor;
        if (!backgroundColor) {
            return padded;
        }
        // Truncation may inject full ANSI resets; wrap each segment so the
        // background survives past them instead of falling back to the terminal's.
        return padded
            .split("\x1b[0m")
            .map((segment) => backgroundColor(segment))
            .join("\x1b[0m");
    }
    renderPlaceholderLine(width) {
        const paddingX = this.getEffectivePaddingX(width);
        const contentWidth = Math.max(1, width - paddingX * 2);
        const promptPrefixText = this.getPromptPrefix();
        const promptPrefixWidth = Math.min(visibleWidth(promptPrefixText), Math.max(0, contentWidth - 1));
        const inputWidth = Math.max(1, contentWidth - promptPrefixWidth);
        const promptPrefix = promptPrefixWidth > 0 ? this.formatPromptPrefix(truncateToWidth(promptPrefixText, promptPrefixWidth, "")) : "";
        const promptPrefixInset = promptPrefixWidth > 0 ? Math.min(1, paddingX) : 0;
        const promptLeadingPadding = " ".repeat(promptPrefixInset);
        const promptTrailingPadding = " ".repeat(Math.max(0, paddingX - promptPrefixInset));
        const rightPadding = " ".repeat(paddingX);
        const placeholderWidth = Math.max(0, inputWidth - 1);
        const placeholderText = truncateToWidth(this.placeholder ?? "", placeholderWidth, "");
        const cursorMarker = this.focused && !this.isShowingAutocomplete() ? CURSOR_MARKER : "";
        const cursorReset = this.backgroundColor ? "\x1b[27m" : "\x1b[0m";
        const displayText = `${cursorMarker}\x1b[7m ${cursorReset}${this.placeholderColor(placeholderText)}`;
        const padding = " ".repeat(Math.max(0, placeholderWidth - visibleWidth(placeholderText)));
        const line = `${promptLeadingPadding}${promptPrefix}${promptTrailingPadding}${displayText}${padding}${rightPadding}`;
        const padded = line + " ".repeat(Math.max(0, width - visibleWidth(line)));
        return this.getAutocompleteAnchorMarker() + (this.backgroundColor ? this.backgroundColor(padded) : padded);
    }
}
//# sourceMappingURL=custom-editor.js.map