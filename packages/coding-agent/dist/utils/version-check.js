import { getPiUserAgent } from "./pi-user-agent.js";
const DEFAULT_PRIME_AGENT_DOWNLOAD_BASE_URL = "https://pub-728493de92a943e2a9b2d17b4719f318.r2.dev";
const STABLE_VERSION_MANIFEST_PATH = "latest.json";
const BETA_VERSION_MANIFEST_PATH = "beta.json";
const DEFAULT_VERSION_CHECK_TIMEOUT_MS = 10000;
function comparePrereleaseIdentifiers(leftPrerelease, rightPrerelease) {
    const leftIdentifiers = leftPrerelease.split(".");
    const rightIdentifiers = rightPrerelease.split(".");
    const length = Math.max(leftIdentifiers.length, rightIdentifiers.length);
    for (let index = 0; index < length; index += 1) {
        const left = leftIdentifiers[index];
        const right = rightIdentifiers[index];
        if (left === right)
            continue;
        if (left === undefined)
            return -1;
        if (right === undefined)
            return 1;
        const leftIsNumeric = /^\d+$/.test(left);
        const rightIsNumeric = /^\d+$/.test(right);
        if (leftIsNumeric && rightIsNumeric) {
            const leftNumber = left.replace(/^0+(?=\d)/, "");
            const rightNumber = right.replace(/^0+(?=\d)/, "");
            if (leftNumber.length !== rightNumber.length)
                return leftNumber.length - rightNumber.length;
            const comparison = leftNumber.localeCompare(rightNumber);
            if (comparison !== 0)
                return comparison;
            continue;
        }
        if (leftIsNumeric)
            return -1;
        if (rightIsNumeric)
            return 1;
        return left.localeCompare(right);
    }
    return 0;
}
function parsePackageVersion(version) {
    const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/);
    if (!match) {
        return undefined;
    }
    return {
        major: Number.parseInt(match[1], 10),
        minor: Number.parseInt(match[2], 10),
        patch: Number.parseInt(match[3], 10),
        prerelease: match[4],
    };
}
export function comparePackageVersions(leftVersion, rightVersion) {
    const left = parsePackageVersion(leftVersion);
    const right = parsePackageVersion(rightVersion);
    if (!left || !right) {
        return undefined;
    }
    if (left.major !== right.major)
        return left.major - right.major;
    if (left.minor !== right.minor)
        return left.minor - right.minor;
    if (left.patch !== right.patch)
        return left.patch - right.patch;
    if (left.prerelease === right.prerelease)
        return 0;
    if (!left.prerelease)
        return 1;
    if (!right.prerelease)
        return -1;
    return comparePrereleaseIdentifiers(left.prerelease, right.prerelease);
}
export function isNewerPackageVersion(candidateVersion, currentVersion) {
    const comparison = comparePackageVersions(candidateVersion, currentVersion);
    if (comparison !== undefined) {
        return comparison > 0;
    }
    return candidateVersion.trim() !== currentVersion.trim();
}
function getPrimeAgentDownloadBaseUrl() {
    return (process.env.PRIME_AGENT_DOWNLOAD_BASE_URL?.trim() || DEFAULT_PRIME_AGENT_DOWNLOAD_BASE_URL).replace(/\/+$/, "");
}
function normalizeReleaseVersion(version) {
    return version.trim().replace(/^v/, "");
}
function getReleaseManifestPath(currentVersion) {
    const prerelease = parsePackageVersion(currentVersion)?.prerelease;
    return prerelease?.match(/^beta(?:\.|$)/) ? BETA_VERSION_MANIFEST_PATH : STABLE_VERSION_MANIFEST_PATH;
}
function resolveReleaseUrl(baseUrl, pathOrUrl) {
    const trimmed = pathOrUrl.trim();
    if (!trimmed)
        return undefined;
    try {
        return new URL(trimmed).toString();
    }
    catch {
        return `${baseUrl}/${trimmed.replace(/^\/+/, "")}`;
    }
}
export async function getLatestPiRelease(currentVersion, options = {}) {
    if (process.env.PI_SKIP_VERSION_CHECK || process.env.PI_OFFLINE)
        return undefined;
    const baseUrl = getPrimeAgentDownloadBaseUrl();
    const response = await fetch(`${baseUrl}/${getReleaseManifestPath(currentVersion)}`, {
        headers: {
            "User-Agent": getPiUserAgent(currentVersion),
            accept: "application/json",
        },
        signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_VERSION_CHECK_TIMEOUT_MS),
    });
    if (!response.ok)
        return undefined;
    const data = (await response.json());
    if (typeof data.version !== "string" || !data.version.trim()) {
        return undefined;
    }
    const packageName = typeof data.package === "string" && data.package.trim()
        ? data.package.trim()
        : typeof data.packageName === "string" && data.packageName.trim()
            ? data.packageName.trim()
            : undefined;
    const installSpec = typeof data.tarball === "string" ? resolveReleaseUrl(baseUrl, data.tarball) : undefined;
    const release = { version: normalizeReleaseVersion(data.version) };
    if (packageName) {
        release.packageName = packageName;
    }
    if (installSpec) {
        release.installSpec = installSpec;
    }
    return release;
}
export async function getLatestPiVersion(currentVersion, options = {}) {
    return (await getLatestPiRelease(currentVersion, options))?.version;
}
export async function checkForNewPiVersion(currentVersion) {
    try {
        const latestVersion = await getLatestPiVersion(currentVersion);
        if (latestVersion && isNewerPackageVersion(latestVersion, currentVersion)) {
            return latestVersion;
        }
        return undefined;
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=version-check.js.map