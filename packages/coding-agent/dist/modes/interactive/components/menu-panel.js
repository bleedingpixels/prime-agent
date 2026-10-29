import { Container, Input, truncateToWidth, visibleWidth, wrapTextWithAnsi, } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.js";
const PANEL_PADDING_X = 2;
const PANEL_PADDING_Y = 1;
const FIELD_PADDING_X = 2;
const ROW_PADDING_X = 2;
const ROW_PADDING_Y = 1;
const ANSI_RESET = "\x1b[0m";
export function getMenuPanelInnerWidth(width) {
    const safeWidth = Math.max(PANEL_PADDING_X * 2 + 1, width);
    return Math.max(1, safeWidth - PANEL_PADDING_X * 2);
}
function fillsMenuPanel(component) {
    return component.fillsMenuPanel === true;
}
function getViewportRows(getRows) {
    const rows = getRows?.();
    if (rows === undefined || !Number.isFinite(rows) || rows <= 0) {
        return undefined;
    }
    return Math.floor(rows);
}
function visibleItemCount(rows, options) {
    const capacityRows = Math.max(0, rows - options.reservedRows - options.listPaddingRows - options.extraRows);
    const itemCapacity = Math.floor(capacityRows / options.itemRows);
    return Math.max(options.minVisibleItems, Math.min(options.preferredVisibleItems, itemCapacity));
}
function listRowsUsed(options) {
    return options.reservedRows + options.listPaddingRows + options.extraRows + options.visibleItems * options.itemRows;
}
function scrollIndicatorRows(options) {
    if (options.totalItems === undefined || options.scrollIndicatorRows <= 0) {
        return 0;
    }
    return options.totalItems > options.visibleItems ? options.scrollIndicatorRows : 0;
}
function getLayoutCandidate(rows, options, itemRows, listPaddingRows, compact) {
    const minVisibleItems = options.minVisibleItems ?? 1;
    const preferredVisibleItems = Math.max(minVisibleItems, options.preferredVisibleItems);
    const visibleItemsWithoutScroll = visibleItemCount(rows, {
        preferredVisibleItems,
        minVisibleItems,
        reservedRows: options.reservedRows,
        itemRows,
        listPaddingRows,
        extraRows: 0,
    });
    const extraRows = scrollIndicatorRows({
        totalItems: options.totalItems,
        visibleItems: visibleItemsWithoutScroll,
        scrollIndicatorRows: options.scrollIndicatorRows ?? 0,
    });
    const visibleItems = extraRows > 0
        ? visibleItemCount(rows, {
            preferredVisibleItems,
            minVisibleItems,
            reservedRows: options.reservedRows,
            itemRows,
            listPaddingRows,
            extraRows,
        })
        : visibleItemsWithoutScroll;
    const rowsUsed = listRowsUsed({
        reservedRows: options.reservedRows,
        listPaddingRows,
        visibleItems,
        itemRows,
        extraRows,
    });
    return {
        compact,
        visibleItems,
        rowsUsed,
        fits: rowsUsed <= rows,
    };
}
export function getMenuListLayout(options) {
    const minVisibleItems = options.minVisibleItems ?? 1;
    const preferredVisibleItems = Math.max(minVisibleItems, options.preferredVisibleItems);
    const rows = getViewportRows(options.getRows);
    if (rows === undefined) {
        return { compact: false, visibleItems: preferredVisibleItems };
    }
    const comfortableLayout = getLayoutCandidate(rows, options, Math.max(1, options.comfortableItemRows), options.comfortableListPaddingRows ?? 1, false);
    if (options.compactItemRows === undefined) {
        return { compact: false, visibleItems: comfortableLayout.visibleItems };
    }
    const compactLayout = getLayoutCandidate(rows, options, Math.max(1, options.compactItemRows), options.compactListPaddingRows ?? 0, true);
    if (compactLayout.fits && (!comfortableLayout.fits || compactLayout.visibleItems > comfortableLayout.visibleItems)) {
        return { compact: true, visibleItems: compactLayout.visibleItems };
    }
    if (comfortableLayout.fits) {
        return { compact: false, visibleItems: comfortableLayout.visibleItems };
    }
    return compactLayout.rowsUsed <= comfortableLayout.rowsUsed
        ? { compact: true, visibleItems: compactLayout.visibleItems }
        : { compact: false, visibleItems: comfortableLayout.visibleItems };
}
function paddedBackgroundLine(text, width, paddingX, background) {
    const innerWidth = Math.max(1, width - paddingX * 2);
    const content = truncateToWidth(text, innerWidth, "");
    const rightPadding = " ".repeat(Math.max(0, innerWidth - visibleWidth(content)));
    const contentSpan = " ".repeat(paddingX) + content;
    const trailingSpan = rightPadding + " ".repeat(paddingX);
    if (!background) {
        return contentSpan + trailingSpan;
    }
    return applyBackground(contentSpan, background) + background(trailingSpan);
}
function applyBackground(text, background) {
    return text
        .split(ANSI_RESET)
        .map((segment) => background(segment))
        .join(ANSI_RESET);
}
function surfaceLine(text, width, paddingX = PANEL_PADDING_X) {
    return paddedBackgroundLine(text, width, paddingX, theme.getEditorBackgroundColor());
}
function surfaceWrappedLines(text, width, paddingX = PANEL_PADDING_X) {
    const innerWidth = Math.max(1, width - paddingX * 2);
    return wrapTextWithAnsi(text, innerWidth).map((content) => surfaceLine(content, width, paddingX));
}
export class MenuPanel extends Container {
    options;
    title;
    constructor(options) {
        super();
        this.options = options;
        this.title = options.title;
    }
    setTitle(title) {
        this.title = title;
    }
    render(width) {
        const safeWidth = Math.max(PANEL_PADDING_X * 2 + 1, width);
        const innerWidth = getMenuPanelInnerWidth(width);
        const lines = [];
        for (let i = 0; i < PANEL_PADDING_Y; i++) {
            lines.push(surfaceLine("", safeWidth));
        }
        const hasTitle = this.title.trim().length > 0;
        const subtitle = this.options.subtitle?.trim();
        const hasSubtitle = subtitle !== undefined && subtitle.length > 0;
        const hasHeader = hasTitle || hasSubtitle;
        if (hasTitle) {
            lines.push(surfaceLine(theme.bold(theme.fg("text", this.title)), safeWidth));
        }
        if (hasSubtitle) {
            lines.push(...surfaceWrappedLines(theme.fg("muted", subtitle), safeWidth));
        }
        if (hasHeader) {
            lines.push(surfaceLine("", safeWidth));
        }
        for (const child of this.children) {
            const childLines = fillsMenuPanel(child) ? child.render(safeWidth) : child.render(innerWidth);
            for (const line of childLines) {
                lines.push(fillsMenuPanel(child) ? line : surfaceLine(line, safeWidth));
            }
        }
        for (let i = 0; i < PANEL_PADDING_Y; i++) {
            lines.push(surfaceLine("", safeWidth));
        }
        return lines;
    }
}
export class MenuSearchInput {
    placeholder;
    fillsMenuPanel = true;
    input = new Input();
    constructor(placeholder) {
        this.placeholder = placeholder;
    }
    get focused() {
        return this.input.focused;
    }
    set focused(value) {
        this.input.focused = value;
    }
    set onSubmit(handler) {
        this.input.onSubmit = handler;
    }
    getValue() {
        return this.input.getValue();
    }
    getCursor() {
        return this.input.getCursor();
    }
    setValue(value) {
        this.input.setValue(value);
    }
    handleInput(data) {
        this.input.handleInput(data);
    }
    invalidate() {
        this.input.invalidate();
    }
    render(width) {
        const safeWidth = Math.max(FIELD_PADDING_X * 2 + 1, width);
        const innerWidth = Math.max(1, safeWidth - FIELD_PADDING_X * 2);
        const content = this.getValue() === "" && !this.focused
            ? theme.fg("dim", this.placeholder)
            : this.stripInputPrompt(this.input.render(innerWidth + 2)[0] ?? "");
        return [paddedBackgroundLine(content, safeWidth, FIELD_PADDING_X, theme.getEditorBackgroundColor())];
    }
    stripInputPrompt(line) {
        return line.startsWith("> ") ? line.slice(2) : line;
    }
}
export class MenuRow {
    options;
    fillsMenuPanel = true;
    constructor(options) {
        this.options = options;
    }
    get selected() {
        return this.options.selected;
    }
    invalidate() {
        // Row render is derived from constructor options.
    }
    render(width) {
        const safeWidth = Math.max(ROW_PADDING_X * 2 + 1, width);
        return [
            ...this.renderPadding(safeWidth, this.selected),
            ...this.renderContent(safeWidth),
            ...this.renderPadding(safeWidth, this.selected),
        ];
    }
    renderContent(width) {
        const safeWidth = Math.max(ROW_PADDING_X * 2 + 1, width);
        const meta = this.options.meta ? theme.fg("muted", this.options.meta) : "";
        const secondary = this.options.secondary ? theme.fg("muted", this.options.secondary) : "";
        const primary = this.options.selected
            ? theme.bold(theme.fg("text", this.options.primary))
            : theme.fg("text", this.options.primary);
        const innerWidth = Math.max(1, safeWidth - ROW_PADDING_X * 2);
        const metaWidth = visibleWidth(meta);
        const gap = meta ? 2 : 0;
        const primaryWidth = Math.max(1, innerWidth - metaWidth - gap);
        const primaryText = truncateToWidth(primary, primaryWidth, "", true);
        const primaryLine = meta ? primaryText + " ".repeat(gap) + meta : primaryText;
        const lines = [];
        lines.push(this.rowLine(primaryLine, safeWidth, this.selected));
        if (secondary) {
            lines.push(this.rowLine(truncateToWidth(secondary, innerWidth, "", true), safeWidth, this.selected));
        }
        return lines;
    }
    renderPadding(width, selected) {
        const safeWidth = Math.max(ROW_PADDING_X * 2 + 1, width);
        const lines = [];
        for (let i = 0; i < ROW_PADDING_Y; i++) {
            lines.push(this.rowLine("", safeWidth, selected));
        }
        return lines;
    }
    rowLine(text, width, selected) {
        const background = selected ? theme.getSelectionBackgroundColor() : theme.getEditorBackgroundColor();
        return paddedBackgroundLine(text, width, ROW_PADDING_X, background);
    }
}
export class MenuList extends Container {
    options;
    fillsMenuPanel = true;
    constructor(options = {}) {
        super();
        this.options = options;
    }
    render(width) {
        const lines = [];
        const compact = this.isCompact();
        for (let index = 0; index < this.children.length; index++) {
            const child = this.children[index];
            if (child instanceof MenuRow) {
                if (compact) {
                    lines.push(...child.renderContent(width));
                    continue;
                }
                const previousChild = this.children[index - 1];
                const nextChild = this.children[index + 1];
                const previousRow = previousChild instanceof MenuRow ? previousChild : undefined;
                const nextRow = nextChild instanceof MenuRow ? nextChild : undefined;
                lines.push(...child.renderPadding(width, child.selected || previousRow?.selected === true));
                lines.push(...child.renderContent(width));
                if (!nextRow) {
                    lines.push(...child.renderPadding(width, child.selected));
                }
                continue;
            }
            const childLines = fillsMenuPanel(child)
                ? child.render(width)
                : child.render(Math.max(1, width - PANEL_PADDING_X * 2));
            for (const line of childLines) {
                lines.push(fillsMenuPanel(child) ? line : surfaceLine(line, width));
            }
        }
        return lines;
    }
    isCompact() {
        const compact = this.options.compact;
        return typeof compact === "function" ? compact() : compact === true;
    }
}
//# sourceMappingURL=menu-panel.js.map