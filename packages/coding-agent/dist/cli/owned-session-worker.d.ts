import type { AgentSessionRuntime } from "../core/agent-session-runtime.js";
import { type CliSubprocessLaunchSpec } from "./subprocess-launch.js";
export type OwnedSessionWorkerProfile = "print" | "json" | "rpc" | "interactive-ephemeral";
export declare function isOwnedSessionWorkerProcess(environment?: NodeJS.ProcessEnv): boolean;
export declare function classifyOwnedSessionWorkerInvocation(args: readonly string[], stdinIsTTY: boolean | undefined, environment?: NodeJS.ProcessEnv): OwnedSessionWorkerProfile | undefined;
export type OwnedWorkerLaunchSpec = CliSubprocessLaunchSpec;
export declare function createOwnedWorkerLaunchSpec(args: readonly string[], executable?: string, execArgs?: readonly string[], entrypoint?: string): OwnedWorkerLaunchSpec;
export declare function installOwnedSessionRecoveryTracking(runtime: AgentSessionRuntime): void;
export declare function createRpcRecoveryArgs(args: readonly string[], sessionPath: string): string[];
export declare function runOwnedSessionWorkerFrontend(args: readonly string[], profile: OwnedSessionWorkerProfile): Promise<number>;
export declare function maybeRunOwnedSessionWorkerFrontend(args: readonly string[], forceLegacyFrontend?: boolean): Promise<boolean>;
export declare function installOwnedSessionWorkerOwnerWatch(): void;
export declare function closeOwnedSessionWorkerOwnerWatch(): void;
//# sourceMappingURL=owned-session-worker.d.ts.map