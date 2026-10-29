import { type Component } from "@earendil-works/pi-tui";
interface PrimeOnboardingSplashOptions {
    getRows?: () => number;
    requestRender?: () => void;
    animationIntervalMs?: number;
    continueActionLabel?: string;
}
export declare class PrimeOnboardingSplashComponent implements Component {
    private readonly onSelect;
    private readonly onCancel;
    private readonly options;
    private frame;
    private animationInterval?;
    private progressMessage?;
    constructor(onSelect: () => void, onCancel: () => void, options?: PrimeOnboardingSplashOptions);
    invalidate(): void;
    dispose(): void;
    showProgress(message: string): void;
    render(width: number): string[];
    handleInput(keyData: string): void;
    private formatContinueHint;
    private formatBrandLine;
    private renderPanel;
    private renderLogoBlock;
    private renderBackdrop;
    private drawLabField;
    private labCell;
    private isInsideQuietZone;
    private drawStyledText;
    private put;
    private renderCells;
    private mod;
    private visiblePartsWidth;
    private logoQuietZone;
    private centerParts;
    private getTargetRows;
}
export {};
//# sourceMappingURL=prime-onboarding-splash.d.ts.map