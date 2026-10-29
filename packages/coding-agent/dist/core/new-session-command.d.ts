export interface ParsedNewSessionCommand {
    name?: string;
    prompt?: string;
}
/** Parse /new's raw suffix while preserving the initial prompt verbatim. */
export declare function parseNewSessionCommand(rawArgs: string): ParsedNewSessionCommand;
//# sourceMappingURL=new-session-command.d.ts.map