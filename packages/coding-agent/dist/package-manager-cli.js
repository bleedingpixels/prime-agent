import chalk from "chalk";
import { spawn } from "child_process";
import { readFileSync, rmSync, statSync } from "fs";
import { resolve, sep } from "path";
import { selectConfig } from "./cli/config-selector.js";
import { ensureInteractiveDaemonRunning, isDaemonSessionSummary, isSessionBusy, probeRunningDaemonSessions, shutdownConnectedDaemonAndWait, } from "./cli/daemon-launch.js";
import { confirmDaemonSessionLoss, pluralizeSessions } from "./cli/daemon-stop-confirm.js";
import { acquireDaemonUpdateRestartCoordinator, buildDaemonUpdateRestartReport, DAEMON_UPDATE_RESTART_COORDINATOR_FLAG, DAEMON_UPDATE_RESTART_ORIGIN_FLAG, DAEMON_UPDATE_RESTART_STATUS_FLAG, DaemonUpdateRestartCoordinatorAlreadyRunningError, DaemonUpdateRestartStatusWriter, launchDaemonUpdateRestartCoordinator, waitForActiveDaemonUpdateRestartCoordinator, } from "./cli/daemon-update-restart.js";
import { APP_NAME, CONFIG_DIR_NAME, getAgentDir, getDaemonUpdateRestartManifestPath, getLegacyDaemonUpdateRestartManifestPath, getSelfUpdateCommand, getSelfUpdateUnavailableInstruction, PACKAGE_NAME, SELF_UPDATE_INTERACTIVE_CHILD_ENV, SELF_UPDATE_NOT_ATTEMPTED_EXIT_CODE, VERSION, } from "./config.js";
import { SESSION_ACTION_RECOVERY_FORMAT_VERSION } from "./core/agent-session.js";
import { isSessionSlashCommand } from "./core/messages.js";
import { DefaultPackageManager } from "./core/package-manager.js";
import { SettingsManager } from "./core/settings-manager.js";
import { DaemonClient } from "./modes/daemon/daemon-client.js";
import { DAEMON_PROTOCOL_VERSION, DAEMON_SCHEMA_ID, DAEMON_UPDATE_RESTART_FORMAT_VERSION, isUnknownDaemonCommandError, } from "./modes/daemon/daemon-protocol.js";
import { defaultDaemonSocketPath } from "./modes/daemon/daemon-socket.js";
import { acquireDaemonShutdownAdmission, persistDaemonStartupFenceFromOwner, waitForDaemonStartupFence, } from "./modes/daemon/daemon-supervisor-ownership.js";
import { DAEMON_WORKER_ACTIVE_SESSION_ID_ENV, DAEMON_WORKER_SUPERVISOR_SOCKET_ENV, } from "./modes/daemon/daemon-worker-protocol.js";
import { shouldUseWindowsShell } from "./utils/child-process.js";
import { getLatestPiRelease, isNewerPackageVersion } from "./utils/version-check.js";
const UPDATE_RESTART_PREDECESSOR_FENCE_TIMEOUT_MS = 60_000;
export function isSelfUpdateSource(source) {
    return source === "self" || source === "pi" || source === APP_NAME;
}
function reportSettingsErrors(settingsManager, context) {
    const errors = settingsManager.drainErrors();
    for (const { scope, error } of errors) {
        console.error(chalk.yellow(`Warning (${context}, ${scope} settings): ${error.message}`));
        if (error.stack) {
            console.error(chalk.dim(error.stack));
        }
    }
}
function getPackageCommandUsage(command) {
    switch (command) {
        case "install":
            return `${APP_NAME} package install <source> [--local]`;
        case "remove":
            return `${APP_NAME} package remove <source> [--local]`;
        case "update":
            return `${APP_NAME} update [--force] or ${APP_NAME} package update [source]`;
        case "list":
            return `${APP_NAME} package list`;
    }
}
function printPackageCommandHelp(command) {
    switch (command) {
        case "install":
            console.log(`${chalk.bold("Usage:")}
  ${getPackageCommandUsage("install")}

Install a package and add it to settings.

Options:
  --local    Install project-locally (${CONFIG_DIR_NAME}/settings.json)

Examples:
  ${APP_NAME} package install npm:@foo/bar
  ${APP_NAME} package install git:github.com/user/repo
  ${APP_NAME} package install git:git@github.com:user/repo
  ${APP_NAME} package install https://github.com/user/repo
  ${APP_NAME} package install ssh://git@github.com/user/repo
  ${APP_NAME} package install ./local/path
`);
            return;
        case "remove":
            console.log(`${chalk.bold("Usage:")}
  ${getPackageCommandUsage("remove")}

Remove a package and its source from settings.

Options:
  --local    Remove from project settings (${CONFIG_DIR_NAME}/settings.json)

Examples:
  ${APP_NAME} package remove npm:@foo/bar
`);
            return;
        case "update":
            console.log(`${chalk.bold("Usage:")}
  ${getPackageCommandUsage("update")}

Update ${APP_NAME} or installed packages.

Options:
  --self                  Update ${APP_NAME} only
  --extensions            Update installed packages only
  --extension <source>    Update one package only
  --force                 Reinstall ${APP_NAME} even if the current version is latest
  --daemon-socket <path>  Restart the daemon listening on this exact socket

Commands:
  ${APP_NAME} update                Update ${APP_NAME}
  ${APP_NAME} package update        Update installed packages
  ${APP_NAME} package update <source> Update one package
`);
            return;
        case "list":
            console.log(`${chalk.bold("Usage:")}
  ${getPackageCommandUsage("list")}

List installed packages from user and project settings.
`);
            return;
    }
}
function parsePackageCommand(args) {
    const [rawCommand, ...rest] = args;
    let command;
    if (rawCommand === "uninstall") {
        command = "remove";
    }
    else if (rawCommand === "install" || rawCommand === "remove" || rawCommand === "update" || rawCommand === "list") {
        command = rawCommand;
    }
    if (!command) {
        return undefined;
    }
    let local = false;
    let force = false;
    let help = false;
    let invalidOption;
    let invalidArgument;
    let missingOptionValue;
    let conflictingOptions;
    let source;
    let selfFlag = false;
    let extensionsFlag = false;
    let extensionFlagSource;
    let daemonSocketPath;
    let restartCoordinator = false;
    let restartStatusPath;
    let restartOriginActiveSessionId;
    for (let index = 0; index < rest.length; index++) {
        const arg = rest[index];
        if (arg === "-h" || arg === "--help") {
            help = true;
            continue;
        }
        if (arg === "--local") {
            if (command === "install" || command === "remove") {
                local = true;
            }
            else {
                invalidOption = invalidOption ?? arg;
            }
            continue;
        }
        if (arg === "--self") {
            if (command === "update") {
                selfFlag = true;
            }
            else {
                invalidOption = invalidOption ?? arg;
            }
            continue;
        }
        if (arg === "--extensions") {
            if (command === "update") {
                extensionsFlag = true;
            }
            else {
                invalidOption = invalidOption ?? arg;
            }
            continue;
        }
        if (arg === "--force") {
            if (command === "update") {
                force = true;
            }
            else {
                invalidOption = invalidOption ?? arg;
            }
            continue;
        }
        if (arg === "--daemon-socket") {
            if (command !== "update") {
                invalidOption = invalidOption ?? arg;
                continue;
            }
            const value = rest[index + 1];
            if (!value || value.startsWith("-")) {
                missingOptionValue = missingOptionValue ?? arg;
            }
            else if (daemonSocketPath) {
                conflictingOptions = conflictingOptions ?? "--daemon-socket can only be provided once";
                index++;
            }
            else {
                daemonSocketPath = value;
                index++;
            }
            continue;
        }
        if (arg === DAEMON_UPDATE_RESTART_COORDINATOR_FLAG) {
            if (command === "update") {
                restartCoordinator = true;
            }
            else {
                invalidOption = invalidOption ?? arg;
            }
            continue;
        }
        if (arg === DAEMON_UPDATE_RESTART_STATUS_FLAG || arg === DAEMON_UPDATE_RESTART_ORIGIN_FLAG) {
            if (command !== "update") {
                invalidOption = invalidOption ?? arg;
                continue;
            }
            const value = rest[index + 1];
            if (!value || value.startsWith("-")) {
                missingOptionValue = missingOptionValue ?? arg;
                continue;
            }
            if (arg === DAEMON_UPDATE_RESTART_STATUS_FLAG) {
                restartStatusPath = value;
            }
            else {
                restartOriginActiveSessionId = value;
            }
            index++;
            continue;
        }
        if (arg === "--extension") {
            if (command !== "update") {
                invalidOption = invalidOption ?? arg;
                continue;
            }
            const value = rest[index + 1];
            if (!value || value.startsWith("-")) {
                missingOptionValue = missingOptionValue ?? arg;
            }
            else if (extensionFlagSource) {
                conflictingOptions = conflictingOptions ?? "--extension can only be provided once";
                index++;
            }
            else {
                extensionFlagSource = value;
                index++;
            }
            continue;
        }
        if (arg.startsWith("-")) {
            invalidOption = invalidOption ?? arg;
            continue;
        }
        if (!source) {
            source = arg;
        }
        else {
            invalidArgument = invalidArgument ?? arg;
        }
    }
    let updateTarget;
    if (command === "update") {
        if (extensionFlagSource) {
            if (selfFlag || extensionsFlag) {
                conflictingOptions = conflictingOptions ?? "--extension cannot be combined with --self or --extensions";
            }
            if (source) {
                conflictingOptions = conflictingOptions ?? "--extension cannot be combined with a positional source";
            }
            updateTarget = { type: "extensions", source: extensionFlagSource };
        }
        else if (source) {
            const sourceIsSelf = isSelfUpdateSource(source);
            if (sourceIsSelf) {
                updateTarget = extensionsFlag ? { type: "all" } : { type: "self" };
            }
            else {
                if (extensionsFlag || selfFlag) {
                    conflictingOptions =
                        conflictingOptions ?? "positional update targets cannot be combined with --self or --extensions";
                }
                updateTarget = { type: "extensions", source };
            }
        }
        else if (selfFlag && extensionsFlag) {
            updateTarget = { type: "all" };
        }
        else if (selfFlag) {
            updateTarget = { type: "self" };
        }
        else if (extensionsFlag) {
            updateTarget = { type: "extensions" };
        }
        else {
            updateTarget = { type: "all" };
        }
    }
    return {
        command,
        source,
        updateTarget,
        local,
        force,
        help,
        daemonSocketPath,
        restartCoordinator,
        restartStatusPath,
        restartOriginActiveSessionId,
        invalidOption,
        invalidArgument,
        missingOptionValue,
        conflictingOptions,
    };
}
function updateTargetIncludesSelf(target) {
    return target.type === "all" || target.type === "self";
}
function updateTargetIncludesExtensions(target) {
    return target.type === "all" || target.type === "extensions";
}
export function resolveUpdateDaemonSocketPath(explicitSocketPath) {
    return explicitSocketPath ?? process.env[DAEMON_WORKER_SUPERVISOR_SOCKET_ENV] ?? defaultDaemonSocketPath();
}
function reportDaemonUpdateRestartStatus(status) {
    const report = buildDaemonUpdateRestartReport(status);
    for (const message of report.info) {
        console.log(chalk.green(message));
    }
    for (const warning of report.warnings) {
        console.error(chalk.yellow(`Warning: ${warning}`));
    }
}
function printSelfUpdateUnavailable(npmCommand, updateSpec = PACKAGE_NAME, updatePackageName = updateSpec) {
    console.error(`error: ${APP_NAME} cannot self-update this installation.`);
    console.error(getSelfUpdateUnavailableInstruction(PACKAGE_NAME, npmCommand, updateSpec, updatePackageName));
    const entrypoint = process.argv[1];
    if (entrypoint) {
        console.error("");
        console.error(`Location of pi executable: ${entrypoint}`);
    }
}
function printSelfUpdateFallback(command) {
    console.error(chalk.dim(`If this keeps failing, run this command yourself: ${command.display}`));
}
function setSelfUpdateNoChangeExitCode() {
    process.exitCode =
        process.env[SELF_UPDATE_INTERACTIVE_CHILD_ENV] === "1" ? SELF_UPDATE_NOT_ATTEMPTED_EXIT_CODE : undefined;
}
async function getSelfUpdatePlan(force) {
    try {
        const latestRelease = await getLatestPiRelease(VERSION);
        const packageName = latestRelease?.packageName ?? PACKAGE_NAME;
        const installSpec = latestRelease?.installSpec ?? packageName;
        const packageRenameRequiresUpdate = !latestRelease?.installSpec && packageName !== PACKAGE_NAME;
        if (force ||
            !latestRelease ||
            packageRenameRequiresUpdate ||
            isNewerPackageVersion(latestRelease.version, VERSION)) {
            return { installSpec, packageName, shouldRun: true, targetVersion: latestRelease?.version };
        }
    }
    catch {
        return { installSpec: PACKAGE_NAME, packageName: PACKAGE_NAME, shouldRun: true };
    }
    console.log(chalk.green(`${APP_NAME} is already up to date (v${VERSION})`));
    return { installSpec: PACKAGE_NAME, packageName: PACKAGE_NAME, shouldRun: false };
}
async function runSelfUpdate(command) {
    console.log(chalk.dim(`Updating ${APP_NAME} with ${command.display}...`));
    for (const step of command.steps ?? [command]) {
        await new Promise((resolve, reject) => {
            // Windows package managers are commonly .cmd shims. Use the shell so Node can execute them.
            const child = spawn(step.command, step.args, {
                stdio: "inherit",
                shell: shouldUseWindowsShell(step.command),
            });
            child.on("error", (error) => {
                reject(error);
            });
            child.on("close", (code, signal) => {
                if (code === 0) {
                    resolve();
                }
                else if (signal) {
                    reject(new Error(`${step.display} terminated by signal ${signal}`));
                }
                else {
                    reject(new Error(`${step.display} exited with code ${code ?? "unknown"}`));
                }
            });
        });
    }
}
const UPDATE_RESTART_CONTINUATION_PROMPT = "Prime Agent restarted after an update. Continue the interrupted task from the saved transcript and restored tool/kernel state. Inspect current state before retrying commands when needed.";
const UPDATE_SESSION_LOSS_COPY = {
    busyDetail(count) {
        const { noun, pronoun } = pluralizeSessions(count);
        return `Prime Agent has ${count} busy ${noun}. After the update installs, it will stop ${pronoun}, restart its background service, and resume interrupted work.`;
    },
    unlistableDetail: "Running agents could not be listed. After the update installs, Prime Agent will stop resident agents, restart its background service, and resume interrupted work where possible.",
    question: "Continue?",
    nonTtyHint: "Re-run with --force to proceed.",
};
// Returns false when the update should be aborted to avoid terminating live sessions.
function confirmDaemonSessionLossBeforeUpdate(probe, force) {
    return confirmDaemonSessionLoss(probe, { force, copy: UPDATE_SESSION_LOSS_COPY });
}
function daemonProbeMayHaveBusySessions(probe) {
    return (probe.reachable &&
        (probe.activeSessions === undefined ||
            (probe.busyClientOwnedSessionCount ?? 0) > 0 ||
            probe.activeSessions.some(isSessionBusy)));
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isStringEnum(value, allowed) {
    return typeof value === "string" && allowed.includes(value);
}
function readString(value, fieldName) {
    if (typeof value !== "string") {
        throw new Error(`Daemon update restart response is missing ${fieldName}`);
    }
    return value;
}
function readOptionalString(value, fieldName) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new Error(`Daemon update restart response is missing ${fieldName}`);
    }
    return value;
}
function readBoolean(value, fieldName) {
    if (typeof value !== "boolean") {
        throw new Error(`Daemon update restart response is missing ${fieldName}`);
    }
    return value;
}
function readNumber(value, fieldName) {
    if (typeof value !== "number") {
        throw new Error(`Daemon update restart response is missing ${fieldName}`);
    }
    return value;
}
function readOptionalStringRecord(value, fieldName) {
    if (value === undefined) {
        return undefined;
    }
    if (!isRecord(value) || !Object.values(value).every((entry) => typeof entry === "string")) {
        throw new Error(`Daemon update restart response is missing ${fieldName}`);
    }
    return value;
}
function isMessageContentBlock(value) {
    return (isRecord(value) &&
        ((value.type === "text" && typeof value.text === "string") ||
            (value.type === "image" && typeof value.data === "string" && typeof value.mimeType === "string")));
}
function isImageContent(value) {
    return isMessageContentBlock(value) && value.type === "image";
}
function isCustomMessage(value) {
    return (isRecord(value) &&
        value.role === "custom" &&
        typeof value.customType === "string" &&
        (typeof value.content === "string" ||
            (Array.isArray(value.content) && value.content.every(isMessageContentBlock))) &&
        typeof value.display === "boolean" &&
        typeof value.timestamp === "number");
}
function isUserMessage(value) {
    return (isRecord(value) &&
        value.role === "user" &&
        (typeof value.content === "string" ||
            (Array.isArray(value.content) && value.content.every(isMessageContentBlock))) &&
        typeof value.timestamp === "number");
}
function isQueuedAgentMessage(value) {
    return isUserMessage(value) || isCustomMessage(value);
}
function readCustomMessages(value, fieldName) {
    if (value === undefined)
        return [];
    if (!Array.isArray(value) || !value.every(isCustomMessage)) {
        throw new Error(`Daemon update restart response is missing ${fieldName}`);
    }
    return value;
}
function isSessionActionRecoveryAction(value) {
    if (!isRecord(value) ||
        typeof value.id !== "string" ||
        typeof value.source !== "string" ||
        (value.delivery !== "next_turn_boundary" && value.delivery !== "when_run_idle") ||
        (value.wake !== "immediate" && value.wake !== "on_lower_boundary" && value.wake !== "external_resume") ||
        !isRecord(value.payload) ||
        typeof value.payload.text !== "string" ||
        (value.payload.images !== undefined &&
            (!Array.isArray(value.payload.images) || !value.payload.images.every(isImageContent)))) {
        return false;
    }
    if (value.payload.kind === "session_command")
        return isSessionSlashCommand(value.payload.command);
    return (value.payload.kind === "turn" &&
        Array.isArray(value.payload.records) &&
        value.payload.records.filter((record) => isRecord(record) && record.role === "primary").length === 1 &&
        value.payload.records.every((record) => isRecord(record) &&
            typeof record.id === "string" &&
            (record.role === "primary" || record.role === "prefix" || record.role === "next_turn") &&
            record.ownerActionId === value.id &&
            isQueuedAgentMessage(record.message)) &&
        (value.payload.content === undefined ||
            (Array.isArray(value.payload.content) && value.payload.content.every(isMessageContentBlock))) &&
        (value.payload.customMessage === undefined || isCustomMessage(value.payload.customMessage)) &&
        isRecord(value.payload.executionPolicy) &&
        isRecord(value.payload.executionPolicy.preparation) &&
        isStringEnum(value.payload.executionPolicy.preparation.initialRefineBarrier, ["always", "ifInFlight", "skip"]) &&
        typeof value.payload.executionPolicy.preparation.flushPendingBashBeforeValidation === "boolean" &&
        typeof value.payload.executionPolicy.preparation.validateModelAndAuth === "boolean" &&
        typeof value.payload.executionPolicy.preparation.awaitPendingModelSelection === "boolean" &&
        isStringEnum(value.payload.executionPolicy.preparation.preTurnCompaction, [
            "beforeModelSelection",
            "afterModelSelection",
            "skip",
        ]) &&
        isStringEnum(value.payload.executionPolicy.preparation.finalRefineBarrier, ["always", "ifInFlight", "skip"]) &&
        typeof value.payload.executionPolicy.runBeforeAgentStart === "boolean" &&
        isStringEnum(value.payload.executionPolicy.nextTurnContextTiming, ["preparation", "commit", "skip"]) &&
        typeof value.payload.executionPolicy.preserveEmptyExtensionPrompt === "boolean" &&
        typeof value.payload.executionPolicy.completionIncludesRetryChain === "boolean" &&
        typeof value.payload.queueVisible === "boolean" &&
        typeof value.payload.acceptedAgentMessage === "boolean" &&
        typeof value.payload.acceptedBeforeCompletion === "boolean");
}
function parseSessionActionRecoverySnapshot(value) {
    if (!isRecord(value))
        throw new Error("Daemon update restart response contains invalid session actions");
    if (value.formatVersion !== SESSION_ACTION_RECOVERY_FORMAT_VERSION) {
        throw new Error(`Unsupported session action recovery format version: ${String(value.formatVersion)}`);
    }
    if (!Array.isArray(value.actions) || !value.actions.every(isSessionActionRecoveryAction)) {
        throw new Error("Daemon update restart response is missing session actions");
    }
    return {
        formatVersion: SESSION_ACTION_RECOVERY_FORMAT_VERSION,
        actions: value.actions,
    };
}
function parseDaemonUpdateRestartRuntimeMetadata(value) {
    if (value === undefined) {
        return undefined;
    }
    if (!isRecord(value)) {
        throw new Error("Daemon update restart response contains invalid runtime metadata");
    }
    const kind = readString(value.kind, "runtimeMetadata.kind");
    if (kind !== "top-level" && kind !== "subagent") {
        throw new Error("Daemon update restart response contains invalid runtime metadata kind");
    }
    const parentActiveSessionId = readOptionalString(value.parentActiveSessionId, "runtimeMetadata.parentActiveSessionId");
    const parentSessionId = readOptionalString(value.parentSessionId, "runtimeMetadata.parentSessionId");
    const parentSessionFile = readOptionalString(value.parentSessionFile, "runtimeMetadata.parentSessionFile");
    const rlmChildId = readOptionalString(value.rlmChildId, "runtimeMetadata.rlmChildId");
    const rlmParentNodeId = readOptionalString(value.rlmParentNodeId, "runtimeMetadata.rlmParentNodeId");
    const prompt = readOptionalString(value.prompt, "runtimeMetadata.prompt");
    const spawnCode = readOptionalString(value.spawnCode, "runtimeMetadata.spawnCode");
    const sessionDir = readOptionalString(value.sessionDir, "runtimeMetadata.sessionDir");
    return {
        kind,
        createdAt: readNumber(value.createdAt, "runtimeMetadata.createdAt"),
        ...(parentActiveSessionId ? { parentActiveSessionId } : {}),
        ...(parentSessionId ? { parentSessionId } : {}),
        ...(parentSessionFile ? { parentSessionFile } : {}),
        ...(rlmChildId ? { rlmChildId } : {}),
        ...(rlmParentNodeId ? { rlmParentNodeId } : {}),
        ...(prompt ? { prompt } : {}),
        ...(spawnCode ? { spawnCode } : {}),
        ...(sessionDir ? { sessionDir } : {}),
    };
}
function parseDaemonUpdateRestartSession(value) {
    if (!isRecord(value)) {
        throw new Error("Daemon update restart response contains an invalid session");
    }
    const queue = value.queue;
    if (!isRecord(queue)) {
        throw new Error("Daemon update restart response contains an invalid queue");
    }
    const config = value.config;
    if (!isRecord(config)) {
        throw new Error("Daemon update restart response contains an invalid session config");
    }
    const clientEnv = readOptionalStringRecord(value.clientEnv, "clientEnv");
    const runtimeMetadata = parseDaemonUpdateRestartRuntimeMetadata(value.runtimeMetadata);
    return {
        activeSessionId: readString(value.activeSessionId, "activeSessionId"),
        sessionId: readString(value.sessionId, "sessionId"),
        sessionFile: readString(value.sessionFile, "sessionFile"),
        cwd: readString(value.cwd, "cwd"),
        config: config,
        ...(runtimeMetadata ? { runtimeMetadata } : {}),
        ...(clientEnv ? { clientEnv } : {}),
        queue: {
            actions: parseSessionActionRecoverySnapshot(queue.actions),
            nextTurn: readCustomMessages(queue.nextTurn, "queue.nextTurn"),
        },
        shouldResume: readBoolean(value.shouldResume, "shouldResume"),
        wasStreaming: readBoolean(value.wasStreaming, "wasStreaming"),
        wasCompacting: readBoolean(value.wasCompacting, "wasCompacting"),
        wasBashRunning: readBoolean(value.wasBashRunning, "wasBashRunning"),
        hadRunningRlmChildren: readBoolean(value.hadRunningRlmChildren, "hadRunningRlmChildren"),
        wasRetrying: readBoolean(value.wasRetrying, "wasRetrying"),
        hadAcceptedPromptInFlight: readBoolean(value.hadAcceptedPromptInFlight, "hadAcceptedPromptInFlight"),
    };
}
function parseDaemonUpdateRestartManifest(value) {
    if (!isRecord(value)) {
        throw new Error("Daemon update restart response is invalid");
    }
    if (value.formatVersion !== DAEMON_UPDATE_RESTART_FORMAT_VERSION) {
        throw new Error(`Unsupported daemon update restart format version: ${String(value.formatVersion)}`);
    }
    const sessions = value.sessions;
    if (!Array.isArray(sessions)) {
        throw new Error("Daemon update restart response is missing sessions");
    }
    return {
        formatVersion: DAEMON_UPDATE_RESTART_FORMAT_VERSION,
        createdAt: readString(value.createdAt, "createdAt"),
        sessions: sessions.map(parseDaemonUpdateRestartSession),
    };
}
function clearPreparedDaemonUpdateRestartManifest(socketPath, agentDir) {
    for (const manifestPath of [
        getDaemonUpdateRestartManifestPath(socketPath, agentDir),
        getLegacyDaemonUpdateRestartManifestPath(agentDir),
    ]) {
        try {
            rmSync(manifestPath, { force: true });
        }
        catch {
            // Best effort only; the mtime guard below prevents stale fallback use.
        }
    }
}
function readPreparedDaemonUpdateRestartManifest(socketPath, agentDir, notBeforeMs) {
    for (const manifestPath of [
        getDaemonUpdateRestartManifestPath(socketPath, agentDir),
        getLegacyDaemonUpdateRestartManifestPath(agentDir),
    ]) {
        let modifiedAt;
        try {
            modifiedAt = statSync(manifestPath).mtimeMs;
        }
        catch {
            continue;
        }
        if (notBeforeMs !== undefined && modifiedAt < notBeforeMs - 1000) {
            continue;
        }
        const parsed = JSON.parse(readFileSync(manifestPath, "utf-8"));
        return parseDaemonUpdateRestartManifest(parsed);
    }
    return undefined;
}
function tryReadPreparedDaemonUpdateRestartManifest(socketPath, agentDir) {
    try {
        return readPreparedDaemonUpdateRestartManifest(socketPath, agentDir);
    }
    catch {
        clearPreparedDaemonUpdateRestartManifest(socketPath, agentDir);
        return undefined;
    }
}
function hasRestorableDaemonUpdateRestart(manifest) {
    return manifest !== undefined && manifest.sessions.length > 0;
}
function responseHasActiveDaemonSessions(data) {
    if (!isRecord(data) || !Array.isArray(data.sessions)) {
        return true;
    }
    return data.sessions.length > 0;
}
function hasFixedDaemonSupervisorOwnerIdentity(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (typeof value.supervisorGeneration === "string" &&
        typeof value.supervisorOwnerToken === "string" &&
        Number.isInteger(value.supervisorPid) &&
        value.supervisorPid > 0 &&
        typeof value.supervisorProcessStartId === "string" &&
        typeof value.supervisorSocketPath === "string");
}
async function prepareConnectedDaemonUpdateRestart(client, socketPath, agentDir, hello) {
    const pendingManifest = tryReadPreparedDaemonUpdateRestartManifest(socketPath, agentDir);
    let startedAt;
    let fixedOwnerIdentity;
    let fencePersistenceStarted = false;
    const persistPreparedRestartFence = async () => {
        const currentHello = client.hello;
        if (hasFixedDaemonSupervisorOwnerIdentity(currentHello)) {
            fixedOwnerIdentity = currentHello;
        }
        if (!fixedOwnerIdentity) {
            return;
        }
        fencePersistenceStarted = true;
        await persistDaemonStartupFenceFromOwner(socketPath, fixedOwnerIdentity);
    };
    try {
        if (hasFixedDaemonSupervisorOwnerIdentity(hello)) {
            fixedOwnerIdentity = hello;
        }
        if (pendingManifest && pendingManifest.sessions.length > 0) {
            const listResponse = await client.request({ type: "list" }, 30000);
            if (listResponse.success && !responseHasActiveDaemonSessions(listResponse.data)) {
                await persistPreparedRestartFence();
                return pendingManifest;
            }
        }
        clearPreparedDaemonUpdateRestartManifest(socketPath, agentDir);
        startedAt = Date.now();
        const response = await client.request({ type: "prepare_update_restart" }, 120000);
        if (!response.success) {
            throw new Error(response.error);
        }
        const manifest = parseDaemonUpdateRestartManifest(response.data);
        await persistPreparedRestartFence();
        return manifest;
    }
    catch (error) {
        if (fencePersistenceStarted) {
            throw error;
        }
        if (startedAt !== undefined) {
            const fallback = readPreparedDaemonUpdateRestartManifest(socketPath, agentDir, startedAt);
            if (fallback) {
                await persistPreparedRestartFence();
                return fallback;
            }
        }
        throw error;
    }
}
export async function prepareDaemonUpdateRestart(socketPath, agentDir) {
    const pendingManifest = tryReadPreparedDaemonUpdateRestartManifest(socketPath, agentDir);
    const client = new DaemonClient(socketPath);
    let connected = false;
    try {
        await client.connect(1000);
        connected = true;
        const hello = await client.waitForHello(2000).catch(() => undefined);
        return await prepareConnectedDaemonUpdateRestart(client, socketPath, agentDir, hello);
    }
    catch (error) {
        if (!connected && pendingManifest && pendingManifest.sessions.length > 0) {
            return pendingManifest;
        }
        throw error;
    }
    finally {
        client.close();
    }
}
function readCreatedActiveSessionId(value) {
    if (!isDaemonSessionSummary(value) || typeof value.activeSessionId !== "string") {
        throw new Error("Daemon returned an invalid session create response");
    }
    return value.activeSessionId;
}
async function restoreNextTurnMessages(client, activeSessionId, sessionFile, messages) {
    if (messages.length === 0) {
        return true;
    }
    const response = await client.request({ type: "restore_next_turn", activeSessionId, messages: [...messages] }, 30000);
    if (!response.success) {
        console.error(chalk.yellow(`Warning: could not restore pending context for ${sessionFile}: ${response.error}`));
        return false;
    }
    return true;
}
function remapDaemonUpdateRestartRuntimeMetadata(session, restoredActiveSessionIds) {
    const metadata = session.runtimeMetadata;
    if (!metadata) {
        return undefined;
    }
    if (metadata.kind !== "subagent") {
        return metadata;
    }
    const { parentActiveSessionId: oldParentActiveSessionId, ...runtimeMetadata } = metadata;
    const parentActiveSessionId = oldParentActiveSessionId
        ? restoredActiveSessionIds.get(oldParentActiveSessionId)
        : undefined;
    return {
        ...runtimeMetadata,
        ...(parentActiveSessionId ? { parentActiveSessionId } : {}),
    };
}
async function restoreDaemonUpdateRestartSession(client, session, restoredActiveSessionIds, restartOriginActiveSessionId) {
    const runtimeMetadata = remapDaemonUpdateRestartRuntimeMetadata(session, restoredActiveSessionIds);
    const createResponse = await client.request({
        type: "create",
        sessionPath: session.sessionFile,
        config: session.config,
        ...(runtimeMetadata ? { runtimeMetadata } : {}),
        ...(session.clientEnv ? { env: session.clientEnv } : {}),
    }, 120000);
    if (!createResponse.success) {
        console.error(chalk.yellow(`Warning: could not restore ${session.sessionFile}: ${createResponse.error}`));
        return { restored: false, resumed: false, failureMessage: createResponse.error };
    }
    const activeSessionId = readCreatedActiveSessionId(createResponse.data);
    restoredActiveSessionIds.set(session.activeSessionId, activeSessionId);
    if (session.activeSessionId === restartOriginActiveSessionId) {
        try {
            const noticeResponse = await client.request({
                type: "append_custom_message",
                activeSessionId,
                message: {
                    customType: "prime-agent.update_complete",
                    content: `Prime Agent updated to v${VERSION}. This daemon session was restored after the update.`,
                    display: true,
                    details: { version: VERSION },
                },
            }, 30000);
            if (!noticeResponse.success) {
                console.error(chalk.yellow(`Warning: could not record update completion in ${session.sessionFile}: ${noticeResponse.error}`));
            }
        }
        catch (error) {
            console.error(chalk.yellow(`Warning: could not record update completion in ${session.sessionFile}: ${formatUnknownError(error)}`));
        }
    }
    await restoreNextTurnMessages(client, activeSessionId, session.sessionFile, session.queue.nextTurn);
    if (!session.shouldResume)
        return { restored: true, resumed: false };
    const needsContinuationPrompt = session.wasStreaming ||
        session.wasCompacting ||
        session.wasBashRunning ||
        session.hadRunningRlmChildren ||
        session.wasRetrying ||
        session.hadAcceptedPromptInFlight;
    let resumedSession = false;
    let restoredQueuedWork = false;
    if (session.queue.actions.actions.length > 0) {
        const response = await client.request({ type: "restore_actions", activeSessionId, snapshot: session.queue.actions }, 30000);
        if (response.success) {
            restoredQueuedWork = true;
        }
        else {
            console.error(chalk.yellow(`Warning: could not restore queued actions for ${session.sessionFile}: ${response.error}`));
        }
    }
    const restoredAcceptedTurn = restoredQueuedWork &&
        session.queue.actions.actions.some((action) => action.payload.kind === "turn" && !action.payload.queueVisible && action.payload.acceptedBeforeCompletion);
    if (needsContinuationPrompt && !restoredAcceptedTurn) {
        const promptResponse = await client.request({
            type: "prompt",
            activeSessionId,
            message: UPDATE_RESTART_CONTINUATION_PROMPT,
            expandPromptTemplates: false,
        }, 120000);
        if (!promptResponse.success) {
            console.error(chalk.yellow(`Warning: could not resume ${session.sessionFile}: ${promptResponse.error}`));
        }
        else {
            resumedSession = true;
        }
    }
    if (!resumedSession && restoredQueuedWork) {
        const response = await client.request({ type: "resume_queue", activeSessionId }, 30000);
        if (response.success) {
            resumedSession = true;
        }
        else {
            console.error(chalk.yellow(`Warning: could not resume queued work for ${session.sessionFile}: ${response.error}`));
        }
    }
    return { restored: true, resumed: resumedSession };
}
async function restoreDaemonUpdateRestart(socketPath, manifest, restartOriginActiveSessionId, onProgress) {
    const restoredActiveSessionIds = new Map();
    if (manifest.sessions.length === 0) {
        return { total: 0, restored: 0, resumed: 0, failed: 0, failures: [] };
    }
    const client = new DaemonClient(socketPath);
    let restored = 0;
    let resumed = 0;
    const failures = [];
    try {
        await client.connect(10000);
        for (const session of manifest.sessions) {
            try {
                const result = await restoreDaemonUpdateRestartSession(client, session, restoredActiveSessionIds, restartOriginActiveSessionId);
                if (result.restored) {
                    restored++;
                }
                if (result.resumed) {
                    resumed++;
                }
                if (!result.restored) {
                    failures.push({
                        sessionFile: session.sessionFile,
                        message: result.failureMessage ?? "unknown restore error",
                    });
                }
            }
            catch (error) {
                const message = formatUnknownError(error);
                console.error(chalk.yellow(`Warning: could not restore ${session.sessionFile}: ${message}`));
                failures.push({ sessionFile: session.sessionFile, message });
            }
            onProgress?.({
                total: manifest.sessions.length,
                restored,
                resumed,
                failed: failures.length,
                failures: [...failures],
            });
        }
    }
    finally {
        client.close();
    }
    console.log(chalk.green(`Restored ${restored} agent session${restored === 1 ? "" : "s"}`));
    if (resumed > 0) {
        console.log(chalk.green(`Resumed ${resumed} interrupted session${resumed === 1 ? "" : "s"}`));
    }
    return {
        total: manifest.sessions.length,
        restored,
        resumed,
        failed: manifest.sessions.length - restored,
        failures,
    };
}
function formatUnknownError(error) {
    return error instanceof Error ? error.message : String(error);
}
function processIdentityFromDaemonHello(hello) {
    if (!hello?.supervisorPid || !Number.isInteger(hello.supervisorPid) || hello.supervisorPid <= 0) {
        return undefined;
    }
    return {
        pid: hello.supervisorPid,
        ...(hello.supervisorProcessStartId ? { processStartId: hello.supervisorProcessStartId } : {}),
        ...(hello.supervisorGeneration ? { supervisorGeneration: hello.supervisorGeneration } : {}),
        ...(hello.supervisorOwnerToken ? { supervisorOwnerToken: hello.supervisorOwnerToken } : {}),
    };
}
function normalizedSocketPath(socketPath) {
    return process.platform === "win32" ? socketPath.toLowerCase() : resolve(socketPath);
}
function validateReplacementDaemon(socketPath, hello, predecessor) {
    if (hello.protocol.version !== DAEMON_PROTOCOL_VERSION ||
        hello.schemaId !== DAEMON_SCHEMA_ID ||
        hello.appVersion !== VERSION) {
        throw new Error(`Replacement daemon is v${hello.appVersion}/proto${hello.protocol.version}/schema ${hello.schemaId ?? "legacy"}, ` +
            `expected v${VERSION}/proto${DAEMON_PROTOCOL_VERSION}/schema ${DAEMON_SCHEMA_ID}`);
    }
    if (!hello.supervisorSocketPath ||
        normalizedSocketPath(hello.supervisorSocketPath) !== normalizedSocketPath(socketPath)) {
        throw new Error(`Replacement daemon identity does not match ${socketPath}`);
    }
    const successor = processIdentityFromDaemonHello(hello);
    if (!successor?.supervisorGeneration || !successor.supervisorOwnerToken) {
        throw new Error(`Replacement daemon on ${socketPath} did not provide an identity fence`);
    }
    if (predecessor &&
        ((predecessor.supervisorGeneration !== undefined &&
            successor.supervisorGeneration === predecessor.supervisorGeneration) ||
            (predecessor.supervisorOwnerToken !== undefined &&
                successor.supervisorOwnerToken === predecessor.supervisorOwnerToken) ||
            (successor.pid === predecessor.pid &&
                predecessor.processStartId !== undefined &&
                successor.processStartId === predecessor.processStartId))) {
        throw new Error(`Replacement daemon on ${socketPath} still has the predecessor identity`);
    }
    return successor;
}
export async function runDaemonUpdateRestartCoordinator(options) {
    const statusWriter = new DaemonUpdateRestartStatusWriter(options.statusPath, `${process.pid}-${Date.now()}`, options.socketPath);
    const stopStatusHeartbeat = statusWriter.startHeartbeat();
    let lease;
    let shutdownAdmission;
    let connectedClient;
    let manifest;
    try {
        try {
            lease = await acquireDaemonUpdateRestartCoordinator({
                requestId: statusWriter.current().requestId,
                socketPath: options.socketPath,
                statusPath: options.statusPath,
            });
        }
        catch (error) {
            if (!(error instanceof DaemonUpdateRestartCoordinatorAlreadyRunningError)) {
                throw error;
            }
            const activeStatus = await waitForActiveDaemonUpdateRestartCoordinator(error.record);
            statusWriter.update({
                phase: activeStatus.phase,
                counts: activeStatus.counts,
                ...(activeStatus.predecessor ? { predecessor: activeStatus.predecessor } : {}),
                ...(activeStatus.successor ? { successor: activeStatus.successor } : {}),
                ...(activeStatus.failures ? { failures: activeStatus.failures } : {}),
                ...(activeStatus.message ? { message: activeStatus.message } : {}),
            });
            return statusWriter.current();
        }
        shutdownAdmission = await acquireDaemonShutdownAdmission();
        const daemonProbe = await probeRunningDaemonSessions(options.socketPath);
        const reportRestoreProgress = (progress) => {
            const { failures, ...counts } = progress;
            statusWriter.update({ counts, failures });
        };
        let predecessor;
        if (daemonProbe.reachable) {
            connectedClient = new DaemonClient(options.socketPath);
            await connectedClient.connect(1000);
            const hello = await connectedClient.waitForHello(2000);
            predecessor = processIdentityFromDaemonHello(hello);
            statusWriter.update({ phase: "preparing", ...(predecessor ? { predecessor } : {}) });
            try {
                manifest = await prepareConnectedDaemonUpdateRestart(connectedClient, options.socketPath, options.agentDir, hello);
            }
            catch (error) {
                const daemonLacksPrepareCommand = isUnknownDaemonCommandError(error, "prepare_update_restart");
                if (daemonProbeMayHaveBusySessions(daemonProbe) || !daemonLacksPrepareCommand) {
                    throw new Error(`Could not prepare daemon sessions for automatic resume; the previous daemon is still running (${formatUnknownError(error)})`);
                }
            }
            statusWriter.update({
                phase: "stopping",
                counts: {
                    total: manifest?.sessions.length ?? 0,
                    restored: 0,
                    resumed: 0,
                    failed: 0,
                },
            });
            await shutdownAdmission.assertOrRenew();
            const stopped = await shutdownConnectedDaemonAndWait(connectedClient, options.socketPath, 10000, hello);
            connectedClient = undefined;
            if (!stopped) {
                const remainingDaemon = await probeRunningDaemonSessions(options.socketPath);
                if (remainingDaemon.reachable) {
                    if (manifest) {
                        try {
                            const restoreResult = await restoreDaemonUpdateRestart(options.socketPath, manifest, options.originActiveSessionId, reportRestoreProgress);
                            const { failures: restoreFailures, ...counts } = restoreResult;
                            clearPreparedDaemonUpdateRestartManifest(options.socketPath, options.agentDir);
                            statusWriter.update({
                                counts,
                                ...(restoreFailures.length > 0 ? { failures: restoreFailures } : {}),
                            });
                        }
                        catch {
                            // Keep the manifest for a later recovery attempt when fallback restoration fails.
                        }
                    }
                    throw new Error(`Could not stop the predecessor daemon on ${options.socketPath}`);
                }
            }
        }
        else {
            manifest = tryReadPreparedDaemonUpdateRestartManifest(options.socketPath, options.agentDir);
            if (!hasRestorableDaemonUpdateRestart(manifest)) {
                statusWriter.update({ phase: "skipped", message: "No running daemon needed to be restarted" });
                return statusWriter.current();
            }
        }
        statusWriter.update({ phase: "starting_daemon" });
        await waitForDaemonStartupFence(options.socketPath, UPDATE_RESTART_PREDECESSOR_FENCE_TIMEOUT_MS);
        await shutdownAdmission.assertOrRenew();
        await shutdownAdmission.release();
        shutdownAdmission = undefined;
        await ensureInteractiveDaemonRunning(options.socketPath);
        const successorClient = new DaemonClient(options.socketPath);
        let successor;
        try {
            await successorClient.connect(1000);
            const successorHello = await successorClient.waitForHello(60000);
            successor = validateReplacementDaemon(options.socketPath, successorHello, predecessor);
        }
        finally {
            successorClient.close();
        }
        statusWriter.update({ phase: "restoring", successor });
        let counts = { total: 0, restored: 0, resumed: 0, failed: 0 };
        let failures = [];
        if (manifest) {
            const restoreResult = await restoreDaemonUpdateRestart(options.socketPath, manifest, options.originActiveSessionId, reportRestoreProgress);
            counts = {
                total: restoreResult.total,
                restored: restoreResult.restored,
                resumed: restoreResult.resumed,
                failed: restoreResult.failed,
            };
            failures = restoreResult.failures;
            clearPreparedDaemonUpdateRestartManifest(options.socketPath, options.agentDir);
        }
        statusWriter.update({
            phase: "complete",
            counts,
            ...(failures.length > 0 ? { failures } : {}),
            message: counts.failed > 0
                ? `Restarted the daemon with ${counts.failed} session restore failure${counts.failed === 1 ? "" : "s"}`
                : "Restarted the daemon after the update",
        });
    }
    catch (error) {
        statusWriter.update({ phase: "failed", message: formatUnknownError(error) });
    }
    finally {
        stopStatusHeartbeat();
        connectedClient?.close();
        await shutdownAdmission?.release();
        await lease?.release();
    }
    return statusWriter.current();
}
export async function handleConfigCommand(args) {
    if (args[0] !== "config") {
        return false;
    }
    const cwd = process.cwd();
    const agentDir = getAgentDir();
    const settingsManager = SettingsManager.create(cwd, agentDir);
    reportSettingsErrors(settingsManager, "config command");
    const packageManager = new DefaultPackageManager({ cwd, agentDir, settingsManager });
    const resolvedPaths = await packageManager.resolve();
    await selectConfig({
        resolvedPaths,
        settingsManager,
        cwd,
        agentDir,
    });
    process.exit(0);
}
export async function handlePackageCommand(args) {
    const options = parsePackageCommand(args);
    if (!options) {
        return false;
    }
    if (options.help) {
        printPackageCommandHelp(options.command);
        return true;
    }
    if (options.invalidOption) {
        if (options.invalidOption === "-l" && (options.command === "install" || options.command === "remove")) {
            console.error(chalk.red('Option -l was removed. Use "--local".'));
            process.exitCode = 1;
            return true;
        }
        console.error(chalk.red(`Unknown option ${options.invalidOption} for "${options.command}".`));
        console.error(chalk.dim(`Use "${APP_NAME} --help" or "${getPackageCommandUsage(options.command)}".`));
        process.exitCode = 1;
        return true;
    }
    if (options.missingOptionValue) {
        console.error(chalk.red(`Missing value for ${options.missingOptionValue}.`));
        console.error(chalk.dim(`Usage: ${getPackageCommandUsage(options.command)}`));
        process.exitCode = 1;
        return true;
    }
    if (options.invalidArgument) {
        console.error(chalk.red(`Unexpected argument ${options.invalidArgument}.`));
        console.error(chalk.dim(`Usage: ${getPackageCommandUsage(options.command)}`));
        process.exitCode = 1;
        return true;
    }
    if (options.conflictingOptions) {
        console.error(chalk.red(options.conflictingOptions));
        console.error(chalk.dim(`Usage: ${getPackageCommandUsage(options.command)}`));
        process.exitCode = 1;
        return true;
    }
    if (options.restartCoordinator) {
        const agentDir = getAgentDir();
        const statusPath = options.restartStatusPath;
        const daemonSocketPath = options.daemonSocketPath;
        const restartDirectory = resolve(agentDir, "update-restarts");
        if (!statusPath || !daemonSocketPath || !resolve(statusPath).startsWith(`${restartDirectory}${sep}`)) {
            console.error(chalk.red("Invalid daemon update restart coordinator invocation."));
            process.exitCode = 1;
            return true;
        }
        const status = await runDaemonUpdateRestartCoordinator({
            socketPath: daemonSocketPath,
            agentDir,
            statusPath,
            originActiveSessionId: options.restartOriginActiveSessionId,
        });
        if (status.phase === "failed") {
            process.exitCode = 1;
        }
        return true;
    }
    if (options.restartStatusPath || options.restartOriginActiveSessionId) {
        console.error(chalk.red("Invalid daemon update restart coordinator invocation."));
        process.exitCode = 1;
        return true;
    }
    const source = options.source;
    if ((options.command === "install" || options.command === "remove") && !source) {
        console.error(chalk.red(`Missing ${options.command} source.`));
        console.error(chalk.dim(`Usage: ${getPackageCommandUsage(options.command)}`));
        process.exitCode = 1;
        return true;
    }
    const cwd = process.cwd();
    const agentDir = getAgentDir();
    const settingsManager = SettingsManager.create(cwd, agentDir);
    reportSettingsErrors(settingsManager, "package command");
    const selfUpdateNpmCommand = settingsManager.getGlobalSettings().npmCommand;
    const packageManager = new DefaultPackageManager({ cwd, agentDir, settingsManager });
    packageManager.setProgressCallback((event) => {
        if (event.type === "start") {
            process.stdout.write(chalk.dim(`${event.message}\n`));
        }
    });
    try {
        switch (options.command) {
            case "install":
                await packageManager.installAndPersist(source, { local: options.local });
                console.log(chalk.green(`Installed ${source}`));
                return true;
            case "remove": {
                const removed = await packageManager.removeAndPersist(source, { local: options.local });
                if (!removed) {
                    console.error(chalk.red(`No matching package found for ${source}`));
                    process.exitCode = 1;
                    return true;
                }
                console.log(chalk.green(`Removed ${source}`));
                return true;
            }
            case "list": {
                const configuredPackages = packageManager.listConfiguredPackages();
                const userPackages = configuredPackages.filter((pkg) => pkg.scope === "user");
                const projectPackages = configuredPackages.filter((pkg) => pkg.scope === "project");
                if (configuredPackages.length === 0) {
                    console.log(chalk.dim("No packages installed."));
                    return true;
                }
                const formatPackage = (pkg) => {
                    const display = pkg.filtered ? `${pkg.source} (filtered)` : pkg.source;
                    console.log(`  ${display}`);
                    if (pkg.installedPath) {
                        console.log(chalk.dim(`    ${pkg.installedPath}`));
                    }
                };
                if (userPackages.length > 0) {
                    console.log(chalk.bold("User packages:"));
                    for (const pkg of userPackages) {
                        formatPackage(pkg);
                    }
                }
                if (projectPackages.length > 0) {
                    if (userPackages.length > 0)
                        console.log();
                    console.log(chalk.bold("Project packages:"));
                    for (const pkg of projectPackages) {
                        formatPackage(pkg);
                    }
                }
                return true;
            }
            case "update": {
                const target = options.updateTarget ?? { type: "all" };
                if (updateTargetIncludesExtensions(target)) {
                    const updateSource = target.type === "extensions" ? target.source : undefined;
                    await packageManager.update(updateSource);
                    if (updateSource) {
                        console.log(chalk.green(`Updated ${updateSource}`));
                    }
                    else {
                        console.log(chalk.green("Updated packages"));
                    }
                }
                if (updateTargetIncludesSelf(target)) {
                    const selfUpdatePlan = await getSelfUpdatePlan(options.force);
                    if (!selfUpdatePlan.shouldRun) {
                        setSelfUpdateNoChangeExitCode();
                        return true;
                    }
                    const selfUpdateCommand = getSelfUpdateCommand(PACKAGE_NAME, selfUpdateNpmCommand, selfUpdatePlan.installSpec, selfUpdatePlan.packageName);
                    if (!selfUpdateCommand) {
                        printSelfUpdateUnavailable(selfUpdateNpmCommand, selfUpdatePlan.installSpec, selfUpdatePlan.packageName);
                        process.exitCode = 1;
                        return true;
                    }
                    // Confirm before the install, since upgrading the daemon afterward stops and resumes busy work.
                    const daemonSocketPath = resolveUpdateDaemonSocketPath(options.daemonSocketPath);
                    const daemonProbe = await probeRunningDaemonSessions(daemonSocketPath);
                    if (!(await confirmDaemonSessionLossBeforeUpdate(daemonProbe, options.force))) {
                        if (process.stdin.isTTY) {
                            console.log(chalk.dim("Update cancelled."));
                        }
                        process.exitCode = 1;
                        return true;
                    }
                    try {
                        await runSelfUpdate(selfUpdateCommand);
                    }
                    catch (error) {
                        const message = error instanceof Error ? error.message : "Unknown package command error";
                        console.error(chalk.red(`Error: ${message}`));
                        printSelfUpdateFallback(selfUpdateCommand);
                        process.exitCode = 1;
                        return true;
                    }
                    const versionChange = selfUpdatePlan.targetVersion
                        ? ` from v${VERSION} to v${selfUpdatePlan.targetVersion}`
                        : "";
                    console.log(chalk.green(`Updated ${APP_NAME}${versionChange}`));
                    if (process.env[SELF_UPDATE_INTERACTIVE_CHILD_ENV] === "1") {
                        return true;
                    }
                    try {
                        const status = await launchDaemonUpdateRestartCoordinator({
                            socketPath: daemonSocketPath,
                            agentDir,
                            cwd,
                            originActiveSessionId: process.env[DAEMON_WORKER_ACTIVE_SESSION_ID_ENV],
                        });
                        reportDaemonUpdateRestartStatus(status);
                    }
                    catch (error) {
                        console.error(chalk.yellow(`Warning: updated, but could not coordinate the daemon restart (${formatUnknownError(error)}).`));
                    }
                }
                return true;
            }
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown package command error";
        console.error(chalk.red(`Error: ${message}`));
        process.exitCode = 1;
        return true;
    }
}
//# sourceMappingURL=package-manager-cli.js.map