import type { AgentConnectionHeartbeat, AgentConnectionSavedSessionInfo } from "../agent-connection/index.js";
import { type SessionSummary } from "../daemon/daemon-session-list.js";
export type AgentsViewSection = "running" | "idle" | "inactive";
export interface UnifiedSessionHeartbeat {
    activeCount: number;
    nextRunAt?: string;
}
export interface UnifiedSessionRecord {
    daemon?: SessionSummary;
    saved?: AgentConnectionSavedSessionInfo;
    /** Stable UI key, chosen using canonical path, session id, then active id. */
    identity: string;
    /** Alternate keys used to restore selection while a session is persisted or reattached. */
    identityAliases: readonly string[];
    section: AgentsViewSection;
    searchableText: string;
    heartbeat?: UnifiedSessionHeartbeat;
}
export interface AgentsViewScopeKey {
    sessionId: string;
    activeSessionId?: string;
}
export interface AgentsViewScopeFrame {
    scope: AgentsViewScopeKey;
    /** Chat to revisit before returning to the parent agents view. */
    returnChat?: SessionSummary;
}
export type AgentsViewScopeAction = {
    type: "push";
    scope: AgentsViewScopeKey;
    returnChat?: SessionSummary;
} | {
    type: "back";
};
export interface AgentsViewScopeResolution {
    frames: AgentsViewScopeFrame[];
    root?: UnifiedSessionRecord;
    droppedFrames: number;
}
export interface AgentsViewScopeBackResult {
    type: "scope_back";
    selection: SessionSummary;
    expandedAncestorSessionIds: string[];
    returnChat?: SessionSummary;
}
export interface UnattachableChildOpenResult {
    type: "open";
    summary: SessionSummary;
    selection: SessionSummary;
    expandedAncestorSessionIds: string[];
    hasChildren: boolean;
    statusMessage: string;
}
export type AgentsViewRowKind = "agent" | "subagent-summary" | "subagent" | "subagent-code";
export interface AgentsViewRow {
    kind: AgentsViewRowKind;
    section: AgentsViewSection;
    summary: SessionSummary;
    title: string;
    subtitle: string;
    statusLabel: string;
    depth: number;
    selectable: boolean;
    runningSubagentCount: number;
    /** Unique selection identity for this row. */
    identity: string;
    /** Identity of the agent row this row is nested under. */
    parentIdentity?: string;
    /** True when this row's subagents carry spawn code that can be revealed. */
    hasSpawnCode?: boolean;
    /** True when this subagent-summary row's list is expanded. */
    expanded?: boolean;
    /** One source line of the spawn cell, for "subagent-code" rows. */
    code?: string;
    /** Merged durable/live source data for unified rows. */
    record?: UnifiedSessionRecord;
    heartbeat?: UnifiedSessionHeartbeat;
}
export declare function classifyAgentsViewSession(summary: SessionSummary): AgentsViewSection;
export declare function classifyUnifiedSession(record: Pick<UnifiedSessionRecord, "daemon" | "heartbeat">): AgentsViewSection;
export declare function shouldShowAgentsViewSession(summary: SessionSummary, manuallyInactive?: boolean): boolean;
export declare function sectionTitle(section: AgentsViewSection): string;
/**
 * Reconcile daemon-resident and saved catalog rows without inventing runtime
 * ancestry from persisted fork metadata. Daemon data remains authoritative;
 * saved data only enriches durable/search fields.
 */
export declare function reconcileUnifiedSessions(daemonSummaries: readonly SessionSummary[], savedSessions: readonly AgentConnectionSavedSessionInfo[], heartbeats?: readonly AgentConnectionHeartbeat[]): UnifiedSessionRecord[];
/** Convert a merged row to the existing live-row rendering/action shape. */
export declare function summaryForUnifiedRecord(record: UnifiedSessionRecord): SessionSummary;
export declare function transitionAgentsViewScope(frames: readonly AgentsViewScopeFrame[], action: AgentsViewScopeAction): AgentsViewScopeFrame[];
export declare function resolveAgentsViewLeftResult(scopeRoot: SessionSummary | undefined, expandedAncestorSessionIds?: string[], returnChat?: SessionSummary): AgentsViewScopeBackResult | undefined;
export declare function shouldApplyScopeResolution(droppedFrames: number, liveCatalogReady: boolean, savedCatalogReady: boolean): boolean;
export declare function createUnattachableChildOpenResult(child: SessionSummary, parent: SessionSummary, expandedAncestorSessionIds: readonly string[], hasChildren: boolean): UnattachableChildOpenResult;
export declare function resolveAgentsViewScopeFrames(records: readonly UnifiedSessionRecord[], frames: readonly AgentsViewScopeFrame[], index?: UnifiedSessionIndex): AgentsViewScopeResolution;
/** Restrict records to the scoped root and every descendant of that root. */
export declare function scopeToSessionSubtree(records: readonly UnifiedSessionRecord[], scope: AgentsViewScopeKey | undefined, index?: UnifiedSessionIndex): UnifiedSessionRecord[];
export declare function hasUnifiedSessionChildren(records: readonly UnifiedSessionRecord[], scope: AgentsViewScopeKey, index?: UnifiedSessionIndex): boolean;
export declare function getUnifiedSessionAncestorSessionIds(records: readonly UnifiedSessionRecord[], scope: AgentsViewScopeKey, index?: UnifiedSessionIndex): string[];
export declare function filterUnifiedSessions(records: readonly UnifiedSessionRecord[], matches: (searchableText: string) => boolean): UnifiedSessionRecord[];
export interface UnifiedSessionIndex {
    byKey: Map<string, UnifiedSessionRecord>;
    childrenByParent: Map<UnifiedSessionRecord, UnifiedSessionRecord[]>;
}
export declare function buildUnifiedSessionIndex(records: readonly UnifiedSessionRecord[]): UnifiedSessionIndex;
/**
 * Row identities flip when a session gains a sessionFile (active→persisted) or
 * is re-attached; the old identity survives as an alias. Rewrite stale entries
 * in a persisted identity set to the current record identity. Entries with no
 * alias match are kept: their record may not have streamed in yet.
 */
export declare function migrateAgentsViewIdentitySet(identities: Set<string>, byKey: ReadonlyMap<string, UnifiedSessionRecord>): void;
export declare function aggregateSessionHeartbeats(summaries: readonly SessionSummary[], heartbeats: readonly AgentConnectionHeartbeat[]): ReadonlyMap<string, UnifiedSessionHeartbeat>;
export declare function formatHeartbeatBadge(heartbeat: UnifiedSessionHeartbeat | undefined, now?: number): string;
export declare function getAgentsViewSummaryIdentity(summary: SessionSummary): string;
export interface AgentsViewSelectionKey {
    sessionId: string;
    activeSessionId?: string;
}
export declare function getAgentsViewSelectionKey(summary: SessionSummary): AgentsViewSelectionKey;
export declare function resolveAgentsViewSelectionIndex(rows: readonly AgentsViewRow[], identity: string | undefined, key: AgentsViewSelectionKey | undefined): number;
export interface AgentsViewSelectionResolution {
    index: number;
    resolved: boolean;
}
export declare function resolveAgentsViewSelectionState(rows: readonly AgentsViewRow[], currentIndex: number, identity: string | undefined, key: AgentsViewSelectionKey | undefined): AgentsViewSelectionResolution;
export declare function buildAgentsViewRows(summariesOrRecords: readonly (SessionSummary | UnifiedSessionRecord)[], expandedSubagentParents?: ReadonlySet<string>, programShownParents?: ReadonlySet<string>, scope?: AgentsViewScopeKey): AgentsViewRow[];
export declare function getAgentsViewSessionTitle(summary: SessionSummary): string;
//# sourceMappingURL=agents-view-state.d.ts.map