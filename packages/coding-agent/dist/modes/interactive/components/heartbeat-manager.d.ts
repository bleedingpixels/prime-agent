import { type Component, type Focusable } from "@earendil-works/pi-tui";
import type { AgentHeartbeatManagementAction } from "../../../core/cron-jobs.js";
import type { AgentConnectionHeartbeat } from "../../agent-connection/types.js";
export interface HeartbeatManagerOptions {
    getRows: () => number;
    onAction: (heartbeat: AgentConnectionHeartbeat, action: AgentHeartbeatManagementAction) => Promise<void>;
    onClose: () => void;
    requestRender: () => void;
}
export declare class HeartbeatManagerComponent implements Component, Focusable {
    private readonly options;
    private heartbeats;
    private selectedIndex;
    private mode;
    private busy;
    private error;
    private _focused;
    constructor(heartbeats: readonly AgentConnectionHeartbeat[], options: HeartbeatManagerOptions);
    get focused(): boolean;
    set focused(value: boolean);
    invalidate(): void;
    setHeartbeats(heartbeats: readonly AgentConnectionHeartbeat[]): void;
    handleInput(data: string): void;
    render(width: number): string[];
    private createHeartbeatListPanel;
    private populateHeartbeatList;
    private createActionPanel;
    private moveSelection;
    private confirmSelection;
    private runAction;
    private availableActions;
    private findHeartbeat;
    private sessionLabel;
    private getListLayout;
    private formatStatus;
    private formatHeartbeatDetails;
    private sourceLabel;
    private defaultHeartbeatName;
    private closeHint;
    private detailHint;
    private actionDescription;
    private singleLine;
    private formatTimestamp;
}
//# sourceMappingURL=heartbeat-manager.d.ts.map