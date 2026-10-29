import { randomUUID } from "node:crypto";
import { theme } from "../interactive/theme/theme.js";
export function createRpcExtensionUiBridge(output) {
    const pending = new Map();
    let closed = false;
    const createDialogPromise = (opts, defaultValue, request, parseResponse) => {
        if (closed || opts?.signal?.aborted) {
            return Promise.resolve(defaultValue);
        }
        const id = randomUUID();
        return new Promise((resolve) => {
            let timeout;
            const cleanup = () => {
                if (timeout)
                    clearTimeout(timeout);
                opts?.signal?.removeEventListener("abort", onAbort);
                pending.delete(id);
            };
            const onAbort = () => {
                cleanup();
                resolve(defaultValue);
            };
            opts?.signal?.addEventListener("abort", onAbort, { once: true });
            if (opts?.timeout) {
                timeout = setTimeout(onAbort, opts.timeout);
            }
            pending.set(id, (response) => {
                cleanup();
                resolve(parseResponse(response));
            });
            output({ type: "extension_ui_request", id, ...request });
        });
    };
    const fireAndForget = (request) => {
        output({ type: "extension_ui_request", id: randomUUID(), ...request });
    };
    const uiContext = {
        select: (title, options, opts) => createDialogPromise(opts, undefined, { method: "select", title, options, timeout: opts?.timeout }, (response) => "cancelled" in response && response.cancelled
            ? undefined
            : "value" in response
                ? response.value
                : undefined),
        confirm: (title, message, opts) => createDialogPromise(opts, false, { method: "confirm", title, message, timeout: opts?.timeout }, (response) => "cancelled" in response && response.cancelled
            ? false
            : "confirmed" in response
                ? response.confirmed
                : false),
        input: (title, placeholder, opts) => createDialogPromise(opts, undefined, { method: "input", title, placeholder, timeout: opts?.timeout }, (response) => "cancelled" in response && response.cancelled
            ? undefined
            : "value" in response
                ? response.value
                : undefined),
        notify: (message, notifyType) => fireAndForget({ method: "notify", message, notifyType }),
        onTerminalInput: () => () => { },
        setStatus: (statusKey, statusText) => fireAndForget({ method: "setStatus", statusKey, statusText }),
        setWorkingMessage: (_message) => { },
        setWorkingVisible: (_visible) => { },
        setWorkingIndicator: (_options) => { },
        setHiddenThinkingLabel: (_label) => { },
        setWidget: (widgetKey, content, options) => {
            if (content === undefined || Array.isArray(content)) {
                fireAndForget({
                    method: "setWidget",
                    widgetKey,
                    widgetLines: content,
                    widgetPlacement: options?.placement,
                });
            }
        },
        setFooter: (_factory) => { },
        setHeader: (_factory) => { },
        setTitle: (title) => fireAndForget({ method: "setTitle", title }),
        custom: async () => undefined,
        pasteToEditor(text) {
            this.setEditorText(text);
        },
        setEditorText: (text) => fireAndForget({ method: "set_editor_text", text }),
        getEditorText: () => "",
        editor: (title, prefill) => createDialogPromise(undefined, undefined, { method: "editor", title, prefill }, (response) => "cancelled" in response && response.cancelled
            ? undefined
            : "value" in response
                ? response.value
                : undefined),
        addAutocompleteProvider: () => { },
        setEditorComponent: () => { },
        getEditorComponent: () => undefined,
        get theme() {
            return theme;
        },
        getAllThemes: () => [],
        getTheme: (_name) => undefined,
        setTheme: (_theme) => ({ success: false, error: "Theme switching not supported in RPC mode" }),
        getToolsExpanded: () => false,
        setToolsExpanded: (_expanded) => { },
    };
    return {
        uiContext,
        handleResponse(response) {
            const resolve = pending.get(response.id);
            if (!resolve) {
                return false;
            }
            pending.delete(response.id);
            resolve(response);
            return true;
        },
        close() {
            closed = true;
            for (const [id, resolve] of pending) {
                resolve({ type: "extension_ui_response", id, cancelled: true });
            }
            pending.clear();
        },
    };
}
//# sourceMappingURL=rpc-extension-ui-context.js.map