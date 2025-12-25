export = WebhookDispatcher;
declare class WebhookDispatcher {
    constructor(client: any);
    client: any;
    queue: any[];
    retryAttempts: number;
    retryDelay: number;
    processing: boolean;
    /**
     * Check if a server has webhook integrations enabled
     * @param {string} serverId - Server/guild ID
     * @returns {Promise<boolean>}
     */
    hasWebhookAccess(serverId: string): Promise<boolean>;
    /**
     * Register a webhook for a server
     * @param {Object} serverDocument - Server document
     * @param {Object} webhookConfig - Webhook configuration
     * @returns {Object} Created webhook info
     */
    registerWebhook(serverDocument: any, webhookConfig: any): any;
    /**
     * Dispatch an event to all subscribed webhooks
     * @param {string} guildId - Guild ID
     * @param {string} event - Event type
     * @param {Object} payload - Event payload
     */
    dispatch(guildId: string, event: string, payload: any): Promise<void>;
    /**
     * Process the webhook queue
     */
    processQueue(): Promise<void>;
    /**
     * Deliver a webhook payload
     * @param {Object} item - Queue item
     */
    deliverWebhook(item: any): Promise<void>;
    /**
     * Test a webhook URL
     * @param {string} url - Webhook URL to test
     * @returns {Promise<Object>} Test result
     */
    testWebhook(url: string): Promise<any>;
}
declare namespace WebhookDispatcher {
    export { WEBHOOK_EVENTS, DELIVERY_STATUS };
}
declare namespace WEBHOOK_EVENTS {
    let MEMBER_JOIN: string;
    let MEMBER_LEAVE: string;
    let MESSAGE_DELETE: string;
    let MEMBER_BAN: string;
    let MEMBER_UNBAN: string;
    let ROLE_UPDATE: string;
    let CHANNEL_CREATE: string;
    let CHANNEL_DELETE: string;
    let COMMAND_USED: string;
    let MODERATION_ACTION: string;
}
declare namespace DELIVERY_STATUS {
    let PENDING: string;
    let SUCCESS: string;
    let FAILED: string;
    let RETRYING: string;
}
//# sourceMappingURL=WebhookDispatcher.d.ts.map