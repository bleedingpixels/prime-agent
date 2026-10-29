import { Container, fuzzyFilter, getKeybindings, Spacer, TruncatedText } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.js";
import { getMenuListLayout, MenuList, MenuPanel, MenuRow, MenuSearchInput, } from "./menu-panel.js";
const PREFERRED_VISIBLE_TEAMS = 8;
const TEAM_LIST_RESERVED_ROWS = 7;
const TEAM_SCROLL_INDICATOR_ROWS = 1;
export class PrimeTeamSelectorComponent extends Container {
    currentTeamId;
    onSelect;
    onCancel;
    viewport;
    searchInput;
    listContainer;
    allOptions;
    filteredOptions;
    selectedIndex = 0;
    searchQuery = "";
    _focused = false;
    listLayout = getMenuListLayout({
        preferredVisibleItems: PREFERRED_VISIBLE_TEAMS,
        reservedRows: TEAM_LIST_RESERVED_ROWS,
        comfortableItemRows: 3,
        compactItemRows: 2,
    });
    constructor(teams, currentTeamId, onSelect, onCancel, viewport = {}) {
        super();
        this.currentTeamId = currentTeamId;
        this.onSelect = onSelect;
        this.onCancel = onCancel;
        this.viewport = viewport;
        this.allOptions = [{ type: "personal", team: null }, ...teams.map((team) => ({ type: "team", team }))];
        this.filteredOptions = this.allOptions;
        const panel = new MenuPanel({
            title: "Prime Team",
            subtitle: "Choose which account pays for Prime Inference usage.",
        });
        this.addChild(panel);
        this.searchInput = new MenuSearchInput("Search teams");
        this.searchInput.onSubmit = () => {
            const selected = this.filteredOptions[this.selectedIndex];
            if (selected) {
                this.onSelect(selected.team);
            }
        };
        panel.addChild(this.searchInput);
        panel.addChild(new Spacer(1));
        this.listContainer = new MenuList({ compact: () => this.listLayout.compact });
        panel.addChild(this.listContainer);
        this.filterOptions("");
    }
    get focused() {
        return this._focused;
    }
    set focused(value) {
        this._focused = value;
        this.searchInput.focused = value;
    }
    filterOptions(query) {
        const queryChanged = query !== this.searchQuery;
        this.searchQuery = query;
        this.filteredOptions = query
            ? fuzzyFilter(this.allOptions, query, (option) => this.getSearchText(option))
            : this.allOptions;
        this.selectedIndex = queryChanged
            ? 0
            : Math.max(0, Math.min(this.selectedIndex, Math.max(0, this.filteredOptions.length - 1)));
        this.updateList();
    }
    getSearchText(option) {
        if (option.type === "personal") {
            return "personal account";
        }
        const team = option.team;
        return team ? `${team.name} ${team.slug ?? ""} ${team.role ?? ""} ${team.teamId}` : "";
    }
    render(width) {
        const previousLayout = this.listLayout;
        this.updateLayout();
        if (this.listLayout.compact !== previousLayout.compact ||
            this.listLayout.visibleItems !== previousLayout.visibleItems) {
            this.updateList();
        }
        return super.render(width);
    }
    updateList() {
        this.updateLayout();
        this.listContainer.clear();
        const maxVisible = this.listLayout.visibleItems;
        const startIndex = Math.max(0, Math.min(this.selectedIndex - Math.floor(maxVisible / 2), this.filteredOptions.length - maxVisible));
        const endIndex = Math.min(startIndex + maxVisible, this.filteredOptions.length);
        for (let i = startIndex; i < endIndex; i++) {
            const option = this.filteredOptions[i];
            if (!option) {
                continue;
            }
            this.listContainer.addChild(new MenuRow({
                primary: this.getPrimary(option),
                secondary: this.getSecondary(option),
                meta: this.getMeta(option),
                selected: i === this.selectedIndex,
            }));
        }
        if (startIndex > 0 || endIndex < this.filteredOptions.length) {
            this.listContainer.addChild(new TruncatedText(theme.fg("muted", `  (${this.selectedIndex + 1}/${this.filteredOptions.length})`), 1, 0));
        }
        if (this.filteredOptions.length === 0) {
            this.listContainer.addChild(new TruncatedText(theme.fg("muted", "No matching teams"), 1, 0));
        }
    }
    getPrimary(option) {
        return option.team?.name ?? "Personal";
    }
    getSecondary(option) {
        if (!option.team) {
            return "personal account";
        }
        const role = option.team.role?.toLowerCase() ?? "member";
        return option.team.slug ? `slug: ${option.team.slug}, role: ${role}` : `role: ${role}`;
    }
    getMeta(option) {
        const isCurrent = option.team ? option.team.teamId === this.currentTeamId : this.currentTeamId === undefined;
        return isCurrent ? theme.fg("success", "current") : "";
    }
    handleInput(keyData) {
        const kb = getKeybindings();
        if (kb.matches(keyData, "tui.select.up")) {
            if (this.filteredOptions.length === 0) {
                return;
            }
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.updateList();
        }
        else if (kb.matches(keyData, "tui.select.down")) {
            if (this.filteredOptions.length === 0) {
                return;
            }
            this.selectedIndex = Math.min(this.filteredOptions.length - 1, this.selectedIndex + 1);
            this.updateList();
        }
        else if (kb.matches(keyData, "tui.select.confirm")) {
            const selected = this.filteredOptions[this.selectedIndex];
            if (selected) {
                this.onSelect(selected.team);
            }
        }
        else if (kb.matches(keyData, "tui.select.cancel")) {
            this.onCancel();
        }
        else {
            this.searchInput.handleInput(keyData);
            this.filterOptions(this.searchInput.getValue());
        }
    }
    updateLayout() {
        this.listLayout = getMenuListLayout({
            getRows: this.viewport.getRows,
            preferredVisibleItems: PREFERRED_VISIBLE_TEAMS,
            totalItems: this.filteredOptions.length,
            reservedRows: TEAM_LIST_RESERVED_ROWS,
            comfortableItemRows: 3,
            compactItemRows: 2,
            scrollIndicatorRows: TEAM_SCROLL_INDICATOR_ROWS,
        });
    }
}
//# sourceMappingURL=prime-team-selector.js.map