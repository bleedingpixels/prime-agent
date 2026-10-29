import { type Component } from "@earendil-works/pi-tui";
import type { AgentConnectionSideQuestionEvent } from "../../agent-connection/types.js";
export declare class SideQuestionComponent implements Component {
    private readonly paddingX;
    private readonly entries;
    constructor(event: AgentConnectionSideQuestionEvent, paddingX?: number);
    addTurn(event: AgentConnectionSideQuestionEvent): void;
    addBash(component: Component): void;
    finishBash(): void;
    update(event: AgentConnectionSideQuestionEvent): void;
    invalidate(): void;
    render(width: number): string[];
    private renderAnswer;
    private renderHint;
    private applySurface;
}
//# sourceMappingURL=side-question.d.ts.map