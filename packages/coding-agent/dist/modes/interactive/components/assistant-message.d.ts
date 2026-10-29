import type { AssistantMessage } from "@earendil-works/pi-ai";
import { Container, type MarkdownTheme } from "@earendil-works/pi-tui";
export interface AssistantMessageComponentOptions {
    expanded?: boolean;
    precededByToolActivity?: boolean;
}
/**
 * One-line recap for a collapsed thinking block: the last bold section header
 * when the trace has one (reasoning summaries usually do), otherwise the first
 * non-empty line, stripped of markdown emphasis and truncated.
 */
export declare function thinkingRecap(thinking: string, fallback: string, maxWidth?: number): string;
/**
 * Component that renders a complete assistant message.
 *
 * Streaming sends one updateContent() per token, so content updates are
 * reconciled lazily at render time (at most once per frame): when the block
 * structure is unchanged, only the text of changed blocks is updated in place,
 * preserving each Markdown child's render cache instead of rebuilding the tree.
 */
export declare class AssistantMessageComponent extends Container {
    private contentContainer;
    private hideThinkingBlock;
    private markdownTheme;
    private hiddenThinkingLabel;
    private lastMessage?;
    private hasToolCalls;
    private expanded;
    private dirty;
    private lastSignature?;
    private blockMarkdowns;
    private lastBlockTexts;
    private precededByToolActivity;
    constructor(message?: AssistantMessage, hideThinkingBlock?: boolean, markdownTheme?: MarkdownTheme, hiddenThinkingLabel?: string, options?: AssistantMessageComponentOptions);
    invalidate(): void;
    setHideThinkingBlock(hide: boolean): void;
    setHiddenThinkingLabel(label: string): void;
    setExpanded(expanded: boolean): void;
    render(width: number): string[];
    updateContent(message: AssistantMessage): void;
    /**
     * Everything that affects child component identity/order, but not the text
     * inside a block. While the signature is stable, updates reduce to setText()
     * on changed blocks; any structural change triggers a full rebuild.
     */
    private computeSignature;
    private reconcile;
    private rebuild;
    private createErrorComponent;
}
//# sourceMappingURL=assistant-message.d.ts.map