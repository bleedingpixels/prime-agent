export type SlashCommandContext = {
    kind: "name";
    prefix: string;
    isAtPromptStart: boolean;
} | {
    kind: "argument";
    commandName: string;
    prefix: string;
    isAtPromptStart: true;
};
export declare function getSlashCommandContext(lines: string[], cursorLine: number, cursorCol: number): SlashCommandContext | null;
//# sourceMappingURL=slash-command-context.d.ts.map