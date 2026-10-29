import { createRequire as __piBundleCreateRequire } from 'node:module'; const require = __piBundleCreateRequire(import.meta.url);

// ../ai/src/cache-pricing.ts
var ANTHROPIC_CACHE_READ_COST_MULTIPLIER = 0.1;
var ANTHROPIC_FIVE_MINUTE_CACHE_WRITE_COST_MULTIPLIER = 1.25;
var ANTHROPIC_ONE_HOUR_CACHE_WRITE_COST_MULTIPLIER = 2;
function hasStandardAnthropicCachePricing(model) {
  const modelId = model.id.toLowerCase();
  const isAnthropicModel = model.provider === "anthropic" || modelId.startsWith("anthropic/") || modelId.startsWith("claude-");
  if (!isAnthropicModel) {
    return false;
  }
  const expectedCacheWriteCost = model.cost.input * ANTHROPIC_FIVE_MINUTE_CACHE_WRITE_COST_MULTIPLIER;
  const tolerance = Number.EPSILON * Math.max(1, model.cost.cacheWrite, expectedCacheWriteCost);
  return Math.abs(model.cost.cacheWrite - expectedCacheWriteCost) <= tolerance;
}
function getAnthropicCacheCosts(inputCost, duration) {
  return {
    cacheRead: inputCost * ANTHROPIC_CACHE_READ_COST_MULTIPLIER,
    cacheWrite: inputCost * (duration === "1h" ? ANTHROPIC_ONE_HOUR_CACHE_WRITE_COST_MULTIPLIER : ANTHROPIC_FIVE_MINUTE_CACHE_WRITE_COST_MULTIPLIER)
  };
}
function getAnthropicCacheWriteCost(inputCost, duration, cacheCreation) {
  if (!cacheCreation) {
    return getAnthropicCacheCosts(inputCost, duration).cacheWrite;
  }
  const fiveMinuteTokens = cacheCreation.ephemeral_5m_input_tokens;
  const oneHourTokens = cacheCreation.ephemeral_1h_input_tokens;
  const totalTokens = fiveMinuteTokens + oneHourTokens;
  if (totalTokens === 0) {
    return getAnthropicCacheCosts(inputCost, duration).cacheWrite;
  }
  return inputCost * (fiveMinuteTokens * ANTHROPIC_FIVE_MINUTE_CACHE_WRITE_COST_MULTIPLIER + oneHourTokens * ANTHROPIC_ONE_HOUR_CACHE_WRITE_COST_MULTIPLIER) / totalTokens;
}

export {
  hasStandardAnthropicCachePricing,
  getAnthropicCacheWriteCost
};
