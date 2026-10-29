import type { ImageContent } from "@earendil-works/pi-ai";
import type { EditorPasteSnapshot } from "@earendil-works/pi-tui";
export interface PromptStash {
    text: string;
    expandedText?: string;
    pasteSnapshot?: EditorPasteSnapshot;
    images?: readonly (readonly [number, ImageContent])[];
}
export interface PromptStashState {
    stash?: PromptStash;
    queuedStashes?: PromptStash[];
}
export declare class ClientPromptStashStore {
    private readonly states;
    forSession(sessionId: string): PromptStashState;
    release(sessionId: string, state: PromptStashState): void;
}
//# sourceMappingURL=prompt-stash-state.d.ts.map