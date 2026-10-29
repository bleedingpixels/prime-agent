import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { Transport } from "@earendil-works/pi-ai";
import { Container, SettingsList } from "@earendil-works/pi-tui";
import type { IdleEvictionMinutes } from "../../../core/session-action-store.js";
import type { WarningSettings } from "../../../core/settings-manager.js";
export interface SettingsConfig {
    autoCompact: boolean;
    idleEvictionMinutes: IdleEvictionMinutes;
    showImages: boolean;
    autoResizeImages: boolean;
    blockImages: boolean;
    enableSkillCommands: boolean;
    enableBuiltinSkills: boolean;
    steeringMode: "all" | "one-at-a-time";
    followUpMode: "all" | "one-at-a-time";
    transport: Transport;
    thinkingLevel: ThinkingLevel;
    availableThinkingLevels: ThinkingLevel[];
    currentTheme: string;
    availableThemes: string[];
    hideThinkingBlock: boolean;
    treeFilterMode: "default" | "no-tools" | "user-only" | "labeled-only" | "all";
    showHardwareCursor: boolean;
    editorPaddingX: number;
    autocompleteMaxVisible: number;
    quietStartup: boolean;
    clearOnShrink: boolean;
    showTerminalProgress: boolean;
    fullscreen: boolean;
    warnings: WarningSettings;
}
export interface SettingsCallbacks {
    onAutoCompactChange: (enabled: boolean) => void;
    onIdleEvictionMinutesChange: (value: IdleEvictionMinutes) => void;
    onShowImagesChange: (enabled: boolean) => void;
    onAutoResizeImagesChange: (enabled: boolean) => void;
    onBlockImagesChange: (blocked: boolean) => void;
    onEnableSkillCommandsChange: (enabled: boolean) => void;
    onEnableBuiltinSkillsChange: (enabled: boolean) => void;
    onSteeringModeChange: (mode: "all" | "one-at-a-time") => void;
    onFollowUpModeChange: (mode: "all" | "one-at-a-time") => void;
    onTransportChange: (transport: Transport) => void;
    onThinkingLevelChange: (level: ThinkingLevel) => void;
    onThemeChange: (theme: string) => void;
    onThemePreview?: (theme: string) => void;
    onHideThinkingBlockChange: (hidden: boolean) => void;
    onTreeFilterModeChange: (mode: "default" | "no-tools" | "user-only" | "labeled-only" | "all") => void;
    onShowHardwareCursorChange: (enabled: boolean) => void;
    onEditorPaddingXChange: (padding: number) => void;
    onAutocompleteMaxVisibleChange: (maxVisible: number) => void;
    onQuietStartupChange: (enabled: boolean) => void;
    onClearOnShrinkChange: (enabled: boolean) => void;
    onShowTerminalProgressChange: (enabled: boolean) => void;
    onFullscreenChange: (enabled: boolean) => void;
    onWarningsChange: (warnings: WarningSettings) => void;
    onCancel: () => void;
}
/**
 * Main settings selector component.
 */
export declare class SettingsSelectorComponent extends Container {
    private settingsList;
    constructor(config: SettingsConfig, callbacks: SettingsCallbacks);
    getSettingsList(): SettingsList;
}
//# sourceMappingURL=settings-selector.d.ts.map