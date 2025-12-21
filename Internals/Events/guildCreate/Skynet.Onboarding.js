const BaseEvent = require("../BaseEvent.js");
const { Colors } = require("../../Constants.js");
const { PermissionFlagsBits } = require("discord.js");

class Onboarding extends BaseEvent {
	async handle (guild, isNewServer) {
		// Only send onboarding DMs for first-time joins
		if (!isNewServer) return;

		try {
			const recipients = await this.getOnboardingRecipients(guild);
			const embed = await this.buildOnboardingEmbed(guild);

			for (const user of recipients) {
				await this.sendOnboardingDM(user, embed);
			}

			logger.info(`Sent onboarding DMs to ${recipients.length} user(s)`, { svrid: guild.id });
		} catch (err) {
			logger.warn("Error sending onboarding DMs", { svrid: guild.id }, err);
		}
	}

	/**
	 * Get users who should receive onboarding DMs
	 * @param {Guild} guild
	 * @returns {Promise<User[]>}
	 */
	async getOnboardingRecipients (guild) {
		const recipients = new Map();

		// Always include server owner
		try {
			const owner = await guild.fetchOwner();
			if (owner && !owner.user.bot) {
				recipients.set(owner.id, owner.user);
			}
		} catch (err) {
			logger.debug("Could not fetch guild owner for onboarding", { svrid: guild.id });
		}

		// Find the top role with Administrator permission (excluding bots)
		const rolesWithAdmin = guild.roles.cache
			.filter(role => role.permissions.has(PermissionFlagsBits.Administrator) && !role.managed)
			.sort((a, b) => b.position - a.position);

		if (rolesWithAdmin.size > 0) {
			const topAdminRole = rolesWithAdmin.first();

			// Get members with this role (excluding bots and already-added owner)
			const membersWithRole = topAdminRole.members.filter(member => !member.user.bot);

			for (const [memberId, member] of membersWithRole) {
				if (!recipients.has(memberId)) {
					recipients.set(memberId, member.user);
				}
			}
		}

		return Array.from(recipients.values());
	}

	/**
	 * Build the onboarding embed message
	 * @param {Guild} guild
	 * @returns {Promise<Object>}
	 */
	async buildOnboardingEmbed (guild) {
		const dashboardUrl = `${configJS.hostingURL}/dashboard/${guild.id}`;
		const supportUrl = `${configJS.hostingURL}/support`;
		const docsUrl = `${configJS.hostingURL}/wiki`;

		// Fetch server document to get the configured prefix
		let prefix = "!";
		try {
			const serverDocument = await Servers.findOne(guild.id);
			if (serverDocument?.config?.command_prefix) {
				prefix = serverDocument.config.command_prefix;
			}
		} catch (err) {
			// Use default prefix
		}

		return {
			color: Colors.INFO,
			author: {
				name: `Welcome to ${this.client.user.username}!`,
				icon_url: this.client.user.displayAvatarURL({ dynamic: true }),
			},
			title: `🎉 Thanks for adding me to ${guild.name}!`,
			description: `I'm now ready to help manage and enhance your server. Here's how to get started:`,
			fields: [
				{
					name: "📊 Dashboard",
					value: `Configure me through the web dashboard:\n${dashboardUrl}`,
					inline: false,
				},
				{
					name: "⌨️ Commands",
					value: `**Prefix:** \`${prefix}\`\n**Help:** \`${prefix}help\` or \`/help\`\n**Command List:** \`${prefix}commands\``,
					inline: true,
				},
				{
					name: "🔧 Quick Setup",
					value: `Use \`${prefix}config\` or the dashboard to:\n• Set up moderation\n• Configure welcome messages\n• Enable fun commands`,
					inline: true,
				},
				{
					name: "📚 Resources",
					value: `[Documentation](${docsUrl}) • [Support](${supportUrl})`,
					inline: false,
				},
			],
			footer: {
				text: `Server: ${guild.name} • ${guild.memberCount} members`,
				icon_url: guild.iconURL({ dynamic: true }) || undefined,
			},
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Send onboarding DM to a user (silently fails)
	 * @param {User} user
	 * @param {Object} embed
	 */
	async sendOnboardingDM (user, embed) {
		try {
			await user.send({ embeds: [embed] });
		} catch (err) {
			// Silent ignore - user may have DMs disabled
		}
	}
}

module.exports = Onboarding;
