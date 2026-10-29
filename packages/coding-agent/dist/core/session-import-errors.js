/**
 * Thrown when /import references a JSONL file path that does not exist.
 */
export class SessionImportFileNotFoundError extends Error {
    filePath;
    constructor(filePath) {
        super(`File not found: ${filePath}`);
        this.name = "SessionImportFileNotFoundError";
        this.filePath = filePath;
    }
}
//# sourceMappingURL=session-import-errors.js.map