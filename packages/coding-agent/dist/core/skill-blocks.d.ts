/** Parsed skill block from a user message. */
export interface ParsedSkillBlock {
    name: string;
    location: string;
    content: string;
    userMessage: string | undefined;
}
/**
 * Parse a skill block from message text.
 * Returns null if the text doesn't contain a skill block.
 */
export declare function parseSkillBlock(text: string): ParsedSkillBlock | null;
//# sourceMappingURL=skill-blocks.d.ts.map