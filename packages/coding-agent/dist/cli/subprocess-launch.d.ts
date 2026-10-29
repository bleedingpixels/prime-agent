export interface CliSubprocessLaunchSpec {
    command: string;
    args: string[];
}
export declare function createCliSubprocessEnv(source?: NodeJS.ProcessEnv, entrypoint?: string, execArgs?: readonly string[]): NodeJS.ProcessEnv;
export declare function formatCurrentCliCommand(args: readonly string[], environment?: NodeJS.ProcessEnv): string;
export declare function createCliSubprocessLaunchSpec(args: readonly string[], executable?: string, execArgs?: readonly string[], entrypoint?: string): CliSubprocessLaunchSpec;
//# sourceMappingURL=subprocess-launch.d.ts.map