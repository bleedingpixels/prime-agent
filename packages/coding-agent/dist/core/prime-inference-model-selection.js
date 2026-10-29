import { PRIME_INFERENCE_DEFAULT_MODEL_ID } from "./model-resolver.js";
import { PRIME_INFERENCE_PROVIDER_ID } from "./prime-inference-auth.js";
export function resolvePrimeInferencePostLoginModelAction(authResult, currentModel, modelRegistry) {
    if (authResult.status !== "success" ||
        authResult.kind === "service" ||
        authResult.providerId !== PRIME_INFERENCE_PROVIDER_ID) {
        return { openModelPicker: false };
    }
    return {
        openModelPicker: true,
        fallbackModel: currentModel
            ? undefined
            : modelRegistry.find(PRIME_INFERENCE_PROVIDER_ID, PRIME_INFERENCE_DEFAULT_MODEL_ID),
    };
}
//# sourceMappingURL=prime-inference-model-selection.js.map