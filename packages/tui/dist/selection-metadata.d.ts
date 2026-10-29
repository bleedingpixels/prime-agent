export interface TableCellSelectionRegion {
    line: number;
    col: number;
    width: number;
    table: object;
    tableTop: number;
    tableBottom: number;
    tableLeft: number;
    tableRight: number;
    row: number;
    column: number;
    segment: number;
    content: string;
}
export declare function markTableStart(line: string): string;
export declare function markTableEnd(line: string): string;
export declare function markTableCell(text: string, row: number, column: number, segment: number, content: string): string;
export declare function extractTableCellSelectionRegions(lines: string[], getTableIdentity: (index: number) => object): {
    lines: string[];
    regions: TableCellSelectionRegion[];
};
//# sourceMappingURL=selection-metadata.d.ts.map