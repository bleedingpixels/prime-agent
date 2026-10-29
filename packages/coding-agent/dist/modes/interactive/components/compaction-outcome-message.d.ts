import { Container } from "@earendil-works/pi-tui";
import type { CompactionOutcomeMessage } from "../../../core/messages.js";
/** Renders a durable unsuccessful automatic-compaction outcome. */
export declare class CompactionOutcomeMessageComponent extends Container {
    constructor(message: CompactionOutcomeMessage);
    setExpanded(_expanded: boolean): void;
}
export declare class MalformedCompactionOutcomeMessageComponent extends Container {
    constructor();
    setExpanded(_expanded: boolean): void;
}
//# sourceMappingURL=compaction-outcome-message.d.ts.map