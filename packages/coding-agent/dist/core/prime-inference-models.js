export const PRIME_INFERENCE_BASE_URL = "https://api.pinference.ai/api/v1";
const PRIVATE_MODEL_REFRESH_TIMEOUT_MS = 10_000;
const PRIVATE_PRIME_INFERENCE_MODELS = [
    {
        id: "internal/glm-5.2-fast",
        name: "GLM 5.2 Fast",
        api: "openai-completions",
        provider: "prime-inference",
        baseUrl: PRIME_INFERENCE_BASE_URL,
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 400000,
        maxTokens: 131072,
        featured: true,
        compat: {
            supportsDeveloperRole: false,
            maxTokensField: "max_tokens",
        },
    },
];
export function isPrivatePrimeInferenceModel(model) {
    return model.provider === "prime-inference" && model.id.startsWith("internal/");
}
export function getPrivatePrimeInferenceModels() {
    return PRIVATE_PRIME_INFERENCE_MODELS.map((model) => ({
        ...model,
        input: [...model.input],
        cost: { ...model.cost },
        compat: model.compat ? { ...model.compat } : undefined,
    }));
}
export async function fetchAuthorizedPrivatePrimeInferenceModelIds(apiKey, teamHeaders, fetchFn = fetch, timeoutMs = PRIVATE_MODEL_REFRESH_TIMEOUT_MS) {
    if (!teamHeaders["X-Prime-Team-ID"]) {
        return new Set();
    }
    const response = await fetchFn(`${PRIME_INFERENCE_BASE_URL}/models`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            ...teamHeaders,
        },
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 401 || response.status === 403) {
        return new Set();
    }
    if (!response.ok) {
        throw new Error(`Prime Inference model catalog request failed with status ${response.status}`);
    }
    const payload = (await response.json());
    if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
        throw new Error("Prime Inference model catalog response is invalid");
    }
    const knownPrivateIds = new Set(PRIVATE_PRIME_INFERENCE_MODELS.map((model) => model.id));
    return new Set(payload.data.flatMap((entry) => {
        if (!entry || typeof entry !== "object" || !("id" in entry) || typeof entry.id !== "string") {
            return [];
        }
        return knownPrivateIds.has(entry.id) ? [entry.id] : [];
    }));
}
//# sourceMappingURL=prime-inference-models.js.map