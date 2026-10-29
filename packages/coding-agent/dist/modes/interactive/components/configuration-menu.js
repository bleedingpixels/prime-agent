import { Container, getKeybindings, visibleWidth, wrapTextWithAnsi, } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.js";
import { keyText } from "./keybinding-hints.js";
import { getMenuPanelInnerWidth } from "./menu-panel.js";
import { ModelSelectorComponent } from "./model-selector.js";
import { OAuthSelectorComponent } from "./oauth-selector.js";
export const CONFIGURATION_MENU_TABS = ["providers", "models", "mcp-connections"];
const TAB_LABELS = {
    providers: "Providers",
    models: "Models",
    "mcp-connections": "MCP Connections",
};
class ConfigurationMenuTabBar {
    getActiveTab;
    constructor(getActiveTab) {
        this.getActiveTab = getActiveTab;
    }
    render(width) {
        return this.getLines(width);
    }
    getRowCount(width) {
        return this.getLines(width).length;
    }
    getLines(width) {
        const safeWidth = Math.max(1, width);
        const activeTab = this.getActiveTab();
        const labels = CONFIGURATION_MENU_TABS.map((tab) => {
            const label = `[${tab === activeTab ? "▶" : " "} ${TAB_LABELS[tab]}]`;
            return tab === activeTab ? theme.bold(theme.fg("accent", label)) : theme.fg("text", label);
        });
        const lines = this.wrapItems([theme.bold(theme.fg("muted", "Tabs:")), ...labels], theme.fg("muted", "  "), safeWidth);
        const tabKey = keyText("tui.input.tab", { primaryOnly: true });
        const shiftTabKey = keyText("app.configuration.previousTab", { primaryOnly: true });
        const closeKey = keyText("tui.select.cancel", { primaryOnly: true });
        const hint = `${theme.fg("dim", `${tabKey}/${shiftTabKey}`)}${theme.fg("muted", " switch tabs · ")}${theme.fg("dim", closeKey)}${theme.fg("muted", " close")}`;
        return [...lines, ...wrapTextWithAnsi(hint, safeWidth)];
    }
    wrapItems(items, separator, width) {
        const lines = [];
        let line = "";
        for (const item of items) {
            const candidate = line ? `${line}${separator}${item}` : item;
            if (line && visibleWidth(candidate) > width) {
                lines.push(...wrapTextWithAnsi(line, width));
                line = item;
            }
            else {
                line = candidate;
            }
        }
        if (line) {
            lines.push(...wrapTextWithAnsi(line, width));
        }
        return lines;
    }
    invalidate() { }
}
export class ConfigurationMenuComponent extends Container {
    options;
    bodies;
    activeTab;
    _focused = false;
    renderWidth = 78;
    constructor(options) {
        super();
        this.options = options;
        this.activeTab = options.initialTab;
        const tabBar = new ConfigurationMenuTabBar(() => this.activeTab);
        const getHeaderRows = () => tabBar.getRowCount(getMenuPanelInnerWidth(this.renderWidth)) + 1;
        const providerOptions = options.providerOptions.filter((provider) => (provider.category ?? "provider") === "provider");
        const mcpOptions = options.providerOptions.filter((provider) => provider.category === "service");
        const providers = new OAuthSelectorComponent("login", options.authStorage, providerOptions, options.onSelectProvider, options.onCancel, (providerId) => options.modelRegistry.getProviderAuthStatus(providerId), {
            getRows: options.getRows,
            header: tabBar,
            getHeaderRows,
            title: "Providers",
            subtitle: "Connect with a subscription or API key.",
            searchPlaceholder: "Search providers",
        });
        const models = new ModelSelectorComponent(options.tui, options.currentModel, options.modelRegistry, options.scopedModels, options.onSelectModel, options.onCancel, options.initialModelSearch, {
            availableModels: options.availableModels,
            configuredProviders: options.configuredProviders,
            header: tabBar,
            getHeaderRows,
            getRows: options.getRows,
            recentModels: options.recentModels,
        });
        const mcpConnections = new OAuthSelectorComponent("login", options.authStorage, mcpOptions, options.onSelectMcpConnection, options.onCancel, (providerId) => options.modelRegistry.getProviderAuthStatus(providerId), {
            getRows: options.getRows,
            header: tabBar,
            getHeaderRows,
            title: "MCP Connections",
            subtitle: "Connect MCP integrations and service credentials.",
            searchPlaceholder: "Search MCP connections",
        });
        this.bodies = {
            providers,
            models,
            "mcp-connections": mcpConnections,
        };
        this.addChild(this.activeBody);
    }
    get focused() {
        return this._focused;
    }
    set focused(value) {
        this._focused = value;
        this.activeBody.focused = value;
    }
    render(width) {
        this.renderWidth = width;
        return super.render(width);
    }
    getActiveTab() {
        return this.activeTab;
    }
    getSearchValue(tab = this.activeTab) {
        return this.bodies[tab].getSearchInput().getValue();
    }
    setActiveTab(tab) {
        if (tab === this.activeTab)
            return;
        this.activeBody.focused = false;
        this.activeTab = tab;
        this.clear();
        this.addChild(this.activeBody);
        this.activeBody.focused = this._focused;
        this.options.requestRender();
    }
    refreshAuthentication() {
        this.bodies.providers.refresh();
        this.bodies["mcp-connections"].refresh();
        this.options.requestRender();
    }
    updateModels(currentModel, models, configuredProviders) {
        this.bodies.models.updateState(currentModel, models, configuredProviders);
    }
    handleInput(keyData) {
        const kb = getKeybindings();
        if (kb.matches(keyData, "tui.input.tab")) {
            this.switchTab(1);
            return;
        }
        if (kb.matches(keyData, "app.configuration.previousTab")) {
            this.switchTab(-1);
            return;
        }
        if (this.activeTab === "models" &&
            (kb.matches(keyData, "tui.editor.cursorLeft") || kb.matches(keyData, "tui.editor.cursorRight"))) {
            this.activeBody.getSearchInput().handleInput(keyData);
            return;
        }
        this.activeBody.handleInput(keyData);
    }
    get activeBody() {
        return this.bodies[this.activeTab];
    }
    switchTab(direction) {
        const currentIndex = CONFIGURATION_MENU_TABS.indexOf(this.activeTab);
        const nextIndex = (currentIndex + direction + CONFIGURATION_MENU_TABS.length) % CONFIGURATION_MENU_TABS.length;
        this.setActiveTab(CONFIGURATION_MENU_TABS[nextIndex] ?? "providers");
    }
}
//# sourceMappingURL=configuration-menu.js.map