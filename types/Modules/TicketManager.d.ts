export = TicketManager;
/**
 * TicketManager - Handles global support tickets via DM
 *
 * Users can create tickets by:
 * 1. DMing the bot with "ticket <subject>"
 * 2. Using the /ticket slash command
 *
 * Replies to existing tickets are automatically routed when:
 * - User has an open ticket and sends a DM
 */
declare class TicketManager {
    constructor(client: any);
    client: any;
    activeTicketCache: Map<any, any>;
    /**
     * Get next ticket number (auto-increment)
     */
    getNextTicketNumber(): Promise<any>;
    /**
     * Find an active (open/in_progress/awaiting) ticket for a user
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    findActiveTicketForUser(userId: string): Promise<any | null>;
    /**
     * Create a new ticket from a DM
     * @param {Message} msg Discord message
     * @param {string} subject Ticket subject
     * @param {string} category Optional category
     * @returns {Promise<Object>} Created ticket
     */
    createTicket(msg: Message, subject: string, category?: string): Promise<any>;
    /**
     * Add a message to an existing ticket
     * @param {Object} ticket The ticket document
     * @param {Message} msg Discord message
     * @returns {Promise<void>}
     */
    addMessageToTicket(ticket: any, msg: Message): Promise<void>;
    /**
     * Handle an incoming DM - either create ticket, add to existing, or ignore
     * @param {Message} msg Discord message
     * @returns {Promise<boolean>} True if handled as ticket, false otherwise
     */
    handleDM(msg: Message): Promise<boolean>;
    /**
     * Notify maintainers about a new ticket
     * @param {Object} ticket The ticket document
     * @param {Message} msg Original message
     */
    notifyMaintainers(ticket: any, msg: Message): Promise<void>;
    /**
     * Notify about a ticket update (new user message)
     * @param {Object} ticket The ticket document
     * @param {Message} msg New message
     */
    notifyTicketUpdate(ticket: any, msg: Message): Promise<void>;
    /**
     * Close a ticket and notify the user
     * @param {string} ticketId
     * @param {string} staffId
     * @param {string} resolutionNotes
     */
    closeTicket(ticketId: string, staffId: string, resolutionNotes?: string): Promise<any>;
}
//# sourceMappingURL=TicketManager.d.ts.map