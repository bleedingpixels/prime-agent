import type { AgentConnectionQueueState } from "../agent-connection/index.js";
export type QueueLane = "steering" | "followUp";
export interface QueueSelectionItem {
    lane: QueueLane;
    index: number;
    text: string;
}
/**
 * Tracks which queued message the user is browsing/editing with alt+up/alt+down.
 *
 * Items are addressed by (lane, index, text): the text is the authoritative
 * check when a mutation is applied, so no ids or revisions are needed. Browsing
 * order is newest-first: draft -> last followUp -> ... -> first steering.
 */
export declare class QueueSelection {
    private items;
    private cursor;
    private draft;
    private hasStashedDraft;
    get selected(): QueueSelectionItem | undefined;
    get isBrowsing(): boolean;
    get hasDraft(): boolean;
    replaceDraft(draft: string): void;
    /** Move the cursor. -1 browses older, +1 newer. Returns the text to show, or undefined for a boundary noop. */
    move(queue: AgentConnectionQueueState, draft: string, direction: -1 | 1): string | undefined;
    /**
     * Track queue changes while browsing: keep the selection when its text is
     * still present. Returns the dropped item's text when the selection could
     * not be kept, so the caller can restore the stashed draft.
     */
    sync(queue: AgentConnectionQueueState): string | undefined;
    /** Called after a mutation or submit resolved the selection. Returns the stashed draft. */
    reset(): string;
}
//# sourceMappingURL=queue-selection.d.ts.map