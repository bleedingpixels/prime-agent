import { Container, type Focusable, type TUI } from "@earendil-works/pi-tui";
/**
 * Login dialog component - replaces editor during OAuth login flow
 */
export declare class LoginDialogComponent extends Container implements Focusable {
    private onComplete;
    private contentContainer;
    private input;
    private tui;
    private readonly isPrimeInference;
    private abortController;
    private inputResolver?;
    private inputRejecter?;
    private inputVisible;
    private continueResolver?;
    private continueRejecter?;
    private authUrl?;
    private authActions?;
    private _focused;
    get focused(): boolean;
    set focused(value: boolean);
    constructor(tui: TUI, providerId: string, onComplete: (success: boolean, message?: string) => void, providerNameOverride?: string, titleOverride?: string);
    get signal(): AbortSignal;
    private cancel;
    /**
     * Called by onAuth callback - show URL and optional instructions
     */
    showAuth(url: string, instructions?: string): void;
    /**
     * Show input for manual code/URL entry (for callback server providers)
     */
    showManualInput(prompt: string): Promise<string>;
    /**
     * Wait for the next submission of the already-visible input.
     */
    waitForInput(): Promise<string>;
    /**
     * Called by onPrompt callback - show prompt and wait for input
     * Note: Does NOT clear content, appends to existing (preserves URL from showAuth)
     */
    showPrompt(message: string, placeholder?: string): Promise<string>;
    /**
     * Show informational text without prompting for input.
     */
    showInfo(lines: string[]): void;
    showContinueInfo(lines: string[]): Promise<void>;
    /**
     * Show waiting message (for polling flows like GitHub Copilot)
     */
    showWaiting(message: string): void;
    /**
     * Called by onProgress callback
     */
    showProgress(message: string): void;
    private startContent;
    private addSectionSpacer;
    private addInstructions;
    private addSectionTitle;
    private addLabel;
    private addMutedText;
    private getAuthActionsText;
    private copyAuthUrl;
    handleInput(data: string): void;
}
//# sourceMappingURL=login-dialog.d.ts.map