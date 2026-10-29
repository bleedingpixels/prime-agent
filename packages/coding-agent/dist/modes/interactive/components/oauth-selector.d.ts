import { type Component, Container, type Focusable } from "@earendil-works/pi-tui";
import type { AuthStatus, AuthStorage } from "../../../core/auth-storage.js";
import { MenuSearchInput, type MenuViewportProvider } from "./menu-panel.js";
export type AuthSelectorCategory = "provider" | "service";
export type AuthSelectorProvider = {
    id: string;
    name: string;
    authType: "oauth" | "api_key";
    /** Which tab the entry belongs to. Defaults to "provider" when omitted. */
    category?: AuthSelectorCategory;
};
export interface OAuthSelectorOptions extends MenuViewportProvider {
    initialCategory?: AuthSelectorCategory;
    header?: Component;
    getHeaderRows?: () => number;
    title?: string;
    subtitle?: string;
    searchPlaceholder?: string;
}
export declare function compareAuthSelectorProviders(a: AuthSelectorProvider, b: AuthSelectorProvider): number;
/**
 * Component that renders an auth provider selector
 */
export declare class OAuthSelectorComponent extends Container implements Focusable {
    private searchInput;
    private _focused;
    get focused(): boolean;
    set focused(value: boolean);
    private listContainer;
    private tabBar?;
    private allProviders;
    private filteredProviders;
    private selectedIndex;
    private searchQuery;
    private mode;
    /** Tabs present in the data, in display order. Empty/single → no tab bar. */
    private categories;
    private activeCategory;
    private authStorage;
    private getAuthStatus;
    private onSelectCallback;
    private onCancelCallback;
    private listLayout;
    private readonly viewport;
    private readonly getHeaderRows;
    constructor(mode: "login" | "logout", authStorage: AuthStorage, providers: AuthSelectorProvider[], onSelect: (provider: AuthSelectorProvider) => void, onCancel: () => void, getAuthStatus?: (providerId: string) => AuthStatus, options?: OAuthSelectorOptions);
    private inActiveCategory;
    private switchCategory;
    private updateTabBar;
    private filterProviders;
    private sortProviders;
    refresh(): void;
    getSearchInput(): MenuSearchInput;
    private getProviderSortRank;
    private isProviderStale;
    private isProviderConfigured;
    render(width: number): string[];
    private updateList;
    private formatStatusIndicator;
    private formatApiKeyStatusIndicator;
    handleInput(keyData: string): void;
    private get reservedRows();
    private updateLayout;
}
//# sourceMappingURL=oauth-selector.d.ts.map