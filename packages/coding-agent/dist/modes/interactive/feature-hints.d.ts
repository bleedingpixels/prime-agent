import type { AppKeybinding } from "../../core/keybindings.js";
export interface FeatureHintContext {
    getKeybinding(action: AppKeybinding): string | undefined;
    isResidentSession: boolean;
}
interface FeatureHintDefinition {
    id: string;
    getText(context: FeatureHintContext): string | undefined;
}
export interface FeatureHint {
    id: string;
    text: string;
}
export declare const FEATURE_HINTS: readonly FeatureHintDefinition[];
export declare class FeatureHintDeck {
    private readonly random;
    private remaining;
    private previousId;
    constructor(random?: () => number);
    next(context: FeatureHintContext): FeatureHint | undefined;
    private refill;
}
export {};
//# sourceMappingURL=feature-hints.d.ts.map