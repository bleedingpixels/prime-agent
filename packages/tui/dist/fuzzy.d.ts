/**
 * Fuzzy matching utilities.
 * Matches if all query characters appear in order (not necessarily consecutive).
 * Lower score = better match.
 */
export interface FuzzyMatch {
    matches: boolean;
    score: number;
}
export declare function fuzzyMatch(query: string, text: string): FuzzyMatch;
export interface ScoredItem<T> {
    item: T;
    score: number;
}
/**
 * Filter items by fuzzy match quality, returning each match with its score
 * (lower is better) sorted best-first. Supports space-separated tokens: all
 * tokens must match.
 */
export declare function fuzzyFilterScored<T>(items: T[], query: string, getText: (item: T) => string): ScoredItem<T>[];
/**
 * Filter and sort items by fuzzy match quality (best matches first).
 * Supports space-separated tokens: all tokens must match.
 */
export declare function fuzzyFilter<T>(items: T[], query: string, getText: (item: T) => string): T[];
//# sourceMappingURL=fuzzy.d.ts.map