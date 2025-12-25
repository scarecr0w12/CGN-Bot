export = MessageCreate;
declare class MessageCreate extends BaseEvent {
    requirements(msg: any): Promise<boolean>;
    /**
     * Handles a MESSAGE_CREATE event
     * @param {Message} msg The received message from Discord
     */
    handle(msg: Message, proctime: any): Promise<any>;
    /**
     * Get a chatter bot response
     * @param {User|GuildMember|Snowflake} userOrUserID
     * @param {?String} prompt
     * @returns {Promise} The response if successful, otherwise an error
     */
    chatterPrompt(userOrUserID: User | GuildMember | Snowflake, prompt: string | null): Promise<any>;
    /**
     * Delete command message if necessary
     * @param {Document} serverDocument
     * @param {Query} channelQueryDocument
     * @param {Message} msg
     */
    deleteCommandMessage(serverDocument: Document, channelQueryDocument: Query, msg: Message): Promise<void>;
    /**
     * Set a command cooldown in a channel
     * @param {Document} serverDocument
     * @param {Document} channelDocument
     * @param {Query} channelQueryDocument
     */
    setCooldown(serverDocument: Document, channelDocument: Document, channelQueryDocument: Query): Promise<void>;
    /**
     * Increment command usage count
     * @param {Document} serverDocument
     * @param {?String} command
     */
    incrementCommandUsage(serverDocument: Document, command: string | null): Promise<void>;
}
import BaseEvent = require("../BaseEvent.js");
//# sourceMappingURL=Skynet.MessageCreate.d.ts.map