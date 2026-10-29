import type { PythonSkillRuntimeInfo } from "../skills.js";
export declare const DEFAULT_RLM_EXTRA_UV_ARGS: string[];
export declare const DEFAULT_RLM_EXTRA_IMPORT_NAMES: string[];
export declare const DEFAULT_RLM_EXTRA_IMPORT_LABELS: string[];
export type KernelPythonSkill = PythonSkillRuntimeInfo;
export type KernelBootstrapProgressHandler = (message: string) => void;
export interface EnsureKernelPythonOptions {
    pythonSkills?: readonly KernelPythonSkill[];
    onProgress?: KernelBootstrapProgressHandler;
}
export declare function getKernelVenvDir(): string;
export declare function resolveRuntimeIdentity(): Promise<string>;
export declare function ensureKernelPython(options?: EnsureKernelPythonOptions): Promise<string>;
//# sourceMappingURL=bootstrap.d.ts.map