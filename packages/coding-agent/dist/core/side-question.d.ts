import { Agent } from "@earendil-works/pi-agent-core";
export type SideQuestionStatus = "running" | "complete" | "cancelled" | "error";
export interface SideQuestionEvent {
    id: string;
    question: string;
    answer: string;
    status: SideQuestionStatus;
    errorMessage?: string;
}
export interface SideQuestionTurn {
    question: string;
    answer: string;
}
export interface SideQuestionRun {
    done: Promise<void>;
    abort(): void;
}
export declare function startSideQuestion(parent: Agent, id: string, question: string, onEvent: (event: SideQuestionEvent) => void | Promise<void>, previousTurns?: SideQuestionTurn[]): SideQuestionRun;
//# sourceMappingURL=side-question.d.ts.map