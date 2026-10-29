/**
 * Parse a skill block from message text.
 * Returns null if the text doesn't contain a skill block.
 */
export function parseSkillBlock(text) {
    const match = text.match(/^<skill name="([^"]+)" location="([^"]+)">\n([\s\S]*?)\n<\/skill>(?:\n\n([\s\S]+))?$/);
    if (!match)
        return null;
    return {
        name: match[1],
        location: match[2],
        content: match[3],
        userMessage: match[4]?.trim() || undefined,
    };
}
//# sourceMappingURL=skill-blocks.js.map