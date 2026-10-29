/**
 * Modules made available to extensions via jiti virtualModules in the compiled
 * Bun binary.
 *
 * These imports MUST be static so Bun bundles them into the compiled binary;
 * the module itself is loaded lazily (dynamic import with a literal specifier,
 * which Bun also bundles) so that merely importing the extension loader does
 * not pull in the entire package graph at startup.
 */
export declare const VIRTUAL_MODULES: Record<string, unknown>;
//# sourceMappingURL=bundled-modules.d.ts.map