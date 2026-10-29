/**
 * Main entry point for the coding agent CLI.
 *
 * This file handles CLI argument parsing and translates them into
 * createAgentSession() options. The SDK does the heavy lifting.
 */
import { type Args } from "./cli/args.js";
import { type AgentExecutionMode, type AgentSessionRuntimeConfig } from "./core/agent-session-config.js";
import type { ExtensionFactory } from "./core/extensions/types.js";
import type { CreateAgentSessionOptions } from "./core/sdk.js";
import { SessionManager } from "./core/session-manager.js";
import { type SessionSummary } from "./modes/index.js";
export type ClientMode = AgentExecutionMode;
/** Compatibility view of the CLI's internal daemon process entrypoint. */
export type AppMode = ClientMode | "daemon";
export declare function shouldRejectNonInteractiveAttach(attachAgent: string | undefined, appMode: AppMode): boolean;
export declare function shouldRejectBareResume(resume: true | string | undefined): boolean;
export declare function parseAgentsViewCommand(args: string[]): {
    explicitAgentsView: boolean;
    args: string[];
};
export interface DaemonClientStartupDecision {
    appMode: AppMode;
    startupBenchmark: boolean;
    noSession?: boolean;
    help?: boolean;
    listModels?: string | true;
}
export type InteractiveDaemonStartupDecision = DaemonClientStartupDecision;
/** Retained for callers that only classify persistent interactive startup. */
export declare function shouldUseDaemonInteractive(options: DaemonClientStartupDecision): boolean;
export declare function shouldUseDaemonClient(options: DaemonClientStartupDecision): boolean;
export declare function shouldUseDaemonClientRuntime(options: DaemonClientStartupDecision & {
    ownedSessionWorker?: boolean;
    hasProcessLocalExtensionFactories?: boolean;
}): boolean;
export declare function shouldEnsureInteractiveDaemonForStartup(useDaemonInteractive: boolean, attachAgent: string | undefined): boolean;
export interface AgentsViewStartupDecision {
    useDaemonInteractive: boolean;
    needsOnboarding: boolean;
    explicitAgentsView?: boolean;
    resume?: true | string;
    continue?: boolean;
    fork?: string;
}
export declare function shouldOpenAgentsViewForDaemonInteractive(options: AgentsViewStartupDecision): boolean;
export interface DaemonInteractiveSessionManagerDecision {
    resume?: true | string;
    continue?: boolean;
    fork?: string;
    hasActiveDaemonSession?: boolean;
}
export declare function shouldUseEphemeralSessionManagerForDaemonInteractive(options: DaemonInteractiveSessionManagerDecision): boolean;
export interface DaemonActiveSessionLookupDecision {
    useDaemonInteractive: boolean;
    resumeSelector?: string;
    explicitAttach?: boolean;
}
export declare function shouldEnsureDaemonBeforeActiveSessionLookup(options: DaemonActiveSessionLookupDecision): boolean;
type ActiveDaemonSessionSummaryLookup = (socketPath: string, selector: string) => Promise<SessionSummary | undefined>;
interface ActiveDaemonSessionSummaryLookupOptions {
    fallbackOnError?: boolean;
    lookup?: ActiveDaemonSessionSummaryLookup;
}
export declare function findActiveDaemonSessionSummaryForInteractiveStartup(socketPath: string, selector: string, options?: ActiveDaemonSessionSummaryLookupOptions): Promise<SessionSummary | undefined>;
export declare function createSessionManager(parsed: Args, cwd: string, sessionDir: string | undefined): Promise<SessionManager>;
export declare function daemonServerDefaultSessionConfig(config: AgentSessionRuntimeConfig): AgentSessionRuntimeConfig;
export declare function resolveRuntimeSessionOptions(sessionOptions: CreateAgentSessionOptions, runtimeSessionOptions?: CreateAgentSessionOptions): CreateAgentSessionOptions;
export declare function findActiveDaemonSessionSummaryForSessionFile(summaries: readonly SessionSummary[], sessionPath: string): SessionSummary | undefined;
export interface MainOptions {
    extensionFactories?: ExtensionFactory[];
}
export declare function main(args: string[], options?: MainOptions): Promise<undefined>;
export {};
//# sourceMappingURL=main.d.ts.map