import { describe, expect, it } from "vitest";
import type { AgentConnectionState } from "../src/modes/agent-connection/types.js";
import type { DaemonOutbound, DaemonResponse, DaemonSessionSnapshot } from "../src/modes/daemon/daemon-protocol.js";
import type { SessionSummary } from "../src/modes/daemon/daemon-session-list.js";
import {
	normalizeConnectionStateForThinkingLevelCapability,
	normalizeDaemonOutboundForThinkingLevelCapability,
	normalizeDaemonResponseForThinkingLevelCapability,
	normalizeDaemonSessionSnapshotForThinkingLevelCapability,
} from "../src/modes/daemon/daemon-thinking-level-compat.js";

const state: AgentConnectionState = {
	activeSessionId: "active-1",
	cwd: "/tmp/project",
	thinkingLevel: "ultra",
	serviceTier: "default",
	availableThinkingLevels: ["off", "high", "max", "ultra"],
	isStreaming: false,
	isCompacting: false,
	isBashRunning: false,
	retryAttempt: 0,
	steeringMode: "all",
	followUpMode: "one-at-a-time",
	sessionId: "session-1",
	leafId: null,
	autoCompactionEnabled: true,
	messageCount: 0,
	sessionActions: { queuedCount: 0, steering: [], followUps: [] },
	compactionCount: 0,
	goal: {
		active: false,
		status: "idle",
		tokensUsed: 0,
		timeUsedSeconds: 0,
		continuationsUsed: 0,
	},
	scopedModels: [
		{
			model: {
				id: "max-model",
				name: "Max Model",
				api: "anthropic-messages",
				provider: "anthropic",
				baseUrl: "https://api.anthropic.com",
				reasoning: true,
				input: ["text"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 1000,
				maxTokens: 100,
			},
			thinkingLevel: "ultra",
		},
	],
	activeToolNames: ["ipython"],
	contextUsage: undefined,
};

const summary: SessionSummary = {
	id: "active-1",
	activeSessionId: "active-1",
	lifecycle: "live",
	activity: "idle",
	isSessionActive: true,
	sessionId: "session-1",
	cwd: "/tmp/project",
	thinkingLevel: "ultra",
	isStreaming: false,
	isCompacting: false,
	attachedClients: 1,
	messageCount: 0,
	sessionActions: { queuedCount: 0, steering: [], followUps: [] },
};

const snapshot: DaemonSessionSnapshot = {
	activeSessionId: "active-1",
	summary,
	state,
	messages: [],
	sessionContext: {
		messages: [],
		thinkingLevel: "ultra",
		serviceTier: "default",
		model: null,
	},
	lastEventSequence: 1,
};

describe("Ultra daemon thinking-level compatibility", () => {
	it("downgrades new-daemon snapshots for old clients", () => {
		const normalized = normalizeDaemonSessionSnapshotForThinkingLevelCapability(snapshot, false);

		expect(normalized.state.thinkingLevel).toBe("max");
		expect(normalized.state.availableThinkingLevels).toEqual(["off", "high", "max"]);
		expect(normalized.state.scopedModels[0]?.thinkingLevel).toBe("max");
		expect(normalized.summary.thinkingLevel).toBe("max");
		expect(normalized.sessionContext?.thinkingLevel).toBe("max");
		expect(snapshot.state.thinkingLevel).toBe("ultra");
	});

	it("downgrades Ultra change events for old clients", () => {
		const event: DaemonOutbound = {
			type: "session_event",
			activeSessionId: "active-1",
			event: { type: "thinking_level_changed", level: "ultra" },
		};

		expect(normalizeDaemonOutboundForThinkingLevelCapability(event, false)).toMatchObject({
			event: { type: "thinking_level_changed", level: "max" },
		});
		expect(normalizeDaemonOutboundForThinkingLevelCapability(event, true)).toBe(event);
	});

	it("downgrades list, context, and cycle responses for old clients", () => {
		const responses: DaemonResponse[] = [
			{ type: "response", command: "list", success: true, data: { sessions: [summary] } },
			{
				type: "response",
				command: "get_session_context",
				success: true,
				data: { context: { messages: [], thinkingLevel: "ultra", serviceTier: "default", model: null } },
			},
			{ type: "response", command: "cycle_thinking_level", success: true, data: { level: "ultra" } },
		];

		expect(responses.map((response) => normalizeDaemonResponseForThinkingLevelCapability(response, false))).toEqual([
			{
				type: "response",
				command: "list",
				success: true,
				data: { sessions: [{ ...summary, thinkingLevel: "max" }] },
			},
			{
				type: "response",
				command: "get_session_context",
				success: true,
				data: { context: { messages: [], thinkingLevel: "max", serviceTier: "default", model: null } },
			},
			{ type: "response", command: "cycle_thinking_level", success: true, data: { level: "max" } },
		]);
	});

	it("preserves Ultra state for clients that negotiated the capability", () => {
		expect(normalizeConnectionStateForThinkingLevelCapability(state, true)).toBe(state);
		expect(normalizeDaemonSessionSnapshotForThinkingLevelCapability(snapshot, true)).toBe(snapshot);
	});
});
