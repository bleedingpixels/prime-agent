export function getSlashCommandContext(lines, cursorLine, cursorCol) {
    const currentLine = lines[cursorLine] ?? "";
    const textBeforeCursor = currentLine.slice(0, cursorCol);
    const trimmedStart = textBeforeCursor.trimStart();
    if (cursorLine === 0 && trimmedStart.startsWith("/")) {
        const separatorIndex = trimmedStart.search(/[ \t]/);
        const commandToken = separatorIndex === -1 ? trimmedStart : trimmedStart.slice(0, separatorIndex);
        if (commandToken.slice(1).includes("/")) {
            return null;
        }
        if (separatorIndex === -1) {
            return { kind: "name", prefix: commandToken, isAtPromptStart: true };
        }
        const commandName = commandToken.slice(1);
        if (!commandName) {
            return null;
        }
        return {
            kind: "argument",
            commandName,
            prefix: trimmedStart.slice(separatorIndex + 1),
            isAtPromptStart: true,
        };
    }
    const tokenStart = Math.max(textBeforeCursor.lastIndexOf(" "), textBeforeCursor.lastIndexOf("\t")) + 1;
    const prefix = textBeforeCursor.slice(tokenStart);
    if (!prefix.startsWith("/") || prefix.slice(1).includes("/")) {
        return null;
    }
    return { kind: "name", prefix, isAtPromptStart: false };
}
//# sourceMappingURL=slash-command-context.js.map