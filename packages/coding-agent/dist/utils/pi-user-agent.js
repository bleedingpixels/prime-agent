export function getPiUserAgent(version) {
    const runtime = process.versions.bun ? `bun/${process.versions.bun}` : `node/${process.version}`;
    return `prime-agent/${version} (${process.platform}; ${runtime}; ${process.arch})`;
}
//# sourceMappingURL=pi-user-agent.js.map