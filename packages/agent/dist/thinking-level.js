/** Translate host reasoning state to the provider-native effort sent on inference requests. */
export function toProviderThinkingLevel(level) {
    if (level === "off")
        return undefined;
    if (level === "ultra")
        return "max";
    return level;
}
//# sourceMappingURL=thinking-level.js.map