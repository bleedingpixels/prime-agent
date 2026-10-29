export interface PublicCommandResult {
    handled: boolean;
    args: string[];
    explicitAgentsView: boolean;
    attachAgent?: string;
}
export declare function handlePublicCommand(args: string[]): Promise<PublicCommandResult>;
//# sourceMappingURL=public-command.d.ts.map