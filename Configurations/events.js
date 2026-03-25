module.exports = {
	/**
	 * The keys represent the event name
	 * The values represent the event file names that will be ran once any event happen.
	 * Read more on the discord.js page: https://discord.js.org/#/docs/main/master/class/Client
	 * !!! DO NOT ADD .js AT THE END OF THE NAME !!!
	 * @type {string[]}
	 */
	rateLimit: [

	],
	ready: [
		"Skynet.Ready",
	],
	resumed: [

	],
	guildCreate: [
		"Skynet.GuildCreate",
	],
	guildDelete: [
		"Skynet.GuildDelete",
	],
	guildUpdate: [
		"Skynet.GuildUpdate",
	],
	guildUnavailable: [
		"Skynet.GuildUnavailable",
	],
	guildAvailable: [

	],
	guildMemberAdd: [
		"Skynet.GuildMemberAdd",
		"Skynet.ModLogMemberAdd",
	],
	guildMemberRemove: [
		"Skynet.GuildMemberRemove",
		"Skynet.ModLogMemberRemove",
	],
	guildMemberUpdate: [
		"Skynet.GuildMemberUpdate",
	],
	guildMemberAvailable: [

	],
	guildMemberSpeaking: [

	],
	guildMembersChunk: [

	],
	roleCreate: [
		"Skynet.ModLogRoleCreate",
	],
	roleDelete: [
		"Skynet.RoleDelete",
		"Skynet.ModLogRoleDelete",
	],
	roleUpdate: [
		"Skynet.ModLogRoleUpdate",
	],
	emojiCreate: [

	],
	emojiDelete: [

	],
	emojiUpdate: [

	],
	guildBanAdd: [
		"Skynet.GuildBanAdd",
	],
	guildBanRemove: [
		"Skynet.GuildBanRemove",
	],
	channelCreate: [
		"Skynet.ModLogChannelCreate",
	],
	channelDelete: [
		"Skynet.ChannelDelete",
		"Skynet.ModLogChannelDelete",
	],
	channelUpdate: [
		"Skynet.ModLogChannelUpdate",
	],
	channelPinsUpdate: [

	],
	message: [
		"Skynet.MessageCreate",
		"Skynet.SpamHandler",
		"Skynet.VoteHandler",
		"Skynet.AFKHandler",
		"Skynet.UsernameHandler",
		"Skynet.SharedCommandMessageHandler",
		// "Skynet.Translation",
		// "Skynet.OtherFilters",
	],
	messageCreate: [
		"Skynet.MessageCreate",
		"Skynet.SpamHandler",
		"Skynet.VoteHandler",
		"Skynet.AFKHandler",
		"Skynet.UsernameHandler",
		"Skynet.SharedCommandMessageHandler",
	],
	messageDelete: [
		"Skynet.MessageDelete",
	],
	messageUpdate: [
		"Skynet.MessageCommandUpdateHandler",
		"Skynet.MessageUpdate",
	],
	messageDeleteBulk: [
		"Skynet.MessageDeleteBulk",
	],
	messageReactionAdd: [

	],
	messageReactionRemove: [

	],
	messageReactionRemoveAll: [

	],
	userUpdate: [
		"Skynet.UpdateUsername",
		"Skynet.UserUpdate",
	],
	presenceUpdate: [
		"Skynet.PresenceUpdate",
	],
	voiceStateUpdate: [
		"Skynet.VoiceStateUpdate",
	],
	disconnect: [

	],
	error: [

	],
	warn: [

	],
};
