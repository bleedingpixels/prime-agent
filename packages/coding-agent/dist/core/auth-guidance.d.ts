export declare const LOGIN_RECOVERY_MESSAGE = "Run /login to update credentials.";
export declare function getProviderLoginHelp(): string;
export declare function formatNoModelsAvailableMessage(): string;
/**
 * Whether a model fallback message is the "no models available" warning.
 *
 * That warning is a claim about current state (no model could be resolved), so
 * consumers must re-check it against the live session before showing it; the
 * other fallback variants ("Could not restore model X. Using Y") are one-time
 * startup notices that stay valid.
 */
export declare function isNoModelsAvailableMessage(message: string | undefined): boolean;
export declare function formatNoModelSelectedMessage(): string;
export declare function formatNoApiKeyFoundMessage(provider: string): string;
export declare function formatAuthenticationFailedMessage(provider: string): string;
export declare function isLikelyAuthenticationError(message: string): boolean;
export declare function addLoginGuidanceToAuthError(message: string): string;
//# sourceMappingURL=auth-guidance.d.ts.map