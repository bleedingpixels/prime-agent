import { type ChildProcess } from "node:child_process";
export declare function shouldUseWindowsShell(command: string): boolean;
/** Cheap kill(0) existence probe; counts zombies as existing. */
export declare function processIdExists(pid: number): boolean;
/** A zombie has already exited; it only lingers until its parent reaps it. */
export declare function isZombieProcess(pid: number): boolean;
/** True only for a process that is actually running: zombies do not count. */
export declare function isProcessAlive(pid: number): boolean;
export declare function signalProcessGroupOrProcess(pid: number, signal: NodeJS.Signals): void;
export declare function waitForChildProcess(child: ChildProcess): Promise<number | null>;
//# sourceMappingURL=child-process.d.ts.map