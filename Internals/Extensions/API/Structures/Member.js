const { Scopes } = require("../../../Constants");
const ScopeManager = require("../Utils/ScopeManager");
const { serializeError } = require("../Utils/Utils");
const privProps = new WeakMap();

/**
 * Represents a Guild Member in the Extension API.
 * @memberof API
 */
class Member {
	/**
	 * @param {Object} API - The API namespace
	 * @param {ExtensionManager} client - The extension manager client
	 * @param {Discord.GuildMember} member - The Discord.js member object
	 * @param {Array<String>} scopes - The extension's scopes
	 */
	constructor (API, client, member, scopes) {
		privProps.set(this, { API, client, member, scopes });

		/**
		 * The member's unique snowflake ID.
		 * @type {String}
		 */
		this.id = member.id;

		/**
		 * The member's nickname in this guild, or null if none.
		 * @type {?String}
		 */
		this.nickname = member.nickname;

		/**
		 * The member's display name (nickname or username).
		 * @type {String}
		 */
		this.displayName = member.displayName;

		/**
		 * The user object for this member.
		 * @type {API.User}
		 */
		this.user = new API.User(API, client, member.user, scopes);

		/**
		 * Whether this member is the guild owner.
		 * @type {Boolean}
		 */
		this.isOwner = member.id === member.guild.ownerId;

		/**
		 * A UNIX timestamp of when this member joined the guild.
		 * @type {?Number}
		 */
		this.joinedTimestamp = member.joinedTimestamp;

		/**
		 * A UNIX timestamp of when this member started boosting the guild.
		 * @type {?Number}
		 */
		this.premiumSinceTimestamp = member.premiumSinceTimestamp;

		/**
		 * Whether this member is currently timed out.
		 * @type {Boolean}
		 */
		this.isCommunicationDisabled = member.isCommunicationDisabled();

		/**
		 * The timestamp when this member's timeout will end.
		 * @type {?Number}
		 */
		this.communicationDisabledUntilTimestamp = member.communicationDisabledUntilTimestamp;

		/**
		 * Whether this member is pending verification (membership screening).
		 * @type {Boolean}
		 */
		this.pending = member.pending || false;

		/**
		 * The member's avatar hash in this guild.
		 * @type {?String}
		 */
		this.avatar = member.avatar;

		/**
		 * Array of role IDs this member has.
		 * @type {Array<String>}
		 * @scope roles_read
		 */
		ScopeManager.setProtectedValue(this, "roleIds", Array.from(member.roles.cache.keys()), scopes, Scopes.roles_read.scope);
	}

	/**
	 * The Date this member joined the guild.
	 * @type {?Date}
	 * @readonly
	 */
	get joinedAt () {
		return this.joinedTimestamp ? new Date(this.joinedTimestamp) : null;
	}

	/**
	 * The Date this member started boosting.
	 * @type {?Date}
	 * @readonly
	 */
	get premiumSince () {
		return this.premiumSinceTimestamp ? new Date(this.premiumSinceTimestamp) : null;
	}

	/**
	 * Whether this member is kickable by the bot.
	 * @type {Boolean}
	 * @readonly
	 */
	get kickable () {
		return privProps.get(this).member.kickable;
	}

	/**
	 * Whether this member is bannable by the bot.
	 * @type {Boolean}
	 * @readonly
	 */
	get bannable () {
		return privProps.get(this).member.bannable;
	}

	/**
	 * Whether this member is manageable by the bot.
	 * @type {Boolean}
	 * @readonly
	 */
	get manageable () {
		return privProps.get(this).member.manageable;
	}

	/**
	 * The URL to the member's guild avatar.
	 * @param {Object} [options] - Options for the avatar URL
	 * @returns {String}
	 */
	avatarURL (options = {}) {
		const member = privProps.get(this).member;
		return member.displayAvatarURL({
			format: options.format || "webp",
			size: options.size || 128,
		});
	}

	/**
	 * Check if the member has a specific role.
	 * @param {String} roleId - The role ID to check
	 * @returns {Boolean}
	 * @scope roles_read
	 */
	hasRole (roleId) {
		const { member, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.roles_read.scope);
		return member.roles.cache.has(roleId);
	}

	/**
	 * Add a role to this member.
	 * @param {String} roleId - The role ID to add
	 * @param {String} [reason] - Reason for adding the role
	 * @returns {Promise<Member>}
	 * @scope roles_manage
	 */
	async addRole (roleId, reason) {
		const { member, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.roles_manage.scope);
		await member.roles.add(roleId, reason).catch(serializeError);
		return this;
	}

	/**
	 * Remove a role from this member.
	 * @param {String} roleId - The role ID to remove
	 * @param {String} [reason] - Reason for removing the role
	 * @returns {Promise<Member>}
	 * @scope roles_manage
	 */
	async removeRole (roleId, reason) {
		const { member, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.roles_manage.scope);
		await member.roles.remove(roleId, reason).catch(serializeError);
		return this;
	}

	/**
	 * Set the member's nickname.
	 * @param {?String} nickname - The new nickname, or null to remove
	 * @param {String} [reason] - Reason for the nickname change
	 * @returns {Promise<Member>}
	 * @scope members_manage
	 */
	async setNickname (nickname, reason) {
		const { member, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.members_manage.scope);
		await member.setNickname(nickname, reason).catch(serializeError);
		this.nickname = nickname;
		this.displayName = nickname || this.user.username;
		return this;
	}

	/**
	 * Kick this member from the guild.
	 * @param {String} [reason] - Reason for the kick
	 * @returns {Promise<Member>}
	 * @scope kick
	 */
	async kick (reason) {
		const { member, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.kick.scope);
		await member.kick(reason).catch(serializeError);
		return this;
	}

	/**
	 * Ban this member from the guild.
	 * @param {Object} [options] - Ban options
	 * @param {String} [options.reason] - Reason for the ban
	 * @param {Number} [options.deleteMessageDays] - Days of messages to delete (0-7)
	 * @returns {Promise<Member>}
	 * @scope ban
	 */
	async ban (options = {}) {
		const { member, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.ban.scope);
		await member.ban({
			reason: options.reason,
			deleteMessageDays: options.deleteMessageDays,
		}).catch(serializeError);
		return this;
	}

	/**
	 * Timeout this member.
	 * @param {Number} duration - Timeout duration in milliseconds
	 * @param {String} [reason] - Reason for the timeout
	 * @returns {Promise<Member>}
	 * @scope members_manage
	 */
	async timeout (duration, reason) {
		const { member, scopes } = privProps.get(this);
		ScopeManager.check(scopes, Scopes.members_manage.scope);
		await member.timeout(duration, reason).catch(serializeError);
		return this;
	}

	/**
	 * Get a string representation (mention) of the member.
	 * @returns {String}
	 */
	toString () {
		return `<@${this.id}>`;
	}

	/**
	 * Convert to a plain object for serialization.
	 * @returns {Object}
	 */
	toJSON () {
		return {
			id: this.id,
			nickname: this.nickname,
			displayName: this.displayName,
			user: this.user.toJSON(),
			isOwner: this.isOwner,
			joinedTimestamp: this.joinedTimestamp,
			premiumSinceTimestamp: this.premiumSinceTimestamp,
			pending: this.pending,
		};
	}
}

module.exports = Member;
