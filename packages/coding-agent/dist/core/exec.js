/**
 * Shared command execution utilities for extensions and custom tools.
 */
import { spawn } from "node:child_process";
import { waitForChildProcess } from "../utils/child-process.js";
function mergeExecEnv(env) {
    if (!env) {
        return undefined;
    }
    const merged = { ...process.env };
    for (const [key, value] of Object.entries(env)) {
        if (value === undefined) {
            delete merged[key];
        }
        else {
            merged[key] = value;
        }
    }
    return merged;
}
/**
 * Execute a shell command and return stdout/stderr/code.
 * Supports timeout and abort signal.
 */
export async function execCommand(command, args, cwd, options) {
    return new Promise((resolve) => {
        const proc = spawn(command, args, {
            cwd,
            shell: false,
            stdio: ["ignore", "pipe", "pipe"],
            // Merge per-call env over the parent env so callers can scope vars
            // (e.g. herdr pane identity) without mutating the shared process.env.
            env: mergeExecEnv(options?.env),
        });
        let stdout = "";
        let stderr = "";
        let killed = false;
        let timeoutId;
        let forceKillTimeoutId;
        const killProcess = () => {
            if (!killed) {
                killed = true;
                proc.kill("SIGTERM");
                // Force kill after 5 seconds if SIGTERM doesn't work
                forceKillTimeoutId = setTimeout(() => {
                    forceKillTimeoutId = undefined;
                    if (proc.exitCode === null && proc.signalCode === null) {
                        proc.kill("SIGKILL");
                    }
                }, 5000);
            }
        };
        // Handle abort signal
        if (options?.signal) {
            if (options.signal.aborted) {
                killProcess();
            }
            else {
                options.signal.addEventListener("abort", killProcess, { once: true });
            }
        }
        // Handle timeout
        if (options?.timeout && options.timeout > 0) {
            timeoutId = setTimeout(() => {
                killProcess();
            }, options.timeout);
        }
        proc.stdout?.on("data", (data) => {
            stdout += data.toString();
        });
        proc.stderr?.on("data", (data) => {
            stderr += data.toString();
        });
        const cleanup = () => {
            if (timeoutId)
                clearTimeout(timeoutId);
            if (forceKillTimeoutId)
                clearTimeout(forceKillTimeoutId);
            if (options?.signal) {
                options.signal.removeEventListener("abort", killProcess);
            }
        };
        // Wait for process termination without hanging on inherited stdio handles
        // held open by detached descendants.
        waitForChildProcess(proc)
            .then((code) => {
            cleanup();
            resolve({ stdout, stderr, code: code ?? 0, killed });
        })
            .catch((_err) => {
            cleanup();
            resolve({ stdout, stderr, code: 1, killed });
        });
    });
}
//# sourceMappingURL=exec.js.map