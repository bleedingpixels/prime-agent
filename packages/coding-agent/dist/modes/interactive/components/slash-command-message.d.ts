import { Container } from "@earendil-works/pi-tui";
export declare function isLeadingSlashCommand(text: string, isRecognized: (name: string) => boolean): boolean;
export declare function styleSlashCommandText(text: string, styleRest?: (rest: string) => string): string;
/** Renders a durable session command with the same layout as a user message. */
export declare class SlashCommandMessageComponent extends Container {
    private readonly contentBox;
    constructor(text: string);
    setExpanded(_expanded: boolean): void;
    render(width: number): string[];
}
//# sourceMappingURL=slash-command-message.d.ts.map