export interface AutocompleteItem {
    value: string;
    label: string;
    description?: string;
    argumentHint?: string;
    sourceTag?: string;
    takesArgument?: boolean;
}
type Awaitable<T> = T | Promise<T>;
export interface SlashCommand {
    name: string;
    aliases?: readonly string[];
    description?: string;
    argumentHint?: string;
    sourceTag?: string;
    takesArgument?: boolean;
    getArgumentCompletions?(argumentPrefix: string): Awaitable<AutocompleteItem[] | null>;
}
export interface AutocompleteSuggestions {
    items: AutocompleteItem[];
    prefix: string;
    kind?: "slash-command" | "file";
}
export interface AutocompleteProvider {
    getSuggestions(lines: string[], cursorLine: number, cursorCol: number, options: {
        signal: AbortSignal;
        force?: boolean;
    }): Promise<AutocompleteSuggestions | null>;
    applyCompletion(lines: string[], cursorLine: number, cursorCol: number, item: AutocompleteItem, prefix: string): {
        lines: string[];
        cursorLine: number;
        cursorCol: number;
    };
    shouldTriggerFileCompletion?(lines: string[], cursorLine: number, cursorCol: number): boolean;
}
export declare class CombinedAutocompleteProvider implements AutocompleteProvider {
    private commands;
    private basePath;
    private fdPath;
    constructor(commands: (AutocompleteItem | SlashCommand)[] | undefined, basePath: string, fdPath?: string | null);
    getSuggestions(lines: string[], cursorLine: number, cursorCol: number, options: {
        signal: AbortSignal;
        force?: boolean;
    }): Promise<AutocompleteSuggestions | null>;
    applyCompletion(lines: string[], cursorLine: number, cursorCol: number, item: AutocompleteItem, prefix: string): {
        lines: string[];
        cursorLine: number;
        cursorCol: number;
    };
    private extractAtPrefix;
    private extractPathPrefix;
    private expandHomePath;
    private resolveScopedFuzzyQuery;
    private scopedPathForDisplay;
    private getFileSuggestions;
    private scoreEntry;
    private getFuzzyFileSuggestions;
    shouldTriggerFileCompletion(lines: string[], cursorLine: number, cursorCol: number): boolean;
}
export {};
//# sourceMappingURL=autocomplete.d.ts.map