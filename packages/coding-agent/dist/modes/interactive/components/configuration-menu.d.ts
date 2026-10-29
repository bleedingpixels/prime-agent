import type { Api, Model } from "@earendil-works/pi-ai";
import { Container, type Focusable, type TUI } from "@earendil-works/pi-tui";
import type { AuthStorage } from "../../../core/auth-storage.js";
import type { ModelRegistry } from "../../../core/model-registry.js";
import { type AuthSelectorProvider } from "./oauth-selector.js";
export declare const CONFIGURATION_MENU_TABS: readonly ["providers", "models", "mcp-connections"];
export type ConfigurationMenuTab = (typeof CONFIGURATION_MENU_TABS)[number];
export interface ConfigurationMenuScopedModel {
    model: Model<Api>;
    thinkingLevel?: string;
}
export interface ConfigurationMenuOptions {
    initialTab: ConfigurationMenuTab;
    tui: TUI;
    authStorage: AuthStorage;
    providerOptions: ReadonlyArray<AuthSelectorProvider>;
    modelRegistry: ModelRegistry;
    currentModel: Model<Api> | undefined;
    scopedModels: ReadonlyArray<ConfigurationMenuScopedModel>;
    availableModels: ReadonlyArray<Model<Api>>;
    configuredProviders: ReadonlySet<string>;
    recentModels?: ReadonlyArray<string>;
    initialModelSearch?: string;
    getRows?: () => number;
    requestRender: () => void;
    onSelectProvider: (provider: AuthSelectorProvider) => void;
    onSelectMcpConnection: (provider: AuthSelectorProvider) => void;
    onSelectModel: (model: Model<Api>) => void;
    onCancel: () => void;
}
export declare class ConfigurationMenuComponent extends Container implements Focusable {
    private readonly options;
    private readonly bodies;
    private activeTab;
    private _focused;
    private renderWidth;
    constructor(options: ConfigurationMenuOptions);
    get focused(): boolean;
    set focused(value: boolean);
    render(width: number): string[];
    getActiveTab(): ConfigurationMenuTab;
    getSearchValue(tab?: ConfigurationMenuTab): string;
    setActiveTab(tab: ConfigurationMenuTab): void;
    refreshAuthentication(): void;
    updateModels(currentModel: Model<Api> | undefined, models?: ReadonlyArray<Model<Api>>, configuredProviders?: ReadonlySet<string>): void;
    handleInput(keyData: string): void;
    private get activeBody();
    private switchTab;
}
//# sourceMappingURL=configuration-menu.d.ts.map