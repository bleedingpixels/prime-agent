import type { Api, Model } from "@earendil-works/pi-ai";
import type { AuthStatus } from "../../core/auth-storage.js";
export interface OnboardingSettingsReader {
    getOnboardingShown(): boolean;
}
export interface OnboardingModelRegistryReader {
    refresh(): void;
    hasConfiguredAuth(model: Model<Api>): boolean;
    getProviderAuthStatus(provider: string): AuthStatus;
}
export interface OnboardingStartupState {
    settingsManager: OnboardingSettingsReader;
    modelRegistry: OnboardingModelRegistryReader;
    model: Model<Api> | undefined;
}
export declare function shouldRunPrimeCliOnboardingSplash(state: OnboardingStartupState): boolean;
export declare function isOnboardingModelReady(state: OnboardingStartupState): boolean;
export declare function shouldRunOnboarding(state: OnboardingStartupState): boolean;
//# sourceMappingURL=onboarding.d.ts.map