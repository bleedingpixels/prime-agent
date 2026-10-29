import type { AgentTool } from "@earendil-works/pi-agent-core";
import type { ImageContent } from "@earendil-works/pi-ai";
import { type Static, Type } from "typebox";
import type { ToolDefinition } from "../extensions/types.js";
import type { KernelBootstrapProgressHandler } from "../kernel/bootstrap.js";
import { type HostRequestHandlers, type KernelAttachment, type KernelDiffDisplay, KernelManager, type KernelSentAgentMessage } from "../kernel/index.js";
import { type RestoreResult } from "../kernel/state-snapshot.js";
import type { PythonSkillRuntimeInfo } from "../skills.js";
export declare function buildRlmBootstrapCode(pythonSkills?: readonly PythonSkillRuntimeInfo[]): string;
declare const ipythonSchema: Type.TObject<{
    code: Type.TString;
}>;
export type IpythonToolInput = Static<typeof ipythonSchema>;
export interface IpythonToolDetails {
    durationMs?: number;
    status?: "ok" | "error" | "aborted" | "starting";
    errorEname?: string;
    stdout?: string;
    stderr?: string;
    result?: string;
    /** Diffs streamed from file edits, rendered by the IPython cell. */
    diffs?: KernelDiffDisplay[];
    /** Media attachments loaded into context (e.g. by the attach-image skill). */
    attachments?: KernelAttachment[];
    /** Agent messages sent from this cell. */
    sentAgentMessages?: KernelSentAgentMessage[];
    /** True when this result came after killing and restarting a busy kernel. */
    kernelRestarted?: boolean;
    error?: {
        ename: string;
        evalue: string;
        traceback: string[];
    };
}
export interface IpythonToolOptions {
    /** Python override. Must have `ipykernel` installed. */
    python?: string;
    env?: Record<string, string>;
    /** Command prefix prepended to every %%bash cell. */
    commandPrefix?: string;
    /** Optional explicit shell path for bare %%bash cells. */
    shellPath?: string;
    sessionId?: string;
    /** Typed host request handlers for the kernel↔host bridge (rlm.run, goal.*, …). */
    hostHandlers?: HostRequestHandlers;
    pythonSkills?: readonly PythonSkillRuntimeInfo[];
    /** Per-session artifact dir where the kernel namespace snapshot is stored. Omit to disable snapshots. */
    snapshotDir?: string;
    /** Resolves before this kernel starts — e.g. the previous provisioner's dispose, so a
     * /reload's old-kernel snapshot flush can't race the new kernel's restore. */
    readyGate?: Promise<unknown>;
    /** Filled with the live KernelManager after the first kernel start; cleared on construction. */
    kernelManagerRef?: {
        current?: KernelManager;
    };
    /**
     * Fires once per kernel start when a previous session's namespace was revived
     * (some names restored or some failed), so the session can tell the model.
     */
    onRestore?: (result: RestoreResult) => void;
    onLateSentAgentMessage?: (toolCallId: string, message: KernelSentAgentMessage) => void;
    /** Shared provisioner owning the kernel lifecycle. When provided, the remaining options are ignored. */
    provisioner?: IpythonKernelProvisioner;
}
/**
 * Owns the lazy create+start+runtime-bootstrap of one session's IPython kernel.
 *
 * Concurrent ensure() calls await the same in-flight startup, a failed startup
 * clears the memo so the next call retries fresh, and progress listeners can
 * attach mid-flight (a tool call racing a background prewarm()).
 */
export declare class IpythonKernelProvisioner {
    private readonly cwd;
    private readonly options?;
    private managerPromise?;
    private startedManager?;
    private readonly startupListeners;
    private lastStartupMessage?;
    private _lastRestore?;
    private readonly disposeController;
    constructor(cwd: string, options?: Omit<IpythonToolOptions, "provisioner"> | undefined);
    /** The kernel manager, once a startup has completed successfully. */
    get manager(): KernelManager | undefined;
    /** Result of reviving a prior session's namespace on the last kernel start, if any. */
    get lastRestore(): RestoreResult | undefined;
    /** Start the kernel in the background. Failures are swallowed here and surface on the next ensure(). */
    prewarm(): void;
    /** Whether a kernel has finished starting and is currently running. */
    get hasRunningKernel(): boolean;
    /** Live user-defined names in the kernel namespace, or null if listing failed / no kernel. */
    listNamespaceNames(signal?: AbortSignal): Promise<string[] | null>;
    /** Dispose the kernel owned by this provisioner, including one still starting up. */
    dispose(): Promise<void>;
    kill(): Promise<void>;
    ensure(onProgress?: KernelBootstrapProgressHandler, signal?: AbortSignal): Promise<KernelManager>;
    private settleStartup;
    private emitStartupProgress;
    private startKernel;
}
/** Turn kernel image attachments into `ImageContent` blocks; non-image types are dropped. */
export declare function imageBlocksFromAttachments(attachments: readonly KernelAttachment[] | undefined): ImageContent[];
export declare function createIpythonToolDefinition(cwd: string, options?: IpythonToolOptions): ToolDefinition<typeof ipythonSchema, IpythonToolDetails>;
export declare function createIpythonTool(cwd: string, options?: IpythonToolOptions): AgentTool<typeof ipythonSchema>;
export {};
//# sourceMappingURL=ipython.d.ts.map