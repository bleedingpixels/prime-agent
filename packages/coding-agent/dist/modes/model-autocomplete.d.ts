import type { AutocompleteItem } from "@earendil-works/pi-tui";
export interface ModelAutocompleteCandidate {
    id: string;
    provider: string;
}
export declare function getModelArgumentCompletions(prefix: string, models: ReadonlyArray<ModelAutocompleteCandidate>): AutocompleteItem[] | null;
//# sourceMappingURL=model-autocomplete.d.ts.map