import { type Keybinding, type KeybindingsConfig, type KeyId, KeybindingsManager as TuiKeybindingsManager } from "@earendil-works/pi-tui";
export interface AppKeybindings {
    "app.interrupt": true;
    "app.clear": true;
    "app.input.clear": true;
    "app.shortcuts": true;
    "app.exit": true;
    "app.suspend": true;
    "app.model.select": true;
    "app.model.toggleScope": true;
    "app.configuration.previousTab": true;
    "app.tools.expand": true;
    "app.messages.expand": true;
    "app.thinking.toggle": true;
    "app.subagents.focus": true;
    "app.heartbeats.open": true;
    "app.heartbeats.openSelected": true;
    "app.editor.external": true;
    "app.prompt.stash": true;
    "app.message.followUp": true;
    "app.message.navigateOlder": true;
    "app.message.navigateNewer": true;
    "app.message.moveEarlier": true;
    "app.message.moveLater": true;
    "app.clipboard.pasteImage": true;
    "app.clipboard.copyLoginUrl": true;
    "app.session.new": true;
    "app.session.tree": true;
    "app.session.fork": true;
    "app.session.resume": true;
    "app.agents.back": true;
    "app.agents.open": true;
    "app.modal.back": true;
    "app.agents.reply": true;
    "app.agents.new": true;
    "app.agents.delete": true;
    "app.agents.program": true;
    "app.agents.rename": true;
    "app.tree.foldOrUp": true;
    "app.tree.unfoldOrDown": true;
    "app.tree.editLabel": true;
    "app.tree.toggleLabelTimestamp": true;
    "app.models.save": true;
    "app.models.enableAll": true;
    "app.models.clearAll": true;
    "app.models.toggleProvider": true;
    "app.models.reorderUp": true;
    "app.models.reorderDown": true;
    "app.tree.filter.default": true;
    "app.tree.filter.noTools": true;
    "app.tree.filter.userOnly": true;
    "app.tree.filter.labeledOnly": true;
    "app.tree.filter.all": true;
    "app.tree.filter.cycleForward": true;
    "app.tree.filter.cycleBackward": true;
}
export type AppKeybinding = keyof AppKeybindings;
declare module "@earendil-works/pi-tui" {
    interface Keybindings extends AppKeybindings {
    }
}
export declare const KEYBINDINGS: {
    readonly "tui.editor.cursorUp": {
        readonly defaultKeys: "up";
        readonly description: "Move cursor up";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.cursorDown": {
        readonly defaultKeys: "down";
        readonly description: "Move cursor down";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.cursorLeft": {
        readonly defaultKeys: ["left", "ctrl+b"];
        readonly description: "Move cursor left";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.cursorRight": {
        readonly defaultKeys: ["right", "ctrl+f"];
        readonly description: "Move cursor right";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.cursorWordLeft": {
        readonly defaultKeys: ["alt+left", "ctrl+left", "alt+b"];
        readonly description: "Move cursor word left";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.cursorWordRight": {
        readonly defaultKeys: ["alt+right", "ctrl+right", "alt+f"];
        readonly description: "Move cursor word right";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.cursorLineStart": {
        readonly defaultKeys: ["home", "ctrl+a"];
        readonly description: "Move to line start";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.cursorLineEnd": {
        readonly defaultKeys: ["end", "ctrl+e"];
        readonly description: "Move to line end";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.jumpForward": {
        readonly defaultKeys: "ctrl+]";
        readonly description: "Jump forward to character";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.jumpBackward": {
        readonly defaultKeys: "ctrl+alt+]";
        readonly description: "Jump backward to character";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.pageUp": {
        readonly defaultKeys: "pageUp";
        readonly description: "Page up";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.pageDown": {
        readonly defaultKeys: "pageDown";
        readonly description: "Page down";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.deleteCharBackward": {
        readonly defaultKeys: "backspace";
        readonly description: "Delete character backward";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.deleteCharForward": {
        readonly defaultKeys: ["delete", "ctrl+d"];
        readonly description: "Delete character forward";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.deleteWordBackward": {
        readonly defaultKeys: ["ctrl+w", "alt+backspace"];
        readonly description: "Delete word backward";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.deleteWordForward": {
        readonly defaultKeys: ["alt+d", "alt+delete"];
        readonly description: "Delete word forward";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.deleteToLineStart": {
        readonly defaultKeys: "ctrl+u";
        readonly description: "Delete to line start";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.deleteToLineEnd": {
        readonly defaultKeys: "ctrl+k";
        readonly description: "Delete to line end";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.yank": {
        readonly defaultKeys: "ctrl+y";
        readonly description: "Yank";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.yankPop": {
        readonly defaultKeys: "alt+y";
        readonly description: "Yank pop";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.editor.undo": {
        readonly defaultKeys: "ctrl+-";
        readonly description: "Undo";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.input.newLine": {
        readonly defaultKeys: "shift+enter";
        readonly description: "Insert newline";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.input.submit": {
        readonly defaultKeys: "enter";
        readonly description: "Submit input";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.input.tab": {
        readonly defaultKeys: "tab";
        readonly description: "Tab / autocomplete";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.input.copy": {
        readonly defaultKeys: "ctrl+c";
        readonly description: "Copy selection";
        readonly defaultKeyScope: "editor";
    };
    readonly "tui.viewport.pageUp": {
        readonly defaultKeys: "pageUp";
        readonly description: "Scroll transcript up a page (fullscreen)";
    };
    readonly "tui.viewport.pageDown": {
        readonly defaultKeys: "pageDown";
        readonly description: "Scroll transcript down a page (fullscreen)";
    };
    readonly "tui.viewport.top": {
        readonly defaultKeys: "shift+alt+up";
        readonly description: "Scroll transcript to top (fullscreen)";
    };
    readonly "tui.viewport.follow": {
        readonly defaultKeys: "ctrl+shift+down";
        readonly description: "Scroll to bottom and follow output (fullscreen)";
    };
    readonly "tui.select.up": {
        readonly defaultKeys: "up";
        readonly description: "Move selection up";
    };
    readonly "tui.select.down": {
        readonly defaultKeys: "down";
        readonly description: "Move selection down";
    };
    readonly "tui.select.pageUp": {
        readonly defaultKeys: "pageUp";
        readonly description: "Selection page up";
    };
    readonly "tui.select.pageDown": {
        readonly defaultKeys: "pageDown";
        readonly description: "Selection page down";
    };
    readonly "tui.select.confirm": {
        readonly defaultKeys: "enter";
        readonly description: "Confirm selection";
    };
    readonly "tui.select.cancel": {
        readonly defaultKeys: ["escape", "ctrl+c"];
        readonly description: "Cancel selection";
    };
    readonly "app.interrupt": {
        readonly defaultKeys: [];
        readonly description: "Interrupt current operation";
    };
    readonly "app.clear": {
        readonly defaultKeys: "ctrl+c";
        readonly description: "Interrupt current operation, then exit";
    };
    readonly "app.input.clear": {
        readonly defaultKeys: "escape";
        readonly description: "Interrupt response or clear prompt";
    };
    readonly "app.shortcuts": {
        readonly defaultKeys: "?";
        readonly description: "Show keyboard shortcuts";
    };
    readonly "app.exit": {
        readonly defaultKeys: "ctrl+d";
        readonly description: "Exit when editor is empty";
    };
    readonly "app.suspend": {
        readonly defaultKeys: "ctrl+z" | never[];
        readonly description: "Suspend to background";
    };
    readonly "app.model.select": {
        readonly defaultKeys: "ctrl+l";
        readonly description: "Open model selector";
    };
    readonly "app.model.toggleScope": {
        readonly defaultKeys: "alt+s";
        readonly description: "Toggle model selector scope";
    };
    readonly "app.configuration.previousTab": {
        readonly defaultKeys: "shift+tab";
        readonly description: "Select previous configuration tab";
    };
    readonly "app.tools.expand": {
        readonly defaultKeys: "ctrl+o";
        readonly description: "Toggle tool output";
        readonly defaultKeyScope: "editor";
    };
    readonly "app.messages.expand": {
        readonly defaultKeys: "ctrl+p";
        readonly description: "Toggle agent message expansion";
        readonly defaultKeyScope: "editor";
    };
    readonly "app.thinking.toggle": {
        readonly defaultKeys: "ctrl+t";
        readonly description: "Toggle thinking blocks";
        readonly defaultKeyScope: "editor";
    };
    readonly "app.subagents.focus": {
        readonly defaultKeys: "alt+a";
        readonly description: "Open child agents";
    };
    readonly "app.heartbeats.open": {
        readonly defaultKeys: "ctrl+r";
        readonly description: "Manage heartbeats";
    };
    readonly "app.heartbeats.openSelected": {
        readonly defaultKeys: "right";
        readonly description: "Open selected heartbeat";
    };
    readonly "app.editor.external": {
        readonly defaultKeys: "ctrl+g";
        readonly description: "Open external editor";
    };
    readonly "app.prompt.stash": {
        readonly defaultKeys: "ctrl+s";
        readonly description: "Stash or restore draft prompt";
    };
    readonly "app.message.followUp": {
        readonly defaultKeys: "alt+enter";
        readonly description: "Queue follow-up message";
    };
    readonly "app.message.navigateOlder": {
        readonly defaultKeys: "alt+up";
        readonly description: "Select older pending message";
    };
    readonly "app.message.navigateNewer": {
        readonly defaultKeys: "alt+down";
        readonly description: "Select newer pending message or draft";
    };
    readonly "app.message.moveEarlier": {
        readonly defaultKeys: "ctrl+alt+up";
        readonly description: "Move selected pending message earlier";
    };
    readonly "app.message.moveLater": {
        readonly defaultKeys: "ctrl+alt+down";
        readonly description: "Move selected pending message later";
    };
    readonly "app.clipboard.pasteImage": {
        readonly defaultKeys: "alt+v" | "ctrl+v";
        readonly description: "Paste image from clipboard";
    };
    readonly "app.clipboard.copyLoginUrl": {
        readonly defaultKeys: ["c", "alt+c"];
        readonly description: "Copy login URL";
    };
    readonly "app.session.new": {
        readonly defaultKeys: [];
        readonly description: "Start a new session";
    };
    readonly "app.session.tree": {
        readonly defaultKeys: [];
        readonly description: "Open session tree";
    };
    readonly "app.session.fork": {
        readonly defaultKeys: [];
        readonly description: "Fork current session";
    };
    readonly "app.session.resume": {
        readonly defaultKeys: [];
        readonly description: "Resume a session";
    };
    readonly "app.agents.back": {
        readonly defaultKeys: "left";
        readonly description: "Return to parent agent scope";
    };
    readonly "app.agents.open": {
        readonly defaultKeys: "right";
        readonly description: "Drill into selected agent";
    };
    readonly "app.modal.back": {
        readonly defaultKeys: "left";
        readonly description: "Go back / close the current dialog";
    };
    readonly "app.agents.reply": {
        readonly defaultKeys: "space";
        readonly description: "Reply to selected agent";
    };
    readonly "app.agents.new": {
        readonly defaultKeys: "ctrl+n";
        readonly description: "Start a new session from the agents view";
    };
    readonly "app.agents.delete": {
        readonly defaultKeys: "ctrl+x";
        readonly description: "Stop or delete selected agent";
    };
    readonly "app.agents.program": {
        readonly defaultKeys: "ctrl+o";
        readonly description: "Show the program that spawned subagents";
    };
    readonly "app.agents.rename": {
        readonly defaultKeys: "ctrl+r";
        readonly description: "Rename selected agent session";
    };
    readonly "app.tree.foldOrUp": {
        readonly defaultKeys: ["ctrl+left", "alt+left"];
        readonly description: "Fold tree branch or move up";
    };
    readonly "app.tree.unfoldOrDown": {
        readonly defaultKeys: ["ctrl+right", "alt+right"];
        readonly description: "Unfold tree branch or move down";
    };
    readonly "app.tree.editLabel": {
        readonly defaultKeys: "shift+l";
        readonly description: "Edit tree label";
    };
    readonly "app.tree.toggleLabelTimestamp": {
        readonly defaultKeys: "shift+t";
        readonly description: "Toggle tree label timestamps";
    };
    readonly "app.models.save": {
        readonly defaultKeys: "ctrl+s";
        readonly description: "Save model selection";
    };
    readonly "app.models.enableAll": {
        readonly defaultKeys: "ctrl+a";
        readonly description: "Enable all models";
    };
    readonly "app.models.clearAll": {
        readonly defaultKeys: "ctrl+x";
        readonly description: "Clear all models";
    };
    readonly "app.models.toggleProvider": {
        readonly defaultKeys: "ctrl+p";
        readonly description: "Toggle all models for provider";
    };
    readonly "app.models.reorderUp": {
        readonly defaultKeys: "alt+up";
        readonly description: "Move model up in order";
    };
    readonly "app.models.reorderDown": {
        readonly defaultKeys: "alt+down";
        readonly description: "Move model down in order";
    };
    readonly "app.tree.filter.default": {
        readonly defaultKeys: "ctrl+d";
        readonly description: "Tree filter: default view";
    };
    readonly "app.tree.filter.noTools": {
        readonly defaultKeys: "ctrl+t";
        readonly description: "Tree filter: hide tool results";
    };
    readonly "app.tree.filter.userOnly": {
        readonly defaultKeys: "ctrl+u";
        readonly description: "Tree filter: user messages only";
    };
    readonly "app.tree.filter.labeledOnly": {
        readonly defaultKeys: "ctrl+l";
        readonly description: "Tree filter: labeled entries only";
    };
    readonly "app.tree.filter.all": {
        readonly defaultKeys: "ctrl+a";
        readonly description: "Tree filter: show all entries";
    };
    readonly "app.tree.filter.cycleForward": {
        readonly defaultKeys: "ctrl+o";
        readonly description: "Tree filter: cycle forward";
    };
    readonly "app.tree.filter.cycleBackward": {
        readonly defaultKeys: "shift+ctrl+o";
        readonly description: "Tree filter: cycle backward";
    };
};
export declare function migrateKeybindingsConfig(rawConfig: Record<string, unknown>): {
    config: Record<string, unknown>;
    migrated: boolean;
};
export declare class KeybindingsManager extends TuiKeybindingsManager {
    private configPath;
    constructor(userBindings?: KeybindingsConfig, configPath?: string);
    static create(agentDir?: string): KeybindingsManager;
    reload(): void;
    getEffectiveConfig(): KeybindingsConfig;
    private static loadFromFile;
}
export type { Keybinding, KeybindingsConfig, KeyId };
//# sourceMappingURL=keybindings.d.ts.map