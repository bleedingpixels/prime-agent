// Dependency-free and Node-20-safe so it can never crash on the versions it rejects.
const MIN_NODE_VERSION_PARTS = [22, 8, 0];
export const MIN_NODE_VERSION = MIN_NODE_VERSION_PARTS.join(".");
function parseVersion(version) {
    const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(version);
    if (!match) {
        return undefined;
    }
    return {
        parts: [Number(match[1]), Number(match[2]), Number(match[3])],
        prerelease: match[4] !== undefined,
    };
}
function isSupportedNodeVersion(version) {
    for (let index = 0; index < MIN_NODE_VERSION_PARTS.length; index++) {
        const part = version.parts[index];
        const minimumPart = MIN_NODE_VERSION_PARTS[index];
        if (part !== minimumPart) {
            return part > minimumPart;
        }
    }
    return !version.prerelease;
}
export function assertNodeVersion(io) {
    // Bun ships its own runtime; its node-compat version is unrelated to the user's Node.
    if (process.versions.bun) {
        return true;
    }
    const version = parseVersion(io.version);
    if (!version || isSupportedNodeVersion(version)) {
        return true;
    }
    io.log(`prime-agent requires Node ${MIN_NODE_VERSION} or newer, but the active Node is v${io.version}.`);
    io.log("");
    io.log(`  1. Install Node ${MIN_NODE_VERSION}+ (e.g. "nvm install 22 && nvm use 22", or from https://nodejs.org)`);
    io.log("  2. Reinstall prime-agent under that Node so the command resolves to it:");
    io.log("     https://github.com/PrimeIntellect-ai/prime-agent/releases/latest");
    io.exit(1);
    return false;
}
//# sourceMappingURL=node-version-check.js.map