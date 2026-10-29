export interface ParsedIpythonBashCell {
    leadingWhitespace: string;
    indent: string;
    magicArguments: string;
    lineBreak: string;
    body: string;
}
export declare function parseIpythonBashCell(code: string): ParsedIpythonBashCell | undefined;
//# sourceMappingURL=ipython-cell-code.d.ts.map