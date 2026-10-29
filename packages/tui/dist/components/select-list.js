import { getKeybindings } from "../keybindings.js";
import { truncateToWidth, visibleWidth, wrapTextWithAnsi } from "../utils.js";
const DEFAULT_PRIMARY_COLUMN_WIDTH = 32;
const PRIMARY_COLUMN_GAP = 2;
const MIN_DESCRIPTION_WIDTH = 10;
const normalizeToSingleLine = (text) => text.replace(/[\r\n]+/g, " ").trim();
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
export class SelectList {
    items = [];
    filteredItems = [];
    selectedIndex = 0;
    maxVisible = 5;
    theme;
    layout;
    onSelect;
    onCancel;
    onSelectionChange;
    constructor(items, maxVisible, theme, layout = {}) {
        this.items = items;
        this.filteredItems = items;
        this.maxVisible = maxVisible;
        this.theme = theme;
        this.layout = layout;
    }
    setFilter(filter) {
        this.filteredItems = this.items.filter((item) => item.value.toLowerCase().startsWith(filter.toLowerCase()));
        // Reset selection when filter changes
        this.selectedIndex = 0;
    }
    setSelectedIndex(index) {
        this.selectedIndex = Math.max(0, Math.min(index, this.filteredItems.length - 1));
    }
    invalidate() {
        // No cached state to invalidate currently
    }
    render(width) {
        const lines = [];
        // If no items match filter, show message
        if (this.filteredItems.length === 0) {
            lines.push(this.theme.noMatch("  No matching commands"));
            return lines;
        }
        const primaryColumnWidth = this.getPrimaryColumnWidth();
        // Calculate visible range with scrolling
        const startIndex = Math.max(0, Math.min(this.selectedIndex - Math.floor(this.maxVisible / 2), this.filteredItems.length - this.maxVisible));
        const endIndex = Math.min(startIndex + this.maxVisible, this.filteredItems.length);
        // Render visible items
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.filteredItems[i];
            if (!item)
                continue;
            const isSelected = i === this.selectedIndex;
            const descriptionSingleLine = item.description ? normalizeToSingleLine(item.description) : undefined;
            lines.push(this.renderItem(item, isSelected, width, descriptionSingleLine, primaryColumnWidth));
        }
        if (startIndex > 0 || endIndex < this.filteredItems.length) {
            const scrollText = this.layout.showDirectionalScrollInfo
                ? this.formatDirectionalScrollInfo(startIndex, this.filteredItems.length - endIndex)
                : `  (${this.selectedIndex + 1}/${this.filteredItems.length})`;
            lines.push(this.theme.scrollInfo(truncateToWidth(scrollText, width - 2, "")));
        }
        if (this.layout.showSelectedDescription) {
            this.renderSelectedDescription(lines, width);
        }
        return lines;
    }
    handleInput(keyData) {
        const kb = getKeybindings();
        // Up arrow - wrap to bottom when at top
        if (kb.matches(keyData, "tui.select.up")) {
            this.selectedIndex = this.selectedIndex === 0 ? this.filteredItems.length - 1 : this.selectedIndex - 1;
            this.notifySelectionChange();
        }
        // Down arrow - wrap to top when at bottom
        else if (kb.matches(keyData, "tui.select.down")) {
            this.selectedIndex = this.selectedIndex === this.filteredItems.length - 1 ? 0 : this.selectedIndex + 1;
            this.notifySelectionChange();
        }
        // Enter
        else if (kb.matches(keyData, "tui.select.confirm")) {
            const selectedItem = this.filteredItems[this.selectedIndex];
            if (selectedItem && this.onSelect) {
                this.onSelect(selectedItem);
            }
        }
        // Escape or Ctrl+C
        else if (kb.matches(keyData, "tui.select.cancel")) {
            if (this.onCancel) {
                this.onCancel();
            }
        }
    }
    renderItem(item, isSelected, width, descriptionSingleLine, primaryColumnWidth) {
        const prefix = isSelected ? "› " : "  ";
        const prefixWidth = visibleWidth(prefix);
        if (this.layout.showItemMetadata) {
            return this.renderMetadataItem(item, isSelected, width, primaryColumnWidth, prefix, prefixWidth);
        }
        if (descriptionSingleLine && width > 40) {
            const effectivePrimaryColumnWidth = Math.max(1, Math.min(primaryColumnWidth, width - prefixWidth - 4));
            const maxPrimaryWidth = Math.max(1, effectivePrimaryColumnWidth - PRIMARY_COLUMN_GAP);
            const truncatedValue = this.truncatePrimary(item, isSelected, maxPrimaryWidth, effectivePrimaryColumnWidth);
            const truncatedValueWidth = visibleWidth(truncatedValue);
            const spacing = " ".repeat(Math.max(1, effectivePrimaryColumnWidth - truncatedValueWidth));
            const descriptionStart = prefixWidth + truncatedValueWidth + spacing.length;
            const remainingWidth = width - descriptionStart - 2; // -2 for safety
            if (remainingWidth > MIN_DESCRIPTION_WIDTH) {
                const truncatedDesc = truncateToWidth(descriptionSingleLine, remainingWidth, "…");
                if (isSelected) {
                    return this.theme.selectedText(`${prefix}${truncatedValue}${spacing}${truncatedDesc}`);
                }
                const descText = this.theme.description(spacing + truncatedDesc);
                return prefix + truncatedValue + descText;
            }
        }
        const maxWidth = width - prefixWidth - 2;
        const truncatedValue = this.truncatePrimary(item, isSelected, maxWidth, maxWidth);
        if (isSelected) {
            return this.theme.selectedText(`${prefix}${truncatedValue}`);
        }
        return prefix + truncatedValue;
    }
    formatDirectionalScrollInfo(hiddenAbove, hiddenBelow) {
        const indicators = [
            hiddenAbove > 0 ? `↑ ${hiddenAbove} more` : undefined,
            hiddenBelow > 0 ? `↓ ${hiddenBelow} more` : undefined,
        ].filter((indicator) => indicator !== undefined);
        return `  ${indicators.join("  ")}`;
    }
    renderMetadataItem(item, isSelected, width, primaryColumnWidth, prefix, prefixWidth) {
        const argumentHint = item.argumentHint ? normalizeToSingleLine(item.argumentHint) : undefined;
        const sourceTag = item.sourceTag ? normalizeToSingleLine(item.sourceTag) : undefined;
        const hasMetadata = Boolean(argumentHint || sourceTag);
        const contentWidth = Math.max(1, width - prefixWidth - 2);
        const showMetadata = hasMetadata && contentWidth > primaryColumnWidth;
        const effectivePrimaryColumnWidth = showMetadata ? primaryColumnWidth : contentWidth;
        const maxPrimaryWidth = showMetadata
            ? Math.max(1, effectivePrimaryColumnWidth - PRIMARY_COLUMN_GAP)
            : effectivePrimaryColumnWidth;
        const primary = this.truncatePrimary(item, isSelected, maxPrimaryWidth, effectivePrimaryColumnWidth);
        const styledPrefix = isSelected ? this.theme.selectedPrefix(prefix) : prefix;
        const styledPrimary = isSelected ? this.theme.selectedText(primary) : primary;
        if (!showMetadata) {
            return truncateToWidth(`${styledPrefix}${styledPrimary}`, width, "");
        }
        const spacing = " ".repeat(Math.max(1, effectivePrimaryColumnWidth - visibleWidth(primary)));
        let remainingWidth = Math.max(0, width - prefixWidth - visibleWidth(primary) - spacing.length - 2);
        const metadata = [];
        if (argumentHint && remainingWidth > 0) {
            const truncatedArgumentHint = truncateToWidth(argumentHint, remainingWidth, "…");
            metadata.push((this.theme.argumentHint ?? this.theme.description)(truncatedArgumentHint));
            remainingWidth -= visibleWidth(truncatedArgumentHint);
        }
        if (sourceTag && remainingWidth > (metadata.length > 0 ? PRIMARY_COLUMN_GAP : 0)) {
            if (metadata.length > 0) {
                metadata.push(" ".repeat(PRIMARY_COLUMN_GAP));
                remainingWidth -= PRIMARY_COLUMN_GAP;
            }
            metadata.push((this.theme.sourceTag ?? this.theme.description)(truncateToWidth(sourceTag, remainingWidth, "…")));
        }
        return truncateToWidth(`${styledPrefix}${styledPrimary}${spacing}${metadata.join("")}`, width, "");
    }
    getPrimaryColumnWidth() {
        const { min, max } = this.getPrimaryColumnBounds();
        const widestPrimary = this.filteredItems.reduce((widest, item) => {
            return Math.max(widest, visibleWidth(this.getDisplayValue(item)) + PRIMARY_COLUMN_GAP);
        }, 0);
        return clamp(widestPrimary, min, max);
    }
    getPrimaryColumnBounds() {
        const rawMin = this.layout.minPrimaryColumnWidth ?? this.layout.maxPrimaryColumnWidth ?? DEFAULT_PRIMARY_COLUMN_WIDTH;
        const rawMax = this.layout.maxPrimaryColumnWidth ?? this.layout.minPrimaryColumnWidth ?? DEFAULT_PRIMARY_COLUMN_WIDTH;
        return {
            min: Math.max(1, Math.min(rawMin, rawMax)),
            max: Math.max(1, Math.max(rawMin, rawMax)),
        };
    }
    truncatePrimary(item, isSelected, maxWidth, columnWidth) {
        const displayValue = this.getDisplayValue(item);
        const truncatedValue = this.layout.truncatePrimary
            ? this.layout.truncatePrimary({
                text: displayValue,
                maxWidth,
                columnWidth,
                item,
                isSelected,
            })
            : truncateToWidth(displayValue, maxWidth, "");
        return truncateToWidth(truncatedValue, maxWidth, "");
    }
    getDisplayValue(item) {
        return item.label || item.value;
    }
    renderSelectedDescription(lines, width) {
        const description = this.filteredItems[this.selectedIndex]?.description?.trim();
        if (!description)
            return;
        const indent = width >= 4 ? "  " : "";
        const contentWidth = Math.max(1, width - visibleWidth(indent) - 2);
        lines.push("");
        for (const line of wrapTextWithAnsi(description, contentWidth)) {
            lines.push(this.theme.description(indent + line));
        }
    }
    notifySelectionChange() {
        const selectedItem = this.filteredItems[this.selectedIndex];
        if (selectedItem && this.onSelectionChange) {
            this.onSelectionChange(selectedItem);
        }
    }
    getSelectedItem() {
        const item = this.filteredItems[this.selectedIndex];
        return item || null;
    }
}
//# sourceMappingURL=select-list.js.map