import { resolve } from "node:path";
import { VERSION } from "../../config.js";
export const PRIME_AGENT_BUILD_ID_ENV = "PRIME_AGENT_BUILD_ID";
export const PRIME_AGENT_LAUNCHER_PATH_ENV = "PRIME_AGENT_LAUNCHER_PATH";
function bundledBuildId() {
    return typeof __PI_BUILD_ID__ === "undefined" ? undefined : __PI_BUILD_ID__;
}
export function getDaemonRuntimeIdentity(environment = process.env) {
    const entrypoint = process.argv[1];
    const launcher = environment[PRIME_AGENT_LAUNCHER_PATH_ENV];
    return {
        buildId: environment[PRIME_AGENT_BUILD_ID_ENV] ?? bundledBuildId() ?? `release-${VERSION}`,
        executablePath: resolve(process.execPath),
        ...(entrypoint ? { entrypointPath: resolve(entrypoint) } : {}),
        ...(launcher ? { launcherPath: resolve(launcher) } : {}),
    };
}
//# sourceMappingURL=daemon-runtime-identity.js.map