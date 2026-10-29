import type { SourceInfo } from "./source-info.js";
export type SlashCommandSource = "extension" | "prompt" | "skill";
export interface SlashCommandInfo {
    name: string;
    description?: string;
    source: SlashCommandSource;
    sourceInfo: SourceInfo;
}
export declare const SESSION_SLASH_COMMAND_NAMES: readonly ["compact", "refine", "goal", "autonomous"];
export type SessionSlashCommandName = (typeof SESSION_SLASH_COMMAND_NAMES)[number];
export declare function isSessionSlashCommandName(value: unknown): value is SessionSlashCommandName;
export interface SessionSlashCommand {
    name: SessionSlashCommandName;
    args: string;
    text: string;
}
export interface RefineCommandOptions {
    instructions?: string;
    rollbackId?: string;
    global?: boolean;
}
export declare function parseRefineCommandOptions(args: string): RefineCommandOptions;
export interface BuiltinSlashCommand {
    name: string;
    description: string;
    execution?: "client" | "session";
    /** Shown in autocomplete before the description, e.g. "[instructions]" */
    argumentHint?: string;
    /** Hidden names that resolve to this command without being shown as commands. */
    aliases?: readonly string[];
    takesArgument?: boolean;
}
export interface ParsedSlashCommand {
    name: string;
    args: string;
}
export interface ResolvedSlashCommand extends ParsedSlashCommand {
    originalName: string;
    isAlias: boolean;
}
export declare const BUILTIN_SLASH_COMMANDS: ReadonlyArray<BuiltinSlashCommand>;
export declare function parseSlashCommand(text: string): ParsedSlashCommand | undefined;
export declare function resolveBuiltinSlashCommandName(name: string): string;
export declare function isBuiltinSlashCommandName(name: string): boolean;
export declare function builtinSlashCommandTakesArgument(name: string): boolean;
export declare function resolveSlashCommand(command: ParsedSlashCommand): ResolvedSlashCommand;
export declare function parseSessionSlashCommand(text: string): SessionSlashCommand | undefined;
//# sourceMappingURL=slash-commands.d.ts.map