declare const _exports: UptimeKumaClient;
export = _exports;
declare class UptimeKumaClient {
    baseUrl: string;
    apiKey: string;
    statusPageSlug: string;
    pushToken: string;
    cache: {
        statusPage: any;
        heartbeats: any;
        lastFetch: number;
    };
    cacheTTL: number;
    heartbeatIntervals: Map<any, any>;
    /**
     * Check if Uptime Kuma is configured
     */
    isConfigured(): boolean;
    /**
     * Make an API request to Uptime Kuma
     */
    request(endpoint: any, options?: {}): Promise<unknown>;
    /**
     * Get public status page data (no auth required)
     */
    getStatusPage(): Promise<any>;
    /**
     * Get heartbeat data for the status page (no auth required)
     */
    getHeartbeats(): Promise<any>;
    /**
     * Get combined status data for display
     */
    getStatusData(): Promise<{
        configured: boolean;
        available: boolean;
        statusPage: any;
        heartbeats: any;
        monitors: any[];
        overallStatus?: undefined;
        uptimePercentage?: undefined;
    } | {
        configured: boolean;
        available: boolean;
        statusPage: {
            title: any;
            description: any;
            incident: any;
        };
        heartbeats: any;
        monitors: {
            id: any;
            name: any;
            type: any;
            group: any;
            status: any;
            statusText: string;
            statusClass: string;
            ping: any;
            uptime24h: string;
            uptime30d: string;
            heartbeats: any;
        }[];
        overallStatus: {
            status: number;
            text: string;
            class: string;
        };
        uptimePercentage: string | number;
    }>;
    /**
     * Process monitors from status page and heartbeat data
     */
    processMonitors(statusPage: any, heartbeats: any): {
        id: any;
        name: any;
        type: any;
        group: any;
        status: any;
        statusText: string;
        statusClass: string;
        ping: any;
        uptime24h: string;
        uptime30d: string;
        heartbeats: any;
    }[];
    /**
     * Get status text from status code
     */
    getStatusText(status: any): "Up" | "Down" | "Pending" | "Maintenance" | "Unknown";
    /**
     * Get CSS class for status
     */
    getStatusClass(status: any): "info" | "success" | "danger" | "warning" | "dark";
    /**
     * Calculate overall status from all monitors
     */
    calculateOverallStatus(monitors: any): {
        status: number;
        text: string;
        class: string;
    };
    /**
     * Calculate average uptime percentage across all monitors
     */
    calculateUptimePercentage(heartbeatList: any): string | 0;
    /**
     * Clear the cache
     */
    clearCache(): void;
    /**
     * Check if push heartbeats are configured
     */
    isPushConfigured(): boolean;
    /**
     * Send a push heartbeat to Uptime Kuma
     * @param {string} monitorToken - The push monitor token (or use default)
     * @param {string} status - 'up' or 'down'
     * @param {string} msg - Status message
     * @param {number} ping - Response time in ms (optional)
     */
    sendHeartbeat(monitorToken: string, status?: string, msg?: string, ping?: number): Promise<{
        success: boolean;
        data: unknown;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    /**
     * Start periodic heartbeat for a shard
     * @param {object} client - Discord client instance
     * @param {string} shardToken - Optional per-shard push token
     * @param {number} intervalMs - Heartbeat interval (default 60s)
     */
    startShardHeartbeat(client: object, shardToken?: string, intervalMs?: number): boolean;
    /**
     * Stop heartbeat for a shard
     * @param {string} shardId
     */
    stopShardHeartbeat(shardId: string): void;
    /**
     * Stop all heartbeats
     */
    stopAllHeartbeats(): void;
}
//# sourceMappingURL=UptimeKuma.d.ts.map