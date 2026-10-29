import { type Component } from "@earendil-works/pi-tui";
export declare const FEATURE_HINT_ANIMATION_INTERVAL_MS = 160;
export declare class FeatureHintComponent implements Component {
    private readonly text;
    private frame;
    constructor(text: string);
    advance(): void;
    invalidate(): void;
    render(width: number): string[];
}
//# sourceMappingURL=feature-hint.d.ts.map