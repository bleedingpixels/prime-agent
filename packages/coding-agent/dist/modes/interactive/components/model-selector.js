import { modelsAreEqual } from "@earendil-works/pi-ai";
import { Container, fuzzyFilterScored, getKeybindings, Spacer, Text, } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.js";
import { keyHint } from "./keybinding-hints.js";
import { getMenuListLayout, MenuList, MenuPanel, MenuRow, MenuSearchInput, } from "./menu-panel.js";
import { shouldTreatAsBack } from "./modal-back.js";
const PREFERRED_VISIBLE_MODELS = 10;
const MODEL_LIST_RESERVED_ROWS = {
    base: 7,
    detail: 2,
};
const MODEL_SCROLL_INDICATOR_ROWS = 1;
const MODEL_HELP_MIN_ROWS = 12;
const MODEL_DETAIL_MIN_ROWS = 14;
/**
 * Component that renders a model selector with search
 */
export class ModelSelectorComponent extends Container {
    searchInput;
    // Focusable implementation - propagate to searchInput for IME cursor positioning
    _focused = false;
    get focused() {
        return this._focused;
    }
    set focused(value) {
        this._focused = value;
        this.searchInput.focused = value;
    }
    listContainer;
    allModels = [];
    scopedModelItems = [];
    activeModels = [];
    filteredModels = [];
    selectedIndex = 0;
    searchQuery = "";
    currentModel;
    modelRegistry;
    onSelectCallback;
    onCancelCallback;
    availableModels;
    configuredProviders;
    recentRank;
    errorMessage;
    tui;
    scopedModels;
    scope = "all";
    scopeText;
    scopeHintText;
    panel;
    headerHelpContainer;
    warningText;
    listLayout = getMenuListLayout({
        preferredVisibleItems: PREFERRED_VISIBLE_MODELS,
        reservedRows: MODEL_LIST_RESERVED_ROWS.base,
        comfortableItemRows: 3,
        compactItemRows: 2,
    });
    responsiveLayoutKey = "";
    viewport;
    getHeaderRows;
    constructor(tui, currentModel, modelRegistry, scopedModels, onSelect, onCancel, initialSearchInput, options = {}) {
        super();
        this.tui = tui;
        this.currentModel = currentModel;
        this.modelRegistry = modelRegistry;
        this.scopedModels = scopedModels;
        this.scope = scopedModels.length > 0 ? "scoped" : "all";
        this.onSelectCallback = onSelect;
        this.onCancelCallback = onCancel;
        this.availableModels = options.availableModels;
        this.configuredProviders = options.configuredProviders;
        this.recentRank = new Map((options.recentModels ?? []).map((key, i) => [key, i]));
        this.viewport = { getRows: options.getRows };
        this.getHeaderRows = options.header ? (options.getHeaderRows ?? (() => 2)) : () => 0;
        this.panel = new MenuPanel({
            title: "Models",
            subtitle: options.subtitle ?? "All models across supported providers.",
        });
        this.addChild(this.panel);
        if (options.header) {
            this.panel.addChild(options.header);
            this.panel.addChild(new Spacer(1));
        }
        // Add hint about model filtering
        if (scopedModels.length > 0) {
            this.scopeText = new Text(this.getScopeText(), 0, 0);
            this.scopeHintText = new Text(this.getScopeHintText(), 0, 0);
        }
        else {
            const hintText = "Signed-in providers first. Other models prompt sign-in.";
            this.warningText = new Text(theme.fg("muted", hintText), 0, 0);
        }
        this.headerHelpContainer = new Container();
        this.panel.addChild(this.headerHelpContainer);
        // Create search input
        this.searchInput = new MenuSearchInput("Search models");
        if (initialSearchInput) {
            this.searchInput.setValue(initialSearchInput);
        }
        this.searchInput.onSubmit = () => {
            this.handleConfirm();
        };
        this.panel.addChild(this.searchInput);
        this.panel.addChild(new Spacer(1));
        // Create list container
        this.listContainer = new MenuList({ compact: () => this.listLayout.compact });
        this.panel.addChild(this.listContainer);
        this.updateResponsiveLayout();
        this.loadModels();
        if (initialSearchInput) {
            this.filterModels(initialSearchInput);
        }
        else {
            this.updateList();
        }
        this.tui.requestRender();
    }
    updateAvailableModels(availableModels) {
        this.updateState(this.currentModel, availableModels);
    }
    updateState(currentModel, availableModels = this.availableModels, configuredProviders = this.configuredProviders) {
        this.currentModel = currentModel;
        this.availableModels = availableModels;
        this.configuredProviders = configuredProviders;
        const query = this.searchInput.getValue();
        const selectedKey = this.getSelectedModelKey();
        this.loadModels();
        this.filterModels(query);
        if (selectedKey) {
            const selectedIndex = this.filteredModels.findIndex((item) => this.getModelKey(item) === selectedKey);
            if (selectedIndex >= 0) {
                this.selectedIndex = selectedIndex;
                this.updateList();
            }
        }
        this.tui.requestRender();
    }
    loadModels() {
        let models;
        this.errorMessage = undefined;
        if (this.availableModels === undefined) {
            this.modelRegistry.refresh();
            const loadError = this.modelRegistry.getError();
            if (loadError) {
                this.errorMessage = loadError;
            }
        }
        // Load available models (built-in models still work even if models.json failed)
        let availableModels;
        try {
            availableModels =
                this.availableModels !== undefined ? this.availableModels : this.modelRegistry.getAvailable();
            models = availableModels.map((model) => ({
                provider: model.provider,
                id: model.id,
                model,
            }));
        }
        catch (error) {
            this.allModels = [];
            this.scopedModelItems = [];
            this.activeModels = [];
            this.filteredModels = [];
            this.errorMessage = error instanceof Error ? error.message : String(error);
            return;
        }
        this.allModels = this.sortModels(models);
        const availableModelsById = new Map(availableModels.map((model) => [`${model.provider}/${model.id}`, model]));
        this.scopedModels = this.scopedModels.map((scoped) => {
            const scopedModelId = `${scoped.model.provider}/${scoped.model.id}`;
            const refreshed = availableModelsById.get(scopedModelId) ??
                (this.availableModels !== undefined
                    ? undefined
                    : this.modelRegistry.find(scoped.model.provider, scoped.model.id));
            return refreshed ? { ...scoped, model: refreshed } : scoped;
        });
        this.scopedModelItems = this.scopedModels.map((scoped) => ({
            provider: scoped.model.provider,
            id: scoped.model.id,
            model: scoped.model,
        }));
        this.activeModels = this.scope === "scoped" ? this.scopedModelItems : this.allModels;
        this.filteredModels = this.activeModels;
        const currentIndex = this.filteredModels.findIndex((item) => modelsAreEqual(this.currentModel, item.model));
        this.selectedIndex =
            currentIndex >= 0 ? currentIndex : Math.min(this.selectedIndex, Math.max(0, this.getSelectableCount() - 1));
    }
    getModelKey(item) {
        return `${item.provider}/${item.id}`;
    }
    getSelectedModelKey() {
        const selected = this.filteredModels[this.selectedIndex];
        return selected ? this.getModelKey(selected) : undefined;
    }
    recentRankOf(item) {
        // Finite sentinel so subtracting two non-recent ranks yields 0, not NaN.
        return this.recentRank.get(`${item.provider}/${item.id}`) ?? Number.MAX_SAFE_INTEGER;
    }
    isProviderConfigured(item) {
        return this.configuredProviders?.has(item.provider) || this.modelRegistry.hasConfiguredAuth(item.model);
    }
    sortModels(models) {
        const sorted = [...models];
        sorted.sort((a, b) => {
            const configuredDiff = Number(this.isProviderConfigured(b)) - Number(this.isProviderConfigured(a));
            if (configuredDiff !== 0)
                return configuredDiff;
            const aIsCurrent = modelsAreEqual(this.currentModel, a.model);
            const bIsCurrent = modelsAreEqual(this.currentModel, b.model);
            if (aIsCurrent !== bIsCurrent)
                return aIsCurrent ? -1 : 1;
            const rankDiff = this.recentRankOf(a) - this.recentRankOf(b);
            if (rankDiff !== 0)
                return rankDiff;
            const providerDiff = a.provider.localeCompare(b.provider);
            if (providerDiff !== 0)
                return providerDiff;
            const aFeatured = a.model.featured === true;
            const bFeatured = b.model.featured === true;
            if (aFeatured !== bFeatured)
                return aFeatured ? -1 : 1;
            return a.id.localeCompare(b.id, undefined, { numeric: true });
        });
        return sorted;
    }
    getScopeText() {
        const allText = this.scope === "all" ? theme.fg("accent", "all") : theme.fg("muted", "all");
        const scopedText = this.scope === "scoped" ? theme.fg("accent", "scoped") : theme.fg("muted", "scoped");
        return `${theme.fg("muted", "Scope: ")}${allText}${theme.fg("muted", " | ")}${scopedText}`;
    }
    getScopeHintText() {
        return keyHint("app.model.toggleScope", "scope") + theme.fg("muted", " (all/scoped)");
    }
    setScope(scope) {
        if (this.scope === scope)
            return;
        this.scope = scope;
        this.activeModels = this.scope === "scoped" ? this.scopedModelItems : this.allModels;
        const currentIndex = this.activeModels.findIndex((item) => modelsAreEqual(this.currentModel, item.model));
        this.selectedIndex = currentIndex >= 0 ? currentIndex : 0;
        this.filterModels(this.searchInput.getValue());
        if (this.scopeText) {
            this.scopeText.setText(this.getScopeText());
        }
    }
    filterModels(query) {
        const queryChanged = query !== this.searchQuery;
        this.searchQuery = query;
        if (query.trim()) {
            const scored = fuzzyFilterScored(this.activeModels, query, ({ id, provider }) => `${id} ${provider} ${provider}/${id} ${provider} ${id}`);
            scored.sort((a, b) => a.score - b.score ||
                Number(this.isProviderConfigured(b.item)) - Number(this.isProviderConfigured(a.item)) ||
                this.recentRankOf(a.item) - this.recentRankOf(b.item));
            this.filteredModels = scored.map((r) => r.item);
        }
        else {
            this.filteredModels = this.activeModels;
        }
        this.selectedIndex = queryChanged ? 0 : Math.min(this.selectedIndex, Math.max(0, this.getSelectableCount() - 1));
        this.updateList();
    }
    render(width) {
        const previousLayoutKey = this.responsiveLayoutKey;
        this.updateResponsiveLayout();
        if (this.responsiveLayoutKey !== previousLayoutKey) {
            this.updateList();
        }
        return super.render(width);
    }
    updateList() {
        this.updateResponsiveLayout();
        this.listContainer.clear();
        const maxVisible = this.listLayout.visibleItems;
        const selectedModelIndex = Math.min(this.selectedIndex, Math.max(0, this.filteredModels.length - 1));
        const startIndex = Math.max(0, Math.min(selectedModelIndex - Math.floor(maxVisible / 2), this.filteredModels.length - maxVisible));
        const endIndex = Math.min(startIndex + maxVisible, this.filteredModels.length);
        // Show visible slice of filtered models
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.filteredModels[i];
            if (!item)
                continue;
            const isSelected = i === this.selectedIndex;
            const isCurrent = modelsAreEqual(this.currentModel, item.model);
            const isConfigured = this.isProviderConfigured(item);
            const meta = isConfigured
                ? isCurrent
                    ? theme.fg("success", "current")
                    : undefined
                : theme.fg("warning", isCurrent ? "current · sign in" : "sign in");
            this.listContainer.addChild(new MenuRow({
                primary: item.id,
                secondary: item.provider,
                meta,
                selected: isSelected,
            }));
        }
        // Add scroll indicator if needed
        if (startIndex > 0 || endIndex < this.filteredModels.length) {
            const scrollInfo = theme.fg("muted", `  (${selectedModelIndex + 1}/${this.filteredModels.length})`);
            this.listContainer.addChild(new Text(scrollInfo, 0, 0));
        }
        // Show error message or "no results" if empty
        if (this.errorMessage) {
            // Show error in red
            const errorLines = this.errorMessage.split("\n");
            for (const line of errorLines) {
                this.listContainer.addChild(new Text(theme.fg("error", line), 0, 0));
            }
        }
        else if (this.filteredModels.length === 0) {
            this.listContainer.addChild(new Text(theme.fg("muted", "No matching models"), 0, 0));
        }
        else {
            const selected = this.filteredModels[this.selectedIndex];
            if (selected && this.shouldShowSelectedDetails()) {
                this.listContainer.addChild(new Spacer(1));
                this.listContainer.addChild(new Text(theme.fg("muted", selected.model.name), 0, 0));
            }
        }
    }
    handleInput(keyData) {
        const kb = getKeybindings();
        if (kb.matches(keyData, "app.model.toggleScope")) {
            if (this.scopedModelItems.length > 0) {
                const nextScope = this.scope === "all" ? "scoped" : "all";
                this.setScope(nextScope);
                if (this.scopeHintText) {
                    this.scopeHintText.setText(this.getScopeHintText());
                }
            }
            return;
        }
        // Up arrow - wrap to bottom when at top
        if (kb.matches(keyData, "tui.select.up")) {
            const selectableCount = this.getSelectableCount();
            if (selectableCount === 0)
                return;
            this.selectedIndex = this.selectedIndex === 0 ? selectableCount - 1 : this.selectedIndex - 1;
            this.updateList();
        }
        // Down arrow - wrap to top when at bottom
        else if (kb.matches(keyData, "tui.select.down")) {
            const selectableCount = this.getSelectableCount();
            if (selectableCount === 0)
                return;
            this.selectedIndex = this.selectedIndex === selectableCount - 1 ? 0 : this.selectedIndex + 1;
            this.updateList();
        }
        // Enter
        else if (kb.matches(keyData, "tui.select.confirm")) {
            this.handleConfirm();
        }
        // Escape / Ctrl+C, or left arrow when the search field is at its start
        else if (kb.matches(keyData, "tui.select.cancel") || shouldTreatAsBack(keyData, this.searchInput)) {
            this.onCancelCallback();
        }
        // Pass everything else to search input
        else {
            this.searchInput.handleInput(keyData);
            this.filterModels(this.searchInput.getValue());
        }
    }
    handleSelect(model) {
        this.onSelectCallback(model);
    }
    handleConfirm() {
        const selectedModel = this.filteredModels[this.selectedIndex];
        if (selectedModel) {
            this.handleSelect(selectedModel.model);
            return;
        }
    }
    getSelectableCount() {
        return this.filteredModels.length;
    }
    getSearchInput() {
        return this.searchInput;
    }
    updateResponsiveLayout() {
        const showHeaderHelp = this.shouldShowHeaderHelp();
        let headerHelpRows = 0;
        this.headerHelpContainer.clear();
        if (showHeaderHelp) {
            if (this.scopeText && this.scopeHintText) {
                this.headerHelpContainer.addChild(this.scopeText);
                this.headerHelpContainer.addChild(this.scopeHintText);
                headerHelpRows += 2;
            }
            else if (this.warningText) {
                this.headerHelpContainer.addChild(this.warningText);
                headerHelpRows += 1;
            }
            this.headerHelpContainer.addChild(new Spacer(1));
            headerHelpRows += 1;
        }
        const headerRows = this.getHeaderRows();
        const reservedRows = MODEL_LIST_RESERVED_ROWS.base +
            headerRows +
            headerHelpRows +
            (this.shouldShowSelectedDetails() ? MODEL_LIST_RESERVED_ROWS.detail : 0);
        this.listLayout = getMenuListLayout({
            getRows: this.viewport.getRows,
            preferredVisibleItems: PREFERRED_VISIBLE_MODELS,
            totalItems: this.filteredModels.length,
            reservedRows,
            comfortableItemRows: 3,
            compactItemRows: 2,
            scrollIndicatorRows: MODEL_SCROLL_INDICATOR_ROWS,
        });
        this.responsiveLayoutKey = [
            headerRows,
            showHeaderHelp ? "help" : "no-help",
            headerHelpRows,
            this.shouldShowSelectedDetails() ? "detail" : "no-detail",
            this.listLayout.compact ? "compact" : "comfortable",
            this.listLayout.visibleItems,
        ].join(":");
    }
    shouldShowHeaderHelp() {
        return this.hasRows(MODEL_HELP_MIN_ROWS);
    }
    shouldShowSelectedDetails() {
        return this.hasRows(MODEL_DETAIL_MIN_ROWS);
    }
    hasRows(minRows) {
        const rows = this.viewport.getRows?.();
        return rows === undefined || !Number.isFinite(rows) || rows >= minRows;
    }
}
//# sourceMappingURL=model-selector.js.map