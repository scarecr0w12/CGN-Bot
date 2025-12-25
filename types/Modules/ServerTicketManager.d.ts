export = ServerTicketManager;
declare class ServerTicketManager {
    constructor(client: any);
    client: any;
    /**
     * Check if a server has the ticket system enabled and is Tier 2+
     * @param {Document} serverDocument
     * @returns {boolean}
     */
    isEnabled(serverDocument: Document): boolean;
    /**
     * Get the next ticket number for a server
     * @param {Document} serverDocument
     * @returns {number}
     */
    getNextTicketNumber(serverDocument: Document): number;
    /**
     * Create a new ticket channel
     * @param {Guild} guild
     * @param {Document} serverDocument
     * @param {GuildMember} member
     * @param {string} categoryId - The ticket category ID
     * @param {string} reason - Optional reason/subject
     * @returns {Promise<Object>} Created ticket data
     */
    createTicket(guild: Guild, serverDocument: Document, member: GuildMember, categoryId?: string, reason?: string): Promise<any>;
    /**
     * Get ping roles for a category
     */
    getPingRoles(ticketConfig: any, category: any): any;
    /**
     * Close a ticket
     * @param {Guild} guild
     * @param {Document} serverDocument
     * @param {string} ticketId
     * @param {User} closedBy
     * @param {string} reason
     */
    closeTicket(guild: Guild, serverDocument: Document, ticketId: string, closedBy: User, reason?: string): Promise<any>;
    /**
     * Claim a ticket (assign to staff member)
     */
    claimTicket(guild: any, ticketId: any, staffMember: any): Promise<any>;
    /**
     * Add a user to a ticket
     */
    addUserToTicket(guild: any, ticketId: any, userToAdd: any): Promise<any>;
    /**
     * Remove a user from a ticket
     */
    removeUserFromTicket(guild: any, ticketId: any, userToRemove: any): Promise<any>;
    /**
     * Add a system message to ticket history
     */
    addSystemMessage(ticket: any, userId: any, action: any, content: any): Promise<void>;
    /**
     * Save transcript to channel
     */
    saveTranscript(guild: any, ticket: any, transcriptChannel: any): Promise<void>;
    /**
     * Log ticket events to the log channel
     */
    logTicketEvent(guild: any, serverDocument: any, event: any, ticket: any, user: any): Promise<void>;
    /**
     * Find ticket by channel ID
     */
    findTicketByChannel(channelId: any): Promise<any>;
    /**
     * Create a ticket panel embed with buttons
     */
    createPanel(guild: any, serverDocument: any, channel: any, options?: {}): Promise<{
        panelId: string;
        message: any;
    }>;
}
//# sourceMappingURL=ServerTicketManager.d.ts.map