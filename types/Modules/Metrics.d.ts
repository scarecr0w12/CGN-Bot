export const register: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
/**
 * Express middleware to track HTTP request metrics
 */
export function metricsMiddleware(req: any, res: any, next: any): any;
/**
 * Get metrics endpoint handler
 */
export function getMetrics(req: any, res: any): Promise<void>;
/**
 * Update Discord client metrics
 * Call this periodically (e.g., every 30 seconds)
 */
export function updateDiscordMetrics(discordClient: any): void;
/**
 * Update shard health metrics from sharder data
 * Call this from master process with sharder.getMetrics() data
 */
export function updateShardHealthMetrics(shardData: any): void;
/**
 * Record a shard restart event
 */
export function recordShardRestart(shardId: any): void;
/**
 * Record a command execution
 */
export function recordCommand(commandName: any, type?: string): void;
/**
 * Record a message processed
 */
export function recordMessage(type?: string): void;
/**
 * Record a Discord gateway event
 */
export function recordEvent(eventName: any): void;
/**
 * Record a database query
 */
export function recordDbQuery(operation: any, collection: any, duration: any, success?: boolean): void;
/**
 * Update extension counts
 */
export function updateExtensionCounts(counts: any): void;
/**
 * Record an extension execution
 */
export function recordExtensionExecution(extensionId: any, success?: boolean): void;
/**
 * Update WebSocket connection count
 */
export function updateWsConnections(namespace: any, count: any): void;
declare const httpRequestDuration: client.Histogram<"method" | "route" | "status_code">;
declare const httpRequestsTotal: client.Counter<"method" | "route" | "status_code">;
declare const httpActiveRequests: client.Gauge<string>;
declare const discordGuildsTotal: client.Gauge<string>;
declare const discordUsersTotal: client.Gauge<string>;
declare const discordShardsTotal: client.Gauge<string>;
declare const discordShardStatus: client.Gauge<"shard_id">;
declare const discordShardLatency: client.Gauge<"shard_id">;
declare const discordShardFailures: client.Gauge<"shard_id">;
declare const discordShardRestarts: client.Counter<"shard_id">;
declare const discordShardHeartbeatLatency: client.Gauge<"shard_id">;
declare const discordShardMemory: client.Gauge<"shard_id">;
declare const discordCommandsTotal: client.Counter<"command" | "type">;
declare const discordMessagesTotal: client.Counter<"type">;
declare const discordEventsTotal: client.Counter<"event">;
declare const dbQueryDuration: client.Histogram<"operation" | "collection">;
declare const dbQueriesTotal: client.Counter<"operation" | "collection" | "status">;
declare const extensionsTotal: client.Gauge<"state">;
declare const extensionExecutionsTotal: client.Counter<"status" | "extension_id">;
declare const wsConnectionsActive: client.Gauge<"namespace">;
import client = require("prom-client");
export declare namespace metrics {
    export { httpRequestDuration };
    export { httpRequestsTotal };
    export { httpActiveRequests };
    export { discordGuildsTotal };
    export { discordUsersTotal };
    export { discordShardsTotal };
    export { discordShardStatus };
    export { discordShardLatency };
    export { discordShardFailures };
    export { discordShardRestarts };
    export { discordShardHeartbeatLatency };
    export { discordShardMemory };
    export { discordCommandsTotal };
    export { discordMessagesTotal };
    export { discordEventsTotal };
    export { dbQueryDuration };
    export { dbQueriesTotal };
    export { extensionsTotal };
    export { extensionExecutionsTotal };
    export { wsConnectionsActive };
}
export {};
//# sourceMappingURL=Metrics.d.ts.map