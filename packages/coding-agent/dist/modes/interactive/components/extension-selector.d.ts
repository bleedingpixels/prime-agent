/**
 * Generic selector component for extensions.
 * Displays a list of string options with keyboard navigation.
 */
import { Container, type TUI } from "@earendil-works/pi-tui";
export interface ExtensionSelectorOptions {
    tui?: TUI;
    timeout?: number;
    getRows?: () => number;
}
export declare class ExtensionSelectorComponent extends Container {
    private options;
    private selectedIndex;
    private listContainer;
    private onSelectCallback;
    private onCancelCallback;
    private baseTitle;
    private countdown;
    private panel;
    private readonly reservedRows;
    private listLayout;
    private readonly viewport;
    constructor(title: string, options: string[], onSelect: (option: string) => void, onCancel: () => void, opts?: ExtensionSelectorOptions);
    render(width: number): string[];
    private updateList;
    handleInput(keyData: string): void;
    dispose(): void;
    private updateLayout;
}
//# sourceMappingURL=extension-selector.d.ts.map