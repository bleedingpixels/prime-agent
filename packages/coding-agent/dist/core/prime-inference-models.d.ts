import type { Model } from "@earendil-works/pi-ai";
export declare const PRIME_INFERENCE_BASE_URL = "https://api.pinference.ai/api/v1";
export declare function isPrivatePrimeInferenceModel(model: Pick<Model<string>, "provider" | "id">): boolean;
export declare function getPrivatePrimeInferenceModels(): Model<"openai-completions">[];
export declare function fetchAuthorizedPrivatePrimeInferenceModelIds(apiKey: string, teamHeaders: Record<string, string>, fetchFn?: typeof fetch, timeoutMs?: number): Promise<Set<string>>;
//# sourceMappingURL=prime-inference-models.d.ts.map