/**
 * Footer component for the prime brand TUI.
 *
 * Renders nothing by default — token counters, cost, model name, cwd, and context %
 * are intentionally hidden. The setters and invalidate/dispose hooks are kept so the
 * existing call sites in interactive-mode keep working without modification, and so
 * `/usage` can expose telemetry without re-plumbing.
 */
export class FooterComponent {
    footerData;
    constructor(footerData) {
        this.footerData = footerData;
        void this.footerData;
    }
    setAutoCompactEnabled(_enabled) {
        // no-op while the footer is empty
    }
    /**
     * No-op: git branch caching now handled by provider.
     * Kept for compatibility with existing call sites in interactive-mode.
     */
    invalidate() {
        // No-op: git branch is cached/invalidated by provider
    }
    /**
     * Clean up resources.
     * Git watcher cleanup now handled by provider.
     */
    dispose() {
        // Git watcher cleanup handled by provider
    }
    render(_width) {
        // Footer is intentionally empty in the prime brand TUI. Telemetry (cost, tokens, model,
        // cwd, context %) is hidden by default; bring it back via /usage when needed.
        return [];
    }
}
//# sourceMappingURL=footer.js.map