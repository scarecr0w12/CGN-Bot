const Extendable = require("../ExtendableBase");
const { PermissionFlagsBits } = require("discord.js");

module.exports = class extends Extendable {
	constructor () {
		super(["DMChannel", "TextChannel"], "postable");
	}

	get extend () {
		// Discord.js v14: guild.me is now guild.members.me
		return !this.guild || (this.readable && this.permissionsFor(this.guild.members.me).has(PermissionFlagsBits.SendMessages));
	}
};
