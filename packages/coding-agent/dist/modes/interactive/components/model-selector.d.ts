import { type Model } from "@earendil-works/pi-ai";
import { type Component, Container, type Focusable, type TUI } from "@earendil-works/pi-tui";
import type { ModelRegistry } from "../../../core/model-registry.js";
import { MenuSearchInput } from "./menu-panel.js";
interface ScopedModelItem {
    model: Model<any>;
    thinkingLevel?: string;
}
export interface ModelSelectorOptions {
    availableModels?: ReadonlyArray<Model<any>>;
    configuredProviders?: ReadonlySet<string>;
    header?: Component;
    getHeaderRows?: () => number;
    subtitle?: string;
    getRows?: () => number;
    recentModels?: ReadonlyArray<string>;
}
/**
 * Component that renders a model selector with search
 */
export declare class ModelSelectorComponent extends Container implements Focusable {
    private searchInput;
    private _focused;
    get focused(): boolean;
    set focused(value: boolean);
    private listContainer;
    private allModels;
    private scopedModelItems;
    private activeModels;
    private filteredModels;
    private selectedIndex;
    private searchQuery;
    private currentModel?;
    private modelRegistry;
    private onSelectCallback;
    private onCancelCallback;
    private availableModels?;
    private configuredProviders?;
    private recentRank;
    private errorMessage?;
    private tui;
    private scopedModels;
    private scope;
    private scopeText?;
    private scopeHintText?;
    private panel;
    private headerHelpContainer;
    private warningText?;
    private listLayout;
    private responsiveLayoutKey;
    private readonly viewport;
    private readonly getHeaderRows;
    constructor(tui: TUI, currentModel: Model<any> | undefined, modelRegistry: ModelRegistry, scopedModels: ReadonlyArray<ScopedModelItem>, onSelect: (model: Model<any>) => void, onCancel: () => void, initialSearchInput?: string, options?: ModelSelectorOptions);
    updateAvailableModels(availableModels: ReadonlyArray<Model<any>>): void;
    updateState(currentModel: Model<any> | undefined, availableModels?: readonly Model<any>[] | undefined, configuredProviders?: ReadonlySet<string> | undefined): void;
    private loadModels;
    private getModelKey;
    private getSelectedModelKey;
    private recentRankOf;
    private isProviderConfigured;
    private sortModels;
    private getScopeText;
    private getScopeHintText;
    private setScope;
    private filterModels;
    render(width: number): string[];
    private updateList;
    handleInput(keyData: string): void;
    private handleSelect;
    private handleConfirm;
    private getSelectableCount;
    getSearchInput(): MenuSearchInput;
    private updateResponsiveLayout;
    private shouldShowHeaderHelp;
    private shouldShowSelectedDetails;
    private hasRows;
}
export {};
//# sourceMappingURL=model-selector.d.ts.map