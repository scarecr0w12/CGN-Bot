/**
 * Serialization Utilities Module
 * Handles serialization of Discord objects for the extension sandbox
 */
/**
 * Serialize an interaction for the isolate
 * @param {Interaction} interaction
 * @returns {Object}
 */
export function serializeInteraction(interaction: Interaction): any;
/**
 * Serialize a message for the isolate
 * @param {Message} msg
 * @returns {Object}
 */
export function serializeMessage(msg: Message): any;
/**
 * Serialize a channel for the isolate
 * @param {Channel} channel
 * @returns {Object}
 */
export function serializeChannel(channel: Channel): any;
/**
 * Serialize a guild for the isolate
 * @param {Guild} guild
 * @returns {Object}
 */
export function serializeGuild(guild: Guild): any;
/**
 * Serialize bot info for the isolate
 * @param {Client} client
 * @param {Guild} guild
 * @param {Document} serverDocument
 * @returns {Object}
 */
export function serializeBot(client: Client, guild: Guild, serverDocument: Document): any;
/**
 * Serialize event data for the isolate
 * @param {Object} eventData
 * @returns {Object}
 */
export function serializeEvent(eventData: any): any;
/**
 * Serialize a member for the isolate
 * @param {GuildMember} member
 * @param {Function} serializeUser - User serializer function
 * @returns {Object}
 */
export function serializeMember(member: GuildMember, serializeUser: Function): any;
/**
 * Serialize a user for the isolate
 * @param {User} user
 * @returns {Object}
 */
export function serializeUser(user: User): any;
/**
 * Serialize guild roles for the isolate
 * @param {Guild} guild
 * @returns {Object}
 */
export function serializeRoles(guild: Guild): any;
/**
 * Get embed builder helper functions
 * @returns {Object}
 */
export function getEmbedHelper(): any;
/**
 * Serialize the points module for the isolate
 * @param {Object} pointsModule - Points module instance
 * @returns {Object} Serialized points data and functions
 */
export function serializePointsModule(pointsModule: any): any;
//# sourceMappingURL=Serializers.d.ts.map