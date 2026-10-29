import { type Component, type Focusable, type OverlayHandle, type TUI } from "@earendil-works/pi-tui";
interface CenteredOverlayOptions {
    getRows: () => number;
    maxContentWidth?: number;
    verticalOffset?: number;
}
export interface FullPaneOverlayOptions {
    maxContentWidth?: number;
    fullWidth?: boolean;
    suspendFullscreenMouse?: boolean;
}
/** Shows a component as a full-pane centered overlay on the given TUI. */
export declare function showFullPaneOverlay(ui: TUI, component: Component, options?: number | FullPaneOverlayOptions): OverlayHandle;
export declare class CenteredOverlayComponent implements Component, Focusable {
    private readonly component;
    private readonly options;
    private _focused;
    constructor(component: Component, options: CenteredOverlayOptions);
    get focused(): boolean;
    set focused(value: boolean);
    invalidate(): void;
    handleInput(data: string): void;
    render(width: number): string[];
    private place;
    private blank;
}
export {};
//# sourceMappingURL=centered-overlay.d.ts.map