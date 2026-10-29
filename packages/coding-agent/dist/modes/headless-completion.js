import { autonomousLimitReason, buildAutonomousGateFailureContinuation, } from "../core/autonomous.js";
import { COMPACTION_OUTCOME_CUSTOM_TYPE, isCompactionOutcomeMessage, isSessionSlashCommandResultMessage, } from "../core/messages.js";
export function latestAutonomousGateAttempt(status) {
    return Math.max(status.lastGateFailure?.attempt ?? 0, 0, ...Object.values(status.gateAttempts));
}
export function selectHeadlessTerminalResult(messages) {
    let index = messages.length - 1;
    const compactionOutcomes = [];
    while (index >= 0) {
        const message = messages[index];
        if (isCompactionOutcomeMessage(message)) {
            compactionOutcomes.unshift(message);
            index--;
            continue;
        }
        // A corrupt outcome is still part of the terminal outcome suffix. Skip it
        // without letting it hide earlier valid outcomes or their failure status.
        if (message.role === "custom" && message.customType === COMPACTION_OUTCOME_CUSTOM_TYPE) {
            index--;
            continue;
        }
        break;
    }
    const precedingMessage = messages[index];
    const primary = precedingMessage?.role === "assistant" || isSessionSlashCommandResultMessage(precedingMessage)
        ? precedingMessage
        : undefined;
    return { primary, compactionOutcomes };
}
function shouldContinueAutonomousGates(status) {
    return (status.enabled &&
        status.gates.commands.length > 0 &&
        !!status.lastGateFailure &&
        latestAutonomousGateAttempt(status) <= status.gates.maxRetries &&
        !autonomousLimitReason(status));
}
function autonomousProgressKey(status) {
    return [
        latestAutonomousGateAttempt(status),
        status.continuationsUsed,
        status.turnsUsed,
        status.tokensUsed,
        status.lastGateFailure?.exitText ?? "",
    ].join(":");
}
export async function waitForHeadlessCompletion(session) {
    let lastPromptedProgressKey;
    let repeatedProgressPrompts = 0;
    while (true) {
        await session.waitForIdle();
        const status = session.getAutonomousStatus();
        if (!shouldContinueAutonomousGates(status) || !status.lastGateFailure) {
            return status;
        }
        const progressKey = autonomousProgressKey(status);
        if (progressKey === lastPromptedProgressKey) {
            repeatedProgressPrompts++;
        }
        else {
            repeatedProgressPrompts = 0;
            lastPromptedProgressKey = progressKey;
        }
        if (repeatedProgressPrompts > 0) {
            await new Promise((resolve) => setTimeout(resolve, Math.min(1000, repeatedProgressPrompts * 50)));
        }
        session.recordHostAutonomousContinuation();
        await session.prompt(buildAutonomousGateFailureContinuation({ ...status.lastGateFailure, attempt: latestAutonomousGateAttempt(status) }, status.gates.maxRetries), {
            streamingBehavior: "followUp",
            internalPrompt: true,
            suppressAutonomousContinuation: true,
        });
        await session.waitForIdle();
        await session.refreshAutonomousGates();
        const { primary } = selectHeadlessTerminalResult(session.state.messages);
        if (primary?.role === "assistant") {
            if (primary.stopReason === "error" || primary.stopReason === "aborted") {
                const postErrorStatus = session.getAutonomousStatus();
                if (shouldContinueAutonomousGates(postErrorStatus) && postErrorStatus.lastGateFailure) {
                    continue;
                }
                return postErrorStatus;
            }
        }
    }
}
//# sourceMappingURL=headless-completion.js.map