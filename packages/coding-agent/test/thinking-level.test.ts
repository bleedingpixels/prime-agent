import { getModel } from "@earendil-works/pi-ai";
import { describe, expect, it } from "vitest";
import { clampAgentThinkingLevel, getAvailableAgentThinkingLevels } from "../src/core/thinking-level.js";

describe("agent thinking levels", () => {
	it("does not advertise Ultra before a model establishes native max support", () => {
		expect(getAvailableAgentThinkingLevels()).not.toContain("ultra");
	});

	it("advertises Ultra only when the model supports native max reasoning", () => {
		const maxModel = getModel("openai-codex", "gpt-5.6-sol");
		const anthropicMaxModel = getModel("anthropic", "claude-opus-4-6");
		const xhighModel = getModel("openai-codex", "gpt-5.5");

		expect(getAvailableAgentThinkingLevels(maxModel)).toEqual([
			"off",
			"low",
			"medium",
			"high",
			"xhigh",
			"max",
			"ultra",
		]);
		expect(getAvailableAgentThinkingLevels(anthropicMaxModel)).toContain("ultra");
		expect(getAvailableAgentThinkingLevels(xhighModel)).not.toContain("ultra");
	});

	it("preserves Ultra on max-capable models and otherwise clamps from max", () => {
		expect(clampAgentThinkingLevel(getModel("openai-codex", "gpt-5.6-sol"), "ultra")).toBe("ultra");
		expect(clampAgentThinkingLevel(getModel("openai-codex", "gpt-5.5"), "ultra")).toBe("xhigh");
	});
});
