import type { ExtensionUIContext } from "../../core/extensions/index.js";
import type { RpcExtensionUIRequest, RpcExtensionUIResponse } from "./rpc-types.js";
export interface RpcExtensionUiBridge {
    uiContext: ExtensionUIContext;
    handleResponse(response: RpcExtensionUIResponse): boolean;
    close(): void;
}
export declare function createRpcExtensionUiBridge(output: (request: RpcExtensionUIRequest) => void): RpcExtensionUiBridge;
//# sourceMappingURL=rpc-extension-ui-context.d.ts.map