import type { Api, Model } from "@earendil-works/pi-ai";
import type { ModelRegistry } from "./model-registry.js";
type ProviderLoginResult = {
    status: "success";
    providerId: string;
    kind?: "provider" | "service";
} | {
    status: "cancelled" | "failed";
};
export interface PrimeInferencePostLoginModelAction {
    openModelPicker: boolean;
    fallbackModel?: Model<Api>;
}
export declare function resolvePrimeInferencePostLoginModelAction(authResult: ProviderLoginResult, currentModel: Model<Api> | undefined, modelRegistry: Pick<ModelRegistry, "find">): PrimeInferencePostLoginModelAction;
export {};
//# sourceMappingURL=prime-inference-model-selection.d.ts.map