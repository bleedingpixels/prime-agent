import { Editor, type EditorOptions, type EditorTheme, type TUI } from "@earendil-works/pi-tui";
import type { AppKeybinding, KeybindingsManager } from "../../../core/keybindings.js";
export interface CustomEditorOptions extends EditorOptions {
    placeholder?: string;
    placeholderColor?: (text: string) => string;
    isArgumentCommand?: (name: string) => boolean;
}
/**
 * Custom editor that handles app-level keybindings for coding-agent.
 */
export declare class CustomEditor extends Editor {
    private keybindings;
    private defaultPromptPrefix;
    private readonly configuredPaddingX;
    private placeholder;
    private readonly placeholderColor;
    private readonly isArgumentCommand;
    actionHandlers: Map<AppKeybinding, () => void>;
    onEscape?: () => void;
    onCtrlD?: () => void;
    onPasteImage?: () => void;
    onMoveBelowPrompt?: () => boolean;
    onAgentsBack?: () => boolean;
    /** When set, the returned line is rendered inside the top of the editor box. */
    getHeaderLine?: () => string | undefined;
    /** Handler for extension-registered shortcuts. Returns true if handled. */
    onExtensionShortcut?: (data: string) => boolean;
    constructor(tui: TUI, theme: EditorTheme, keybindings: KeybindingsManager, options?: CustomEditorOptions);
    protected getPromptPrefix(): string;
    protected formatPromptPrefix(prefix: string): string;
    protected getHiddenTextPrefixLength(lineIndex: number, line: string): number;
    protected styleDisplayText(displayText: string, layoutLineIndex: number, lineText: string, cursorCol: number | undefined): string;
    private getBashPromptInfo;
    /**
     * Register a handler for an app action.
     */
    onAction(action: AppKeybinding, handler: () => void): void;
    render(width: number): string[];
    setPlaceholder(placeholder: string | undefined): void;
    handleInput(data: string): void;
    private isCursorAtEnd;
    private splitRepeatedKeybinding;
    private getEffectivePaddingX;
    private renderHeaderContentLine;
    private renderPlaceholderLine;
}
//# sourceMappingURL=custom-editor.d.ts.map