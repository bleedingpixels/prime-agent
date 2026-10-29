import type { Component } from "@earendil-works/pi-tui";
import type { ReadonlyFooterDataProvider } from "../../../core/footer-data-provider.js";
/**
 * Footer component for the prime brand TUI.
 *
 * Renders nothing by default — token counters, cost, model name, cwd, and context %
 * are intentionally hidden. The setters and invalidate/dispose hooks are kept so the
 * existing call sites in interactive-mode keep working without modification, and so
 * `/usage` can expose telemetry without re-plumbing.
 */
export declare class FooterComponent implements Component {
    private footerData;
    constructor(footerData: ReadonlyFooterDataProvider);
    setAutoCompactEnabled(_enabled: boolean): void;
    /**
     * No-op: git branch caching now handled by provider.
     * Kept for compatibility with existing call sites in interactive-mode.
     */
    invalidate(): void;
    /**
     * Clean up resources.
     * Git watcher cleanup now handled by provider.
     */
    dispose(): void;
    render(_width: number): string[];
}
//# sourceMappingURL=footer.d.ts.map