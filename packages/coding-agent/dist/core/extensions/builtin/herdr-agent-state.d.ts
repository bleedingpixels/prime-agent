/**
 * Built-in Herdr integration extension.
 *
 * Reports agent lifecycle state (working/idle/blocked) to the Herdr terminal
 * workspace manager via its Unix socket. This is the in-tree equivalent of
 * the extension that `herdr integration install pi` writes, so Prime Agent
 * works inside Herdr panes out of the box without a manual install step.
 *
 * Unlike the file-based integration (re-evaluated per session load by jiti),
 * this module is statically imported and evaluated once per process. All env
 * capture and state therefore live inside the factory, which the resource
 * loader invokes per session load — inside the daemon's client-env window —
 * so each daemon session captures its own pane identity.
 *
 * The factory is a complete no-op when `HERDR_ENV` is not `"1"` (i.e. when
 * not running inside a Herdr pane), so it is safe to always load.
 */
import type { ExtensionFactory } from "../types.js";
/**
 * True when Herdr's own file-based Pi integration (`herdr integration
 * install pi`) is among the extension files the loader actually loaded this
 * cycle. That extension reports with the same `herdr:pi` source but its own
 * seq counter, so running the built-in alongside it would make the two
 * reporters race on one pane.
 *
 * Loaded paths — not raw disk existence — are the deferral source of truth:
 * a file that exists but never loads (settings `!` overrides, noExtensions,
 * paths outside the discovery dirs such as the legacy `~/.pi/agent/`) never
 * becomes an active reporter, and deferring to it would leave the pane with
 * no reporter at all.
 */
export declare function hasFileBasedHerdrIntegration(loadedExtensionPaths: string[]): boolean;
/**
 * Build the built-in Herdr reporter factory. `getLoadedExtensionPaths`
 * returns the extension files the resource loader actually loaded in the
 * current cycle; it is re-checked on every factory invocation (i.e. on every
 * session load and `/reload`), so installing Herdr's own file-based
 * integration and reloading hands the pane over to it without also keeping
 * the built-in active — while a file that exists but never loads (settings
 * overrides, legacy paths) does not silence the built-in.
 */
export declare function createHerdrAgentStateExtension(getLoadedExtensionPaths: () => string[]): ExtensionFactory;
/** Built-in reporter with no file-based deferral, for tests and embedders. */
export declare const herdrAgentStateExtension: ExtensionFactory;
//# sourceMappingURL=herdr-agent-state.d.ts.map