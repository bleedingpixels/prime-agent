import type { ContextTreeNode } from "../../../core/context-tree.js";
/**
 * Render the /context overview: a tree with one row per agent showing its own
 * tokens and cost (descendants excluded, so columns add up) plus per-agent
 * context-window utilization, followed by grand totals.
 */
export declare function formatContextTree(root: ContextTreeNode, width: number): string;
//# sourceMappingURL=context-tree-format.d.ts.map