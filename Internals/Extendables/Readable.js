const Extendable = require("../ExtendableBase");
const { PermissionFlagsBits } = require("discord.js");

module.exports = class extends Extendable {
	constructor () {
		super(["DMChannel", "TextChannel"], "readable");
	}

	get extend () {
		// Discord.js v14: guild.me is now guild.members.me
		return !this.guild || this.permissionsFor(this.guild.members.me).has(PermissionFlagsBits.ViewChannel);
	}
};
