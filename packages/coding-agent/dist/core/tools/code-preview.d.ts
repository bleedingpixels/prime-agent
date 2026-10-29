export type CodePreviewLanguage = "bash" | "python";
export interface CodePreview {
    language: CodePreviewLanguage;
    text: string;
}
export declare function previewBashCommand(command: string): CodePreview;
export declare function previewPythonCode(code: string): CodePreview;
export declare function previewIpythonCode(code: string): CodePreview;
//# sourceMappingURL=code-preview.d.ts.map