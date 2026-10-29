import type { ThinkingLevel } from "@earendil-works/pi-agent-core";
import { type Model } from "@earendil-works/pi-ai";
export declare const AGENT_THINKING_LEVELS: readonly ThinkingLevel[];
/** Return host-visible levels, adding Ultra only when the model has native max reasoning. */
export declare function getAvailableAgentThinkingLevels(model?: Model<any>): ThinkingLevel[];
/** Clamp host state without ever passing Ultra into the provider capability layer. */
export declare function clampAgentThinkingLevel(model: Model<any> | undefined, level: ThinkingLevel): ThinkingLevel;
//# sourceMappingURL=thinking-level.d.ts.map