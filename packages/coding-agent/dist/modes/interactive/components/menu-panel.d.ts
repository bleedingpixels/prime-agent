import { type Component, Container, type Focusable } from "@earendil-works/pi-tui";
interface MenuPanelOptions {
    title: string;
    subtitle?: string;
}
export interface MenuViewportProvider {
    getRows?: () => number;
}
interface MenuListOptions {
    compact?: boolean | (() => boolean);
}
interface MenuListLayoutOptions extends MenuViewportProvider {
    preferredVisibleItems: number;
    minVisibleItems?: number;
    totalItems?: number;
    reservedRows: number;
    comfortableItemRows: number;
    compactItemRows?: number;
    scrollIndicatorRows?: number;
    comfortableListPaddingRows?: number;
    compactListPaddingRows?: number;
}
export interface MenuListLayout {
    compact: boolean;
    visibleItems: number;
}
export declare function getMenuPanelInnerWidth(width: number): number;
interface FullWidthMenuComponent {
    readonly fillsMenuPanel: true;
}
export declare function getMenuListLayout(options: MenuListLayoutOptions): MenuListLayout;
export declare class MenuPanel extends Container {
    private readonly options;
    private title;
    constructor(options: MenuPanelOptions);
    setTitle(title: string): void;
    render(width: number): string[];
}
export declare class MenuSearchInput implements Component, Focusable, FullWidthMenuComponent {
    private readonly placeholder;
    readonly fillsMenuPanel = true;
    private readonly input;
    constructor(placeholder: string);
    get focused(): boolean;
    set focused(value: boolean);
    set onSubmit(handler: ((value: string) => void) | undefined);
    getValue(): string;
    getCursor(): number;
    setValue(value: string): void;
    handleInput(data: string): void;
    invalidate(): void;
    render(width: number): string[];
    private stripInputPrompt;
}
interface MenuRowOptions {
    primary: string;
    secondary?: string;
    meta?: string;
    selected: boolean;
}
export declare class MenuRow implements Component, FullWidthMenuComponent {
    private readonly options;
    readonly fillsMenuPanel = true;
    constructor(options: MenuRowOptions);
    get selected(): boolean;
    invalidate(): void;
    render(width: number): string[];
    renderContent(width: number): string[];
    renderPadding(width: number, selected: boolean): string[];
    private rowLine;
}
export declare class MenuList extends Container implements FullWidthMenuComponent {
    private readonly options;
    readonly fillsMenuPanel = true;
    constructor(options?: MenuListOptions);
    render(width: number): string[];
    private isCompact;
}
export {};
//# sourceMappingURL=menu-panel.d.ts.map