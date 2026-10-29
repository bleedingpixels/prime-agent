import { Container, type Focusable } from "@earendil-works/pi-tui";
import type { PrimeTeam } from "../../../core/prime-inference-auth.js";
import { type MenuViewportProvider } from "./menu-panel.js";
export declare class PrimeTeamSelectorComponent extends Container implements Focusable {
    private readonly currentTeamId;
    private readonly onSelect;
    private readonly onCancel;
    private readonly viewport;
    private readonly searchInput;
    private readonly listContainer;
    private readonly allOptions;
    private filteredOptions;
    private selectedIndex;
    private searchQuery;
    private _focused;
    private listLayout;
    constructor(teams: PrimeTeam[], currentTeamId: string | undefined, onSelect: (team: PrimeTeam | null) => void, onCancel: () => void, viewport?: MenuViewportProvider);
    get focused(): boolean;
    set focused(value: boolean);
    private filterOptions;
    private getSearchText;
    render(width: number): string[];
    private updateList;
    private getPrimary;
    private getSecondary;
    private getMeta;
    handleInput(keyData: string): void;
    private updateLayout;
}
//# sourceMappingURL=prime-team-selector.d.ts.map