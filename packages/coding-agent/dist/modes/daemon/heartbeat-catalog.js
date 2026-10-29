import { deserializeDaemonError } from "./daemon-errors.js";
import { isUnknownDaemonCommandError } from "./daemon-protocol.js";
export async function listDaemonHeartbeats(client, activeSessionId) {
    if (!client.hello)
        await client.waitForHello();
    if (!client.supportsServerCapability("heartbeat_catalog"))
        return [];
    try {
        const command = { type: "heartbeats_list", ...(activeSessionId ? { activeSessionId } : {}) };
        const response = await client.request(command);
        if (!response.success) {
            throw deserializeDaemonError(response);
        }
        return response.data.heartbeats;
    }
    catch (error) {
        if (isUnknownDaemonCommandError(error, "heartbeats_list")) {
            return [];
        }
        throw error;
    }
}
//# sourceMappingURL=heartbeat-catalog.js.map