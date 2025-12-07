/**
 * Discord.js v14 Structure Extensions
 *
 * Discord.js v14 removed Structures.extend, so we use prototype extensions
 * and utility functions instead. This module adds Skynet-specific functionality
 * to Discord.js structures.
 */

const { Text, Colors } = require("../../Internals/Constants");
const { Error: SkynetError } = require("../../Internals/Errors");
const Gag = require("./Gag");
const { ChannelType, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, Guild, Message, GuildMember } = require("discord.js");

const IsObject = input => input && input.constructor === Object;

/**
 * Extend Guild prototype with GAB-specific methods
 */
function extendGuild() {
	// Add populateDocument method
	Guild.prototype.populateDocument = async function() {
		this.serverDocument = await Servers.findOne(this.id);
		return this.serverDocument;
	};

	// Add defaultChannel getter
	Object.defineProperty(Guild.prototype, "defaultChannel", {
		get: function() {
			if (this.channels.cache.filter(c => c.type === ChannelType.GuildText).size === 0) return null;

			const me = this.members.me;
			if (!me) return null;

			const generalChannel = this.channels.cache.find(ch =>
				(ch.name === "general" || ch.name === "mainchat") && ch.type === ChannelType.GuildText
			);
			if (generalChannel && generalChannel.permissionsFor(me).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
				return generalChannel;
			}
			const defaultChannel = this.channels.cache
				.filter(c => c.type === ChannelType.GuildText && c.permissionsFor(me).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]))
				.sort((a, b) => a.rawPosition - b.rawPosition)
				.first();
			return defaultChannel || null;
		},
		configurable: true,
	});

	// Add commandPrefix getter
	Object.defineProperty(Guild.prototype, "commandPrefix", {
		get: function() {
			return this.client.getCommandPrefix(this, this.serverDocument);
		},
		configurable: true,
	});

	// Add channel method
	Guild.prototype.channel = function(ch) {
		return this.channels.resolve(ch) || null;
	};
}

/**
 * Extend Message prototype with GAB-specific methods
 */
function extendMessage() {
	// Store responses on message
	const responseMap = new WeakMap();

	Object.defineProperty(Message.prototype, "responses", {
		get: function() { return responseMap.get(this) || null; },
		set: function(val) { responseMap.set(this, val); },
		configurable: true,
	});

	// Command object storage
	const commandObjectMap = new WeakMap();

	// Add build method
	Message.prototype.build = async function() {
		const { content } = this;

		if (this.guild && this.client.isReady) {
			await this.guild.populateDocument();
			const { serverDocument } = this.guild;
			try {
				const object = await this.client.checkCommandTag(content, serverDocument);
				commandObjectMap.set(this, object);
			} catch (e) {
				// Ignore errors
			}
		} else if (this.client.isReady) {
			let command = content.toLowerCase().trim();
			let suffix = null;
			if (command.includes(" ")) {
				command = command.split(/\s+/)[0].trim();
				suffix = content.replace(/[\r\n\t]/g, match => {
					const escapes = { "\r": "{r}", "\n": "{n}", "\t": "{t}" };
					return escapes[match] || match;
				}).split(/\s+/)
					.splice(1)
					.join(" ")
					.format({ n: "\n", r: "\r", t: "\t" })
					.trim();
			}
			commandObjectMap.set(this, { command, suffix });
		}
	};

	// Add command getter
	Object.defineProperty(Message.prototype, "command", {
		get: function() {
			const obj = commandObjectMap.get(this);
			return obj ? obj.command || null : null;
		},
		configurable: true,
	});

	// Add suffix getter
	Object.defineProperty(Message.prototype, "suffix", {
		get: function() {
			const obj = commandObjectMap.get(this);
			return obj ? obj.suffix || null : null;
		},
		configurable: true,
	});

	// Add send method
	Message.prototype.send = async function(content, options) {
		const _options = handleMessageOptions(content, options);

		if (!this.responses || typeof _options.files !== "undefined") {
			try {
				const mes = await this.channel.send(_options);
				if (typeof _options.files === "undefined") this.responses = Array.isArray(mes) ? mes : [mes];
				return mes;
			} catch (err) {
				return handleSendError(this, err);
			}
		}

		let _content = _options.content;
		if (Array.isArray(_content)) _content = _content.join("\n");
		if (!Array.isArray(_content)) _content = [_content];

		const promises = [];
		const max = Math.max(_content.length, this.responses.length);

		for (let i = 0; i < max; i++) {
			if (i >= _content.length) this.responses[i].delete().catch(() => null);
			else if (this.responses.length > i) promises.push(this.responses[i].edit({ ..._options, content: _content[i] }));
			else promises.push(this.channel.send({ ..._options, content: _content[i] }));
		}

		try {
			this.responses = await Promise.all(promises);
			return this.responses.length < 2 ? this.responses[0] : this.responses;
		} catch (err) {
			return handleSendError(this, err);
		}
	};

	// Add sendError method
	Message.prototype.sendError = function(cmd, stack) {
		if (!this.client.debugMode) stack = "";
		return this.send({
			embeds: [{
				color: Colors.ERROR,
				title: Text.ERROR_TITLE(),
				description: !Gag(process.argv.slice(2)).owo ? Text.ERROR_BODY(cmd, stack) : Text.OWO_ERROR_BODY(),
				footer: { text: `Contact your Skynet maintainer for more support.` },
			}],
		});
	};

	// Add sendInvalidUsage method
	Message.prototype.sendInvalidUsage = function(commandData, title = "", footer = "") {
		return this.send({
			embeds: [{
				color: Colors.INVALID,
				title,
				description: Text.INVALID_USAGE(commandData, this.guild ? this.guild.commandPrefix : undefined),
				footer: { text: footer },
			}],
		});
	};
}

/**
 * Extend GuildMember prototype with GAB-specific methods
 */
function extendGuildMember() {
	Object.defineProperty(GuildMember.prototype, "memberDocument", {
		get: function() {
			let doc = this.guild.serverDocument?.members?.[this.id];
			if (!doc && this.guild.serverDocument) {
				this.guild.serverDocument.query.push("members", { _id: this.id });
				doc = this.guild.serverDocument.members[this.id];
			}
			return doc;
		},
		configurable: true,
	});
}

/**
 * Handle message options for Discord.js v14
 */
function handleMessageOptions(content, options = {}) {
	if (content instanceof EmbedBuilder) {
		options.embeds = [content];
	} else if (content instanceof AttachmentBuilder) {
		options.files = [content];
	} else if (IsObject(content)) {
		options = content;
	} else if (content !== undefined) {
		options.content = content;
	}
	return options;
}

/**
 * Handle send errors
 */
function handleSendError(message, err) {
	if (err.name === "DiscordAPIError") {
		switch (err.status) {
			case 403:
				logger.debug(`Failed to send a message to channel due to insufficient permissions.`, { chid: message.channel.id }, err);
				return null;
			case 404:
				logger.debug(`Failed to edit an unknown message.`, { chid: message.channel.id }, err);
				return null;
			default:
				throw new SkynetError("UNKNOWN_DISCORD_API_ERROR", { msgid: message.id }, err);
		}
	}
	throw new SkynetError("UNKNOWN_DISCORD_ERROR", { msgid: message.id }, err);
}

/**
 * Main export - call this to extend all structures
 */
module.exports = () => {
	extendGuild();
	extendMessage();
	extendGuildMember();
};
