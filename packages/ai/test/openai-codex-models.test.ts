import { describe, expect, it } from "vitest";
import { getModel } from "../src/models.js";

describe("openai-codex gpt-5.6-sol 1M option", () => {
	it("exposes the 1M context window, 900k auto-compact limit, and 1M display name", () => {
		const model = getModel("openai-codex", "gpt-5.6-sol");
		expect(model).toBeDefined();
		expect(model!.id).toBe("gpt-5.6-sol");
		expect(model!.name).toBe("GPT-5.6 Sol 1M");
		expect(model!.contextWindow).toBe(1000000);
		expect(model!.autoCompactTokenLimit).toBe(900000);
		expect(model!.maxTokens).toBe(128000);
	});
});
