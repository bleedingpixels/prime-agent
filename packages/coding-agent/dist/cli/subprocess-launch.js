import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { isBunBinary } from "../config.js";
export function createCliSubprocessEnv(source = process.env, entrypoint = process.argv[1], execArgs = process.execArgv) {
    const environment = { ...source };
    if (environment.TSX_TSCONFIG_PATH !== undefined || !entrypoint || !execArgs.some((arg) => arg.includes("tsx"))) {
        return environment;
    }
    let directory = dirname(resolve(entrypoint));
    while (true) {
        const tsconfigPath = join(directory, "tsconfig.json");
        if (existsSync(tsconfigPath) && existsSync(join(directory, "node_modules", "tsx", "package.json"))) {
            environment.TSX_TSCONFIG_PATH = tsconfigPath;
            return environment;
        }
        const parent = dirname(directory);
        if (parent === directory) {
            return environment;
        }
        directory = parent;
    }
}
function quoteCommandArgument(value) {
    return /^[A-Za-z0-9_./:@%+=,-]+$/.test(value) ? value : `'${value.replaceAll("'", `'"'"'`)}'`;
}
export function formatCurrentCliCommand(args, environment = process.env) {
    const launcherPath = environment.PRIME_AGENT_LAUNCHER_PATH;
    if (launcherPath) {
        return [launcherPath, ...args].map(quoteCommandArgument).join(" ");
    }
    const launch = createCliSubprocessLaunchSpec(args);
    return [launch.command, ...launch.args].map(quoteCommandArgument).join(" ");
}
export function createCliSubprocessLaunchSpec(args, executable = process.execPath, execArgs = process.execArgv, entrypoint = process.argv[1]) {
    if (isBunBinary) {
        return { command: executable, args: [...args] };
    }
    if (!entrypoint) {
        throw new Error("Cannot determine current CLI entrypoint for subprocess launch");
    }
    const resolvedEntrypoint = isAbsolute(entrypoint) ? entrypoint : resolve(entrypoint);
    return { command: executable, args: [...execArgs, resolvedEntrypoint, ...args] };
}
//# sourceMappingURL=subprocess-launch.js.map