/**
 * Thrown when /import references a JSONL file path that does not exist.
 */
export declare class SessionImportFileNotFoundError extends Error {
    readonly filePath: string;
    constructor(filePath: string);
}
//# sourceMappingURL=session-import-errors.d.ts.map