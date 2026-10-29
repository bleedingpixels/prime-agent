import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import { type Api, clampThinkingLevel, getSupportedThinkingLevels, type Model } from "@earendil-works/pi-ai";

export const AGENT_THINKING_LEVELS: readonly ThinkingLevel[] = [
	"off",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max",
	"ultra",
];

/** Return host-visible levels, adding Ultra only when the model has native max reasoning. */
export function getAvailableAgentThinkingLevels(model?: Model<Api>): ThinkingLevel[] {
	if (!model) return AGENT_THINKING_LEVELS.filter((level) => level !== "ultra");
	const nativeLevels = getSupportedThinkingLevels(model) as ThinkingLevel[];
	return nativeLevels.includes("max") ? [...nativeLevels, "ultra"] : nativeLevels;
}

/** Clamp host state without ever passing Ultra into the provider capability layer. */
export function clampAgentThinkingLevel(model: Model<Api> | undefined, level: ThinkingLevel): ThinkingLevel {
	if (!model) return "off";
	if (level === "ultra" && getSupportedThinkingLevels(model).includes("max")) return "ultra";
	return clampThinkingLevel(model, level === "ultra" ? "max" : level) as ThinkingLevel;
}
