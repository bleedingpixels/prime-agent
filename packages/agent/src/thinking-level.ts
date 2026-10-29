import type { ThinkingLevel as ProviderThinkingLevel } from "@earendil-works/pi-ai";
import type { ThinkingLevel } from "./types.js";

/** Translate host reasoning state to the provider-native effort sent on inference requests. */
export function toProviderThinkingLevel(level: ThinkingLevel): ProviderThinkingLevel | undefined {
	if (level === "off") return undefined;
	if (level === "ultra") return "max";
	return level;
}
