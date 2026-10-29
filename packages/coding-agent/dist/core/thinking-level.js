import { clampThinkingLevel, getSupportedThinkingLevels } from "@earendil-works/pi-ai";
export const AGENT_THINKING_LEVELS = [
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
export function getAvailableAgentThinkingLevels(model) {
    if (!model)
        return [...AGENT_THINKING_LEVELS];
    const nativeLevels = getSupportedThinkingLevels(model);
    return nativeLevels.includes("max") ? [...nativeLevels, "ultra"] : nativeLevels;
}
/** Clamp host state without ever passing Ultra into the provider capability layer. */
export function clampAgentThinkingLevel(model, level) {
    if (!model)
        return "off";
    if (level === "ultra" && getSupportedThinkingLevels(model).includes("max"))
        return "ultra";
    return clampThinkingLevel(model, level === "ultra" ? "max" : level);
}
//# sourceMappingURL=thinking-level.js.map