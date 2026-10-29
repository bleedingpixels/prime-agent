import type { AgentConnectionSessionTreeNode, AgentConnectionState } from "../agent-connection/types.js";
import type {
	DaemonAttachResult,
	DaemonOutbound,
	DaemonResponse,
	DaemonSessionSnapshot,
	DaemonUpdateRestartManifest,
} from "./daemon-protocol.js";
import type { SessionSummary } from "./daemon-session-list.js";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeSummaryLike<T>(summary: T): T {
	return isRecord(summary) && summary.thinkingLevel === "ultra"
		? ({ ...summary, thinkingLevel: "max" } as T)
		: summary;
}

function normalizeSessionTreeNodeLike<T>(node: T): T {
	if (!isRecord(node)) return node;
	const entry = isRecord(node.entry) ? node.entry : undefined;
	const normalizedEntry =
		entry?.type === "thinking_level_change" && entry.thinkingLevel === "ultra"
			? { ...entry, thinkingLevel: "max" }
			: entry;
	const children = Array.isArray(node.children) ? node.children : undefined;
	const normalizedChildren = children?.map(normalizeSessionTreeNodeLike);
	if (normalizedEntry === entry && normalizedChildren === undefined) return node;
	return {
		...node,
		...(normalizedEntry !== undefined ? { entry: normalizedEntry } : {}),
		...(normalizedChildren !== undefined ? { children: normalizedChildren } : {}),
	} as T;
}

export function normalizeDaemonUpdateRestartManifestForThinkingLevelCapability(
	manifest: DaemonUpdateRestartManifest,
	supportsUltraThinkingLevel: boolean,
): DaemonUpdateRestartManifest {
	if (supportsUltraThinkingLevel) return manifest;
	let changed = false;
	const sessions = manifest.sessions.map((session) => {
		const hasUltraThinking = session.config.thinking === "ultra";
		const models = session.config.models?.map((model) => model.replace(/:ultra$/, ":max"));
		const hasUltraModel = models?.some((model, index) => model !== session.config.models?.[index]) === true;
		if (!hasUltraThinking && !hasUltraModel) return session;
		changed = true;
		return {
			...session,
			config: {
				...session.config,
				...(hasUltraThinking ? { thinking: "max" as const } : {}),
				...(hasUltraModel ? { models } : {}),
			},
		};
	});
	return changed ? { ...manifest, sessions } : manifest;
}

/** Hide host-only Ultra state from clients that did not negotiate the wire capability. */
export function normalizeConnectionStateForThinkingLevelCapability(
	state: AgentConnectionState,
	supportsUltraThinkingLevel: boolean,
): AgentConnectionState {
	if (supportsUltraThinkingLevel) return state;
	const hasUltraAvailability = state.availableThinkingLevels?.includes("ultra") === true;
	const hasUltraScopedModel = state.scopedModels?.some((scoped) => scoped.thinkingLevel === "ultra") === true;
	if (state.thinkingLevel !== "ultra" && !hasUltraAvailability && !hasUltraScopedModel) return state;
	return {
		...state,
		...(state.thinkingLevel === "ultra" ? { thinkingLevel: "max" as const } : {}),
		...(hasUltraAvailability
			? { availableThinkingLevels: state.availableThinkingLevels.filter((level) => level !== "ultra") }
			: {}),
		...(hasUltraScopedModel
			? {
					scopedModels: state.scopedModels.map((scoped) =>
						scoped.thinkingLevel === "ultra" ? { ...scoped, thinkingLevel: "max" } : scoped,
					),
				}
			: {}),
	};
}

export function normalizeSessionSummaryForThinkingLevelCapability(
	summary: SessionSummary,
	supportsUltraThinkingLevel: boolean,
): SessionSummary {
	if (supportsUltraThinkingLevel || summary.thinkingLevel !== "ultra") return summary;
	return { ...summary, thinkingLevel: "max" };
}

export function normalizeDaemonSessionSnapshotForThinkingLevelCapability(
	snapshot: DaemonSessionSnapshot,
	supportsUltraThinkingLevel: boolean,
): DaemonSessionSnapshot {
	if (supportsUltraThinkingLevel) return snapshot;
	const sessionTree = snapshot.sessionTree
		? {
				...snapshot.sessionTree,
				tree: snapshot.sessionTree.tree.map((node: AgentConnectionSessionTreeNode) =>
					normalizeSessionTreeNodeLike(node),
				),
			}
		: undefined;
	return {
		...snapshot,
		summary: normalizeSessionSummaryForThinkingLevelCapability(snapshot.summary, false),
		state: normalizeConnectionStateForThinkingLevelCapability(snapshot.state, false),
		...(snapshot.sessionContext?.thinkingLevel === "ultra"
			? { sessionContext: { ...snapshot.sessionContext, thinkingLevel: "max" } }
			: {}),
		...(sessionTree ? { sessionTree } : {}),
	};
}

export function normalizeDaemonAttachResultForThinkingLevelCapability(
	result: DaemonAttachResult,
	supportsUltraThinkingLevel: boolean,
): DaemonAttachResult {
	if (supportsUltraThinkingLevel) return result;
	return {
		...result,
		...(result.state ? { state: normalizeSessionSummaryForThinkingLevelCapability(result.state, false) } : {}),
		snapshot: normalizeDaemonSessionSnapshotForThinkingLevelCapability(result.snapshot, false),
	};
}
export function normalizeDaemonResponseForThinkingLevelCapability(
	response: DaemonResponse,
	supportsUltraThinkingLevel: boolean,
): DaemonResponse {
	if (supportsUltraThinkingLevel || !response.success || response.data === undefined) return response;
	let data: unknown = response.data;
	switch (response.command) {
		case "attach":
		case "reattach":
			if (isRecord(data) && isRecord(data.snapshot)) {
				data = normalizeDaemonAttachResultForThinkingLevelCapability(data as unknown as DaemonAttachResult, false);
			}
			break;
		case "get_connection_state":
			data = normalizeConnectionStateForThinkingLevelCapability(data as AgentConnectionState, false);
			break;
		case "get_session_context":
			if (isRecord(data) && isRecord(data.context) && data.context.thinkingLevel === "ultra") {
				data = { ...data, context: { ...data.context, thinkingLevel: "max" } };
			}
			break;
		case "get_session_tree":
			if (isRecord(data) && Array.isArray(data.flatNodes)) {
				data = { ...data, flatNodes: data.flatNodes.map(normalizeSessionTreeNodeLike) };
			}
			break;
		case "prepare_update_restart":
		case "worker_commit_update":
		case "worker_prepare_update":
			if (isRecord(data) && Array.isArray(data.sessions)) {
				data = normalizeDaemonUpdateRestartManifestForThinkingLevelCapability(
					data as unknown as DaemonUpdateRestartManifest,
					false,
				);
			}
			break;
		case "list":
			if (isRecord(data) && Array.isArray(data.sessions)) {
				data = { ...data, sessions: data.sessions.map(normalizeSummaryLike) };
			}
			break;
		case "cycle_model":
			if (isRecord(data) && data.thinkingLevel === "ultra") data = { ...data, thinkingLevel: "max" };
			break;
		case "cycle_thinking_level":
			if (isRecord(data) && data.level === "ultra") data = { ...data, level: "max" };
			break;
		case "create":
		case "get_state":
		case "promote_owned_session":
		case "rename":
		case "retry_worker":
		case "set_session_name":
			data = normalizeSummaryLike(data);
			break;
	}
	return data === response.data ? response : { ...response, data };
}

/** Downgrade Ultra-bearing events and replacement snapshots for older attached clients. */
export function normalizeDaemonOutboundForThinkingLevelCapability(
	message: DaemonOutbound,
	supportsUltraThinkingLevel: boolean,
): DaemonOutbound {
	if (supportsUltraThinkingLevel) return message;
	switch (message.type) {
		case "response":
			return normalizeDaemonResponseForThinkingLevelCapability(message, false);
		case "session_event":
			return message.event.type === "thinking_level_changed" && message.event.level === "ultra"
				? { ...message, event: { ...message.event, level: "max" } }
				: message;
		case "session_replaced":
			return { ...message, state: normalizeConnectionStateForThinkingLevelCapability(message.state, false) };
		case "session_resynced":
			return {
				...message,
				snapshot: normalizeDaemonSessionSnapshotForThinkingLevelCapability(message.snapshot, false),
			};
		case "session_attached":
			return {
				...message,
				state: normalizeSessionSummaryForThinkingLevelCapability(message.state, false),
				...(message.snapshot
					? { snapshot: normalizeDaemonSessionSnapshotForThinkingLevelCapability(message.snapshot, false) }
					: {}),
			};
		case "session_snapshot_begin":
			return {
				...message,
				snapshot: {
					...message.snapshot,
					summary: normalizeSessionSummaryForThinkingLevelCapability(message.snapshot.summary, false),
					state: normalizeConnectionStateForThinkingLevelCapability(message.snapshot.state, false),
					...(message.snapshot.sessionContext?.thinkingLevel === "ultra"
						? { sessionContext: { ...message.snapshot.sessionContext, thinkingLevel: "max" } }
						: {}),
					...(message.snapshot.sessionTree
						? {
								sessionTree: {
									...message.snapshot.sessionTree,
									tree: message.snapshot.sessionTree.tree.map(normalizeSessionTreeNodeLike),
								},
							}
						: {}),
				},
			};
		default:
			return message;
	}
}
