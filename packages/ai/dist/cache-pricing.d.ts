import type { Api, Model } from "./types.js";
export type AnthropicCacheDuration = "5m" | "1h";
export interface AnthropicCacheCreationUsage {
    ephemeral_5m_input_tokens: number;
    ephemeral_1h_input_tokens: number;
}
export declare function hasStandardAnthropicCachePricing<TApi extends Api>(model: Model<TApi>): boolean;
export declare function getAnthropicCacheCosts(inputCost: number, duration: AnthropicCacheDuration): {
    cacheRead: number;
    cacheWrite: number;
};
export declare function getAnthropicCacheWriteCost(inputCost: number, duration: AnthropicCacheDuration, cacheCreation?: AnthropicCacheCreationUsage | null): number;
//# sourceMappingURL=cache-pricing.d.ts.map