export = Sharder;
declare class Sharder {
    constructor(token: any, count: any, logger: any);
    cluster: cluster.Cluster;
    logger: any;
    token: any;
    host: string;
    count: any;
    mode: string;
    SharderIPC: typeof import("./IPC");
    Collection: typeof import("discord.js").Collection;
    IPC: import("./IPC");
    shards: import("discord.js").Collection<any, any>;
    guilds: import("discord.js").Collection<any, any>;
    shutdown: boolean;
    spawn(): void;
    /**
     * Create a new shard instance
     * @param {number} id - Shard ID
     * @param {number} [inheritedFailures=0] - Failure count from previous instance
     */
    create(id: number, inheritedFailures?: number): void;
    broadcast(subject: any, message: any, timeout: any): Promise<any[]>;
    /**
     * Get health metrics for all shards
     * @returns {Object} Metrics object with shard health data
     */
    getHealthMetrics(): any;
    /**
     * Start heartbeat monitoring for all shards
     */
    startAllHeartbeats(): void;
}
import cluster = require("node:cluster");
//# sourceMappingURL=Sharder.d.ts.map