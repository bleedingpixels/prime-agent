import { PRIME_INFERENCE_PROVIDER_ID } from "../../core/prime-inference-auth.js";
export function shouldRunPrimeCliOnboardingSplash(state) {
    if (state.settingsManager.getOnboardingShown()) {
        return false;
    }
    if (!state.model || state.model.provider !== PRIME_INFERENCE_PROVIDER_ID) {
        return false;
    }
    const authStatus = state.modelRegistry.getProviderAuthStatus(PRIME_INFERENCE_PROVIDER_ID);
    return authStatus.source === "prime_cli";
}
export function isOnboardingModelReady(state) {
    return state.model !== undefined && state.modelRegistry.hasConfiguredAuth(state.model);
}
export function shouldRunOnboarding(state) {
    if (state.settingsManager.getOnboardingShown()) {
        return false;
    }
    state.modelRegistry.refresh();
    if (shouldRunPrimeCliOnboardingSplash(state)) {
        return true;
    }
    return !isOnboardingModelReady(state);
}
//# sourceMappingURL=onboarding.js.map