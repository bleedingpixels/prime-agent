/**
 * Agent loop that works with AgentMessage throughout.
 * Transforms to Message[] only at the LLM call boundary.
 */
import { EventStream, streamSimple, validateToolArguments, } from "@earendil-works/pi-ai";
const ABORT_ERROR_MESSAGE = "Request was aborted";
const EMPTY_USAGE = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};
function createAbortError() {
    return new Error(ABORT_ERROR_MESSAGE);
}
function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw createAbortError();
    }
}
function raceWithAbort(operation, signal, onAbort) {
    if (!signal) {
        return operation;
    }
    if (signal.aborted) {
        onAbort?.();
        void operation.catch(() => undefined);
        return Promise.reject(createAbortError());
    }
    return new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            signal.removeEventListener("abort", abort);
        };
        const abort = () => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            onAbort?.();
            reject(createAbortError());
        };
        signal.addEventListener("abort", abort, { once: true });
        operation.then((value) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve(value);
        }, (error) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            reject(error);
        });
    });
}
function maybePromiseWithAbort(operation, signal, onAbort) {
    return raceWithAbort(Promise.resolve(operation), signal, onAbort);
}
function isAbortError(error) {
    return error instanceof Error && (error.message === ABORT_ERROR_MESSAGE || error.name === "AbortError");
}
async function settlePostTurn(operation, signal) {
    try {
        return { status: "completed", value: await operation };
    }
    catch (error) {
        if (signal?.aborted && isAbortError(error)) {
            return { status: "aborted" };
        }
        throw error;
    }
}
function cloneAssistantContent(content) {
    return content.map((part) => {
        if (part.type === "toolCall") {
            return { ...part, arguments: { ...part.arguments } };
        }
        return { ...part };
    });
}
function cloneUsage(usage) {
    return { ...usage, cost: { ...usage.cost } };
}
function createAbortedAssistantMessage(config, partialMessage) {
    return {
        role: "assistant",
        content: partialMessage ? cloneAssistantContent(partialMessage.content) : [{ type: "text", text: "" }],
        api: partialMessage?.api ?? config.model.api,
        provider: partialMessage?.provider ?? config.model.provider,
        model: partialMessage?.model ?? config.model.id,
        usage: cloneUsage(partialMessage?.usage ?? EMPTY_USAGE),
        stopReason: "aborted",
        errorMessage: ABORT_ERROR_MESSAGE,
        timestamp: Date.now(),
    };
}
function getTerminalMessage(event) {
    return event.type === "done" ? event.message : event.error;
}
function endAgentStreamOnError(stream, promise) {
    void promise.then((messages) => {
        stream.end(messages);
    }, () => {
        stream.end([]);
    });
}
async function pollMessagesUnlessAborted(poll, signal) {
    if (!poll || signal?.aborted) {
        return [];
    }
    return (await maybePromiseWithAbort(poll(), signal)) || [];
}
/**
 * Start an agent loop with a new prompt message.
 * The prompt is added to the context and events are emitted for it.
 */
export function agentLoop(prompts, context, config, signal, streamFn) {
    const stream = createAgentStream();
    endAgentStreamOnError(stream, runAgentLoop(prompts, context, config, async (event) => {
        stream.push(event);
    }, signal, streamFn));
    return stream;
}
/**
 * Continue an agent loop from the current context without adding a new message.
 * Used for retries - context already has user message or tool results.
 *
 * **Important:** The last message in context must convert to a `user` or `toolResult` message
 * via `convertToLlm`. If it doesn't, the LLM provider will reject the request.
 * This cannot be validated here since `convertToLlm` is only called once per turn.
 */
export function agentLoopContinue(context, config, signal, streamFn) {
    if (context.messages.length === 0) {
        throw new Error("Cannot continue: no messages in context");
    }
    if (context.messages[context.messages.length - 1].role === "assistant") {
        throw new Error("Cannot continue from message role: assistant");
    }
    const stream = createAgentStream();
    endAgentStreamOnError(stream, runAgentLoopContinue(context, config, async (event) => {
        stream.push(event);
    }, signal, streamFn));
    return stream;
}
export async function runAgentLoop(prompts, context, config, emit, signal, streamFn) {
    const newMessages = [...prompts];
    const currentContext = {
        ...context,
        messages: [...context.messages, ...prompts],
    };
    await emit({ type: "agent_start" });
    await emit({ type: "turn_start" });
    for (const prompt of prompts) {
        await emit({ type: "message_start", message: prompt });
        await emit({ type: "message_end", message: prompt });
    }
    await runLoop(currentContext, newMessages, config, signal, emit, streamFn);
    return newMessages;
}
export async function runAgentLoopContinue(context, config, emit, signal, streamFn) {
    if (context.messages.length === 0) {
        throw new Error("Cannot continue: no messages in context");
    }
    if (context.messages[context.messages.length - 1].role === "assistant") {
        throw new Error("Cannot continue from message role: assistant");
    }
    const newMessages = [];
    const currentContext = { ...context };
    await emit({ type: "agent_start" });
    await emit({ type: "turn_start" });
    await runLoop(currentContext, newMessages, config, signal, emit, streamFn);
    return newMessages;
}
function createAgentStream() {
    return new EventStream((event) => event.type === "agent_end", (event) => (event.type === "agent_end" ? event.messages : []));
}
/**
 * Main loop logic shared by agentLoop and agentLoopContinue.
 */
async function runLoop(currentContext, newMessages, config, signal, emit, streamFn) {
    let firstTurn = true;
    let lastTurn;
    // Check for steering messages at start (user may have typed while waiting)
    let pendingMessages = await pollMessagesUnlessAborted(config.getSteeringMessages, signal);
    const shouldStopBeforeTurn = () => !firstTurn && (config.shouldStopBeforeTurn?.() ?? false);
    // Outer loop: continues when queued follow-up messages arrive after agent would stop
    while (true) {
        throwIfAborted(signal);
        let hasMoreToolCalls = true;
        // Inner loop: process tool calls and steering messages
        while (hasMoreToolCalls || pendingMessages.length > 0) {
            throwIfAborted(signal);
            if (!firstTurn) {
                await emit({ type: "turn_start" });
            }
            else {
                firstTurn = false;
            }
            // Process pending messages (inject before next assistant response)
            if (pendingMessages.length > 0) {
                for (const message of pendingMessages) {
                    await emit({ type: "message_start", message });
                    await emit({ type: "message_end", message });
                    currentContext.messages.push(message);
                    newMessages.push(message);
                }
                pendingMessages = [];
            }
            // Stream assistant response
            const message = await streamAssistantResponse(currentContext, config, signal, emit, streamFn);
            newMessages.push(message);
            if (message.stopReason === "error" || message.stopReason === "aborted") {
                await emit({ type: "turn_end", message, toolResults: [] });
                await emit({ type: "agent_end", messages: newMessages });
                return;
            }
            // Check for tool calls
            const toolCalls = message.content.filter((c) => c.type === "toolCall");
            const toolResults = [];
            hasMoreToolCalls = false;
            if (toolCalls.length > 0) {
                const executedToolBatch = await executeToolCalls(currentContext, message, config, signal, emit);
                toolResults.push(...executedToolBatch.messages);
                hasMoreToolCalls = !executedToolBatch.terminate;
                for (const result of toolResults) {
                    currentContext.messages.push(result);
                    newMessages.push(result);
                }
            }
            await emit({ type: "turn_end", message, toolResults });
            if (signal?.aborted) {
                await emit({ type: "agent_end", messages: newMessages });
                return;
            }
            lastTurn = {
                message,
                toolResults,
                context: currentContext,
                newMessages,
            };
            const shouldStopResult = await settlePostTurn(maybePromiseWithAbort(config.shouldStopAfterTurn?.({
                message,
                toolResults,
                context: currentContext,
                newMessages,
            }) ?? false, signal), signal);
            if (shouldStopResult.status === "aborted") {
                await emit({ type: "agent_end", messages: newMessages });
                return;
            }
            if (shouldStopResult.value || shouldStopBeforeTurn()) {
                await emit({ type: "agent_end", messages: newMessages });
                return;
            }
            const steeringMessagesResult = await settlePostTurn(pollMessagesUnlessAborted(config.getSteeringMessages, signal), signal);
            if (steeringMessagesResult.status === "aborted") {
                await emit({ type: "agent_end", messages: newMessages });
                return;
            }
            pendingMessages = steeringMessagesResult.value;
            // Steering drained by this poll owns the turn boundary; stop only when it was empty.
            if (pendingMessages.length === 0 && shouldStopBeforeTurn()) {
                await emit({ type: "agent_end", messages: newMessages });
                return;
            }
        }
        // Agent would stop here. Check for follow-up messages.
        if (shouldStopBeforeTurn())
            break;
        const followUpMessagesResult = await settlePostTurn(pollMessagesUnlessAborted(config.getFollowUpMessages, signal), signal);
        if (followUpMessagesResult.status === "aborted") {
            await emit({ type: "agent_end", messages: newMessages });
            return;
        }
        const followUpMessages = followUpMessagesResult.value;
        if (followUpMessages.length > 0) {
            // Set as pending so inner loop processes them
            pendingMessages = followUpMessages;
            continue;
        }
        if (shouldStopBeforeTurn())
            break;
        const continuationMessagesResult = lastTurn
            ? await settlePostTurn(maybePromiseWithAbort(config.getContinuationMessages?.(lastTurn, signal) ?? [], signal), signal)
            : { status: "completed", value: [] };
        if (continuationMessagesResult.status === "aborted") {
            await emit({ type: "agent_end", messages: newMessages });
            return;
        }
        const continuationMessages = continuationMessagesResult.value || [];
        if (continuationMessages.length > 0) {
            pendingMessages = continuationMessages;
            continue;
        }
        // No more messages, exit
        break;
    }
    await emit({ type: "agent_end", messages: newMessages });
}
/**
 * Stream an assistant response from the LLM.
 * This is where AgentMessage[] gets transformed to Message[] for the LLM.
 */
async function streamAssistantResponse(context, config, signal, emit, streamFn) {
    let partialMessage = null;
    let addedPartial = false;
    const finishAbortedMessage = async () => {
        const finalMessage = createAbortedAssistantMessage(config, partialMessage);
        if (addedPartial) {
            context.messages[context.messages.length - 1] = finalMessage;
        }
        else {
            context.messages.push(finalMessage);
            await emit({ type: "message_start", message: { ...finalMessage } });
        }
        await emit({ type: "message_end", message: finalMessage });
        return finalMessage;
    };
    try {
        throwIfAborted(signal);
        // Apply context transform if configured (AgentMessage[] → AgentMessage[])
        let messages = context.messages;
        if (config.transformContext) {
            messages = await maybePromiseWithAbort(config.transformContext(messages, signal), signal);
        }
        // Convert to LLM-compatible messages (AgentMessage[] → Message[])
        const llmMessages = await maybePromiseWithAbort(config.convertToLlm(messages), signal);
        const streamFunction = streamFn || streamSimple;
        // Resolve API key (important for expiring tokens)
        const resolvedApiKey = (config.getApiKey
            ? await maybePromiseWithAbort(config.getApiKey(config.model.provider), signal)
            : undefined) || config.apiKey;
        // Build LLM context immediately before starting the provider call.
        const llmContext = {
            systemPrompt: config.getSystemPrompt?.() ?? context.systemPrompt,
            messages: llmMessages,
            tools: context.tools,
        };
        const response = await maybePromiseWithAbort(streamFunction(config.model, llmContext, {
            ...config,
            apiKey: resolvedApiKey,
            signal,
        }), signal);
        const iterator = response[Symbol.asyncIterator]();
        const closeIterator = () => {
            void Promise.resolve(iterator.return?.()).catch(() => undefined);
        };
        while (true) {
            const next = await raceWithAbort(iterator.next(), signal, closeIterator);
            if (next.done) {
                break;
            }
            const event = next.value;
            switch (event.type) {
                case "start":
                    partialMessage = event.partial;
                    context.messages.push(partialMessage);
                    addedPartial = true;
                    await emit({ type: "message_start", message: { ...partialMessage } });
                    break;
                case "text_start":
                case "text_delta":
                case "text_end":
                case "thinking_start":
                case "thinking_delta":
                case "thinking_end":
                case "toolcall_start":
                case "toolcall_delta":
                case "toolcall_end":
                    if (partialMessage) {
                        partialMessage = event.partial;
                        context.messages[context.messages.length - 1] = partialMessage;
                        await emit({
                            type: "message_update",
                            assistantMessageEvent: event,
                            message: { ...partialMessage },
                        });
                    }
                    break;
                case "done":
                case "error": {
                    let finalMessage = getTerminalMessage(event);
                    try {
                        finalMessage = await maybePromiseWithAbort(response.result(), signal);
                    }
                    catch (error) {
                        if (!signal?.aborted || !isAbortError(error)) {
                            throw error;
                        }
                    }
                    if (addedPartial) {
                        context.messages[context.messages.length - 1] = finalMessage;
                    }
                    else {
                        context.messages.push(finalMessage);
                    }
                    if (!addedPartial) {
                        await emit({ type: "message_start", message: { ...finalMessage } });
                    }
                    await emit({ type: "message_end", message: finalMessage });
                    return finalMessage;
                }
            }
        }
        const finalMessage = await maybePromiseWithAbort(response.result(), signal);
        if (addedPartial) {
            context.messages[context.messages.length - 1] = finalMessage;
        }
        else {
            context.messages.push(finalMessage);
            await emit({ type: "message_start", message: { ...finalMessage } });
        }
        await emit({ type: "message_end", message: finalMessage });
        return finalMessage;
    }
    catch (error) {
        if (signal?.aborted && isAbortError(error)) {
            return finishAbortedMessage();
        }
        throw error;
    }
}
/**
 * Execute tool calls from an assistant message.
 */
async function executeToolCalls(currentContext, assistantMessage, config, signal, emit) {
    const toolCalls = assistantMessage.content.filter((c) => c.type === "toolCall");
    const hasSequentialToolCall = toolCalls.some((tc) => currentContext.tools?.find((t) => t.name === tc.name)?.executionMode === "sequential");
    if (config.toolExecution === "sequential" || hasSequentialToolCall) {
        return executeToolCallsSequential(currentContext, assistantMessage, toolCalls, config, signal, emit);
    }
    return executeToolCallsParallel(currentContext, assistantMessage, toolCalls, config, signal, emit);
}
async function executeToolCallsSequential(currentContext, assistantMessage, toolCalls, config, signal, emit) {
    const finalizedCalls = [];
    const messages = [];
    for (const toolCall of toolCalls) {
        if (signal?.aborted) {
            break;
        }
        await emit({
            type: "tool_execution_start",
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            args: toolCall.arguments,
        });
        const preparation = await prepareToolCall(currentContext, assistantMessage, toolCall, config, signal);
        let finalized;
        if (preparation.kind === "immediate") {
            finalized = {
                toolCall,
                result: preparation.result,
                isError: preparation.isError,
            };
        }
        else {
            const executed = await executePreparedToolCall(preparation, signal, emit);
            finalized = await finalizeExecutedToolCall(currentContext, assistantMessage, preparation, executed, config, signal);
        }
        await emitToolExecutionEnd(finalized, emit);
        const toolResultMessage = createToolResultMessage(finalized);
        await emitToolResultMessage(toolResultMessage, emit);
        finalizedCalls.push(finalized);
        messages.push(toolResultMessage);
        if (signal?.aborted) {
            break;
        }
    }
    return {
        messages,
        terminate: shouldTerminateToolBatch(finalizedCalls),
    };
}
async function executeToolCallsParallel(currentContext, assistantMessage, toolCalls, config, signal, emit) {
    const finalizedCalls = [];
    for (const toolCall of toolCalls) {
        await emit({
            type: "tool_execution_start",
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            args: toolCall.arguments,
        });
        const preparation = await prepareToolCall(currentContext, assistantMessage, toolCall, config, signal);
        if (preparation.kind === "immediate") {
            const finalized = {
                toolCall,
                result: preparation.result,
                isError: preparation.isError,
            };
            await emitToolExecutionEnd(finalized, emit);
            finalizedCalls.push(finalized);
            continue;
        }
        finalizedCalls.push(async () => {
            const executed = await executePreparedToolCall(preparation, signal, emit);
            const finalized = await finalizeExecutedToolCall(currentContext, assistantMessage, preparation, executed, config, signal);
            await emitToolExecutionEnd(finalized, emit);
            return finalized;
        });
    }
    const orderedFinalizedCalls = await Promise.all(finalizedCalls.map((entry) => (typeof entry === "function" ? entry() : Promise.resolve(entry))));
    const messages = [];
    for (const finalized of orderedFinalizedCalls) {
        const toolResultMessage = createToolResultMessage(finalized);
        await emitToolResultMessage(toolResultMessage, emit);
        messages.push(toolResultMessage);
    }
    return {
        messages,
        terminate: shouldTerminateToolBatch(orderedFinalizedCalls),
    };
}
function shouldTerminateToolBatch(finalizedCalls) {
    return finalizedCalls.length > 0 && finalizedCalls.every((finalized) => finalized.result.terminate === true);
}
function prepareToolCallArguments(tool, toolCall) {
    if (!tool.prepareArguments) {
        return toolCall;
    }
    const preparedArguments = tool.prepareArguments(toolCall.arguments);
    if (preparedArguments === toolCall.arguments) {
        return toolCall;
    }
    return {
        ...toolCall,
        arguments: preparedArguments,
    };
}
async function prepareToolCall(currentContext, assistantMessage, toolCall, config, signal) {
    const tool = currentContext.tools?.find((t) => t.name === toolCall.name);
    if (!tool) {
        return {
            kind: "immediate",
            result: createErrorToolResult(`Tool ${toolCall.name} not found`),
            isError: true,
        };
    }
    try {
        const preparedToolCall = prepareToolCallArguments(tool, toolCall);
        const validatedArgs = validateToolArguments(tool, preparedToolCall);
        if (config.beforeToolCall) {
            const beforeResult = await maybePromiseWithAbort(config.beforeToolCall({
                assistantMessage,
                toolCall,
                args: validatedArgs,
                context: currentContext,
            }, signal), signal);
            if (beforeResult?.block) {
                return {
                    kind: "immediate",
                    result: createErrorToolResult(beforeResult.reason || "Tool execution was blocked"),
                    isError: true,
                };
            }
        }
        return {
            kind: "prepared",
            toolCall,
            tool,
            args: validatedArgs,
        };
    }
    catch (error) {
        return {
            kind: "immediate",
            result: createErrorToolResult(error instanceof Error ? error.message : String(error)),
            isError: true,
        };
    }
}
async function executePreparedToolCall(prepared, signal, emit) {
    const updateEvents = [];
    let acceptingUpdates = true;
    try {
        throwIfAborted(signal);
        const result = await raceWithAbort(prepared.tool.execute(prepared.toolCall.id, prepared.args, signal, (partialResult) => {
            if (!acceptingUpdates || signal?.aborted) {
                return;
            }
            updateEvents.push(Promise.resolve(emit({
                type: "tool_execution_update",
                toolCallId: prepared.toolCall.id,
                toolName: prepared.toolCall.name,
                args: prepared.toolCall.arguments,
                partialResult,
            })));
        }), signal);
        acceptingUpdates = false;
        try {
            await raceWithAbort(Promise.all(updateEvents).then(() => undefined), signal);
        }
        catch (error) {
            if (!signal?.aborted || !isAbortError(error)) {
                throw error;
            }
        }
        return { result, isError: false };
    }
    catch (error) {
        acceptingUpdates = false;
        await raceWithAbort(Promise.all(updateEvents).then(() => undefined), signal).catch(() => undefined);
        return {
            result: createErrorToolResult(signal?.aborted ? "Tool execution aborted" : error instanceof Error ? error.message : String(error)),
            isError: true,
        };
    }
}
async function finalizeExecutedToolCall(currentContext, assistantMessage, prepared, executed, config, signal) {
    let result = executed.result;
    let isError = executed.isError;
    if (config.afterToolCall) {
        try {
            const afterResult = await maybePromiseWithAbort(config.afterToolCall({
                assistantMessage,
                toolCall: prepared.toolCall,
                args: prepared.args,
                result,
                isError,
                context: currentContext,
            }, signal), signal);
            if (afterResult) {
                result = {
                    content: afterResult.content ?? result.content,
                    details: afterResult.details ?? result.details,
                    terminate: afterResult.terminate ?? result.terminate,
                };
                isError = afterResult.isError ?? isError;
            }
        }
        catch (error) {
            result = createErrorToolResult(error instanceof Error ? error.message : String(error));
            isError = true;
        }
    }
    return {
        toolCall: prepared.toolCall,
        result,
        isError,
    };
}
function createErrorToolResult(message) {
    return {
        content: [{ type: "text", text: message }],
        details: {},
    };
}
async function emitToolExecutionEnd(finalized, emit) {
    await emit({
        type: "tool_execution_end",
        toolCallId: finalized.toolCall.id,
        toolName: finalized.toolCall.name,
        result: finalized.result,
        isError: finalized.isError,
    });
}
function createToolResultMessage(finalized) {
    return {
        role: "toolResult",
        toolCallId: finalized.toolCall.id,
        toolName: finalized.toolCall.name,
        content: finalized.result.content,
        details: finalized.result.details,
        isError: finalized.isError,
        timestamp: Date.now(),
    };
}
async function emitToolResultMessage(toolResultMessage, emit) {
    await emit({ type: "message_start", message: toolResultMessage });
    await emit({ type: "message_end", message: toolResultMessage });
}
//# sourceMappingURL=agent-loop.js.map