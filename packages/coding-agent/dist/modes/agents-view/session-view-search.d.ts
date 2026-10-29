export interface ParsedSearchQuery {
    mode: "tokens" | "regex";
    tokens: {
        kind: "fuzzy" | "phrase";
        value: string;
    }[];
    regex: RegExp | null;
    /** If set, parsing failed and we should treat query as non-matching. */
    error?: string;
}
export interface MatchResult {
    matches: boolean;
    /** Lower is better; only meaningful when matches === true */
    score: number;
}
/** Join arbitrary session fields into the common search corpus. */
export declare function createSessionSearchText(parts: readonly (string | undefined | null)[]): string;
export declare function parseSearchQuery(query: string): ParsedSearchQuery;
/** Match any precomputed search corpus using the resume picker's query language. */
export declare function matchSearchText(text: string, parsed: ParsedSearchQuery): MatchResult;
export declare function matchesSearchText(text: string, query: string): boolean;
//# sourceMappingURL=session-view-search.d.ts.map