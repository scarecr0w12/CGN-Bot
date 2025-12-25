export = BotLists;
declare class BotLists {
    constructor(client: any);
    client: any;
    postInterval: NodeJS.Timeout;
    /**
     * Initialize the bot lists module - call after client is ready
     */
    init(): Promise<void>;
    /**
     * Get current bot list configuration from site settings
     */
    getConfig(): Promise<any>;
    /**
     * Get vote reward configuration
     */
    getVoteRewardsConfig(): Promise<any>;
    /**
     * Post stats to all enabled bot lists
     */
    postAllStats(): Promise<void>;
    /**
     * Post stats to top.gg
     */
    postToTopgg(stats: any, token: any): Promise<void>;
    /**
     * Post stats to discordbotlist.com
     */
    postToDiscordBotList(stats: any, token: any): Promise<void>;
    /**
     * Post stats to discord.bots.gg
     */
    postToDiscordBotsGG(stats: any, token: any): Promise<void>;
    /**
     * Post stats to discordlist.gg
     */
    postToDiscordListGG(stats: any, token: any): Promise<void>;
    /**
     * Post stats to bots.ondiscord.xyz
     */
    postToBotsOnDiscord(stats: any, token: any): Promise<void>;
    /**
     * Post stats to topbotlist.net
     */
    postToTopBotList(stats: any, token: any): Promise<void>;
    /**
     * Post slash commands to discordbotlist.com
     * @param {string} [token] - Optional API token override
     * @returns {Promise<{success: boolean, count?: number, error?: string}>}
     */
    postCommandsToDiscordBotList(token?: string): Promise<{
        success: boolean;
        count?: number;
        error?: string;
    }>;
    /**
     * Post slash commands to topbotlist.net
     * @param {string} [token] - Optional API token override
     * @returns {Promise<{success: boolean, count?: number, error?: string}>}
     */
    postCommandsToTopBotList(token?: string): Promise<{
        success: boolean;
        count?: number;
        error?: string;
    }>;
    /**
     * Sync commands to all enabled bot lists
     */
    syncAllCommands(): Promise<{
        discordbotlist: {
            success: boolean;
            count?: number;
            error?: string;
        };
        topbotlist: {
            success: boolean;
            count?: number;
            error?: string;
        };
    }>;
    /**
     * Process an incoming vote webhook
     * @param {string} site - The site the vote came from (topgg, discordbotlist)
     * @param {object} data - The vote data from the webhook
     */
    processVote(site: string, data: object): Promise<{
        userId: any;
        test: boolean;
        pointsAwarded?: undefined;
        isWeekend?: undefined;
    } | {
        userId: any;
        pointsAwarded: number;
        isWeekend: any;
        test?: undefined;
    }>;
    /**
     * Send a vote notification to a channel
     */
    sendVoteNotification(userId: any, site: any, points: any, channelId: any): Promise<void>;
    /**
     * Check if it's currently a weekend (for bonus points)
     */
    isWeekend(): boolean;
    /**
     * Get vote stats for a user
     */
    getUserVotes(userId: any, limit?: number): Promise<any>;
    /**
     * Get recent votes across all users
     */
    getRecentVotes(limit?: number): Promise<any>;
    /**
     * Get vote count for a user in the last 12 hours
     */
    getRecentVoteCount(userId: any): Promise<any>;
    /**
     * Get total vote counts by site
     */
    getVoteStats(): Promise<{
        topgg: any;
        discordbotlist: any;
        topbotlist: any;
        total: any;
    }>;
    /**
     * Clean up on shutdown
     */
    destroy(): void;
}
//# sourceMappingURL=BotLists.d.ts.map