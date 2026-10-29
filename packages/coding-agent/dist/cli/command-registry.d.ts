export interface CommandSpec {
    path: readonly string[];
    usage: string;
    summary: string;
    description?: string;
    options?: readonly string[];
    examples?: readonly string[];
}
export declare const COMMAND_SPECS: readonly CommandSpec[];
export declare const PUBLIC_COMMAND_NAMES: Set<string>;
export declare const REMOVED_COMMAND_NAMES: Set<string>;
export declare function getCommandSpec(path: readonly string[]): CommandSpec | undefined;
export declare function getChildCommandSpecs(path: readonly string[]): CommandSpec[];
export declare function isHelpCommandRequest(path: readonly string[]): boolean;
export declare function findCommandSuggestion(input: string, candidates: readonly string[]): string | undefined;
export declare function formatTopLevelHelp(): string;
export declare function formatCommandHelp(path: readonly string[]): string | undefined;
//# sourceMappingURL=command-registry.d.ts.map