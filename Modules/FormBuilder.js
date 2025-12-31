const Logger = require("../Internals/Logger");
const logger = new Logger("FormBuilder");

class FormBuilder {
	constructor (client) {
		this.client = client;
	}

	async createForm (serverConfig) {
		const Forms = this.client.database.models.forms;

		// Check tier limits
		const tierLimits = await this.checkTierLimits(serverConfig.server_id);
		if (!tierLimits.canAdd) {
			throw new Error(`Form limit reached. Upgrade to ${tierLimits.requiredTier} for more forms.`);
		}

		const form = await Forms.create({
			...serverConfig,
			created_at: new Date(),
			updated_at: new Date(),
		});

		logger.info(`Created form ${form.name} for server ${serverConfig.server_id}`);
		return form;
	}

	async submitForm (formId, userId, responses) {
		const Forms = this.client.database.models.forms;
		const FormResponses = this.client.database.models.formResponses;

		const form = await Forms.findOne({ _id: formId }).exec();
		if (!form || !form.enabled) {
			throw new Error("Form not found or disabled");
		}

		// Check monthly limit
		const monthStart = new Date();
		monthStart.setDate(1);
		monthStart.setHours(0, 0, 0, 0);

		const tierLimits = await this.checkResponseLimits(form.server_id);
		const currentCount = await FormResponses.find({
			server_id: form.server_id,
			submitted_at: { $gte: monthStart },
		}).exec().then(monthlyResponses => monthlyResponses.length);

		if (tierLimits.maxResponses !== -1 && currentCount >= tierLimits.maxResponses) {
			throw new Error("Monthly form response limit reached for this server.");
		}

		// Create response
		const response = await FormResponses.create({
			form_id: formId,
			server_id: form.server_id,
			user_id: userId,
			responses,
			status: "pending",
			submitted_at: new Date(),
		});

		// Send to submit channel
		if (form.submit_channel) {
			await this.sendFormSubmitNotification(form, response);
		}

		// Send to review channel
		if (form.review_channel) {
			await this.sendFormReviewNotification(form, response);
		}

		// Trigger webhook
		if (form.webhook_url) {
			await this.triggerWebhook(form, response);
		}

		logger.info(`Form response submitted for form ${formId} by user ${userId}`);
		return response;
	}

	async reviewResponse (responseId, reviewerId, action, notes = null) {
		const FormResponses = this.client.database.models.formResponses;
		const Forms = this.client.database.models.forms;

		const response = await FormResponses.findOne({ _id: responseId }).exec();
		if (!response) {
			throw new Error("Response not found");
		}

		const form = await Forms.findOne({ _id: response.form_id }).exec();
		if (!form) {
			throw new Error("Form not found");
		}

		// Update response
		await FormResponses.update(
			{ _id: responseId },
			{
				status: action,
				reviewed_by: reviewerId,
				review_notes: notes,
				reviewed_at: new Date(),
			},
		);

		// Auto-role assignment if approved
		if (action === "approved" && form.auto_role_id) {
			try {
				const guild = await this.client.guilds.fetch(form.server_id);
				const member = await guild.members.fetch(response.user_id);
				const role = guild.roles.cache.get(form.auto_role_id);
				if (role) {
					await member.roles.add(role);
					logger.info(`Assigned role ${role.name} to user ${response.user_id}`);
				}
			} catch (error) {
				logger.error("Failed to assign auto-role:", error);
			}
		}

		// Notify user
		try {
			const user = await this.client.users.fetch(response.user_id);
			const { EmbedBuilder } = require("discord.js");
			const embed = new EmbedBuilder()
				.setTitle(`Form Response ${action === "approved" ? "Approved" : "Rejected"}`)
				.setDescription(`Your submission for **${form.name}** has been ${action}.`)
				.setColor(action === "approved" ? "#57F287" : "#ED4245")
				.setTimestamp();

			if (notes) {
				embed.addFields({ name: "Review Notes", value: notes });
			}

			await user.send({ embeds: [embed] });
		} catch (error) {
			logger.warn("Failed to notify user:", error);
		}

		logger.info(`Form response ${responseId} ${action} by ${reviewerId}`);
	}

	async sendFormSubmitNotification (form, response) {
		try {
			const channel = await this.client.channels.fetch(form.submit_channel);
			const user = await this.client.users.fetch(response.user_id);

			const { EmbedBuilder } = require("discord.js");
			const embed = new EmbedBuilder()
				.setTitle(`✅ Form Submitted: ${form.name}`)
				.setDescription(`${user.tag} submitted a form response`)
				.setColor("#5865F2")
				.setTimestamp();

			for (const [key, value] of Object.entries(response.responses)) {
				embed.addFields({ name: key, value: String(value), inline: false });
			}

			await channel.send({ embeds: [embed] });
		} catch (error) {
			logger.error("Failed to send submit notification:", error);
		}
	}

	async sendFormReviewNotification (form, response) {
		try {
			const channel = await this.client.channels.fetch(form.review_channel);
			const user = await this.client.users.fetch(response.user_id);

			const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
			const embed = new EmbedBuilder()
				.setTitle(`📋 Form Review Required: ${form.name}`)
				.setDescription(`${user.tag} submitted a response`)
				.setColor("#FEE75C")
				.setFooter({ text: `Response ID: ${response._id}` })
				.setTimestamp();

			for (const [key, value] of Object.entries(response.responses)) {
				embed.addFields({ name: key, value: String(value), inline: false });
			}

			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId(`form_approve_${response._id}`)
						.setLabel("Approve")
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId(`form_reject_${response._id}`)
						.setLabel("Reject")
						.setStyle(ButtonStyle.Danger),
				);

			await channel.send({ embeds: [embed], components: [row] });
		} catch (error) {
			logger.error("Failed to send review notification:", error);
		}
	}

	async triggerWebhook (form, response) {
		try {
			const user = await this.client.users.fetch(response.user_id);
			const payload = {
				form_id: form._id,
				form_name: form.name,
				user_id: response.user_id,
				user_tag: user.tag,
				responses: response.responses,
				submitted_at: response.submitted_at,
			};

			await fetch(form.webhook_url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			logger.info(`Webhook triggered for form ${form._id}`);
		} catch (error) {
			logger.error("Failed to trigger webhook:", error);
		}
	}

	async checkTierLimits (serverId) {
		const TierManager = require("./TierManager");
		const tier = await TierManager.getServerTier(serverId);

		const limits = {
			free: 2,
			starter: 5,
			premium: -1,
		};

		const Forms = this.client.database.models.forms;
		const currentCount = await Forms.find({ server_id: serverId }).exec().then(forms => forms.length);
		const maxForms = limits[tier] || 0;

		if (maxForms === -1) {
			return { canAdd: true, current: currentCount, max: "Unlimited" };
		}

		return {
			canAdd: currentCount < maxForms,
			current: currentCount,
			max: maxForms,
			requiredTier: currentCount >= maxForms ? tier === "free" ? "Tier 1" : "Tier 2" : null,
		};
	}

	async checkResponseLimits (serverId) {
		const TierManager = require("./TierManager");
		const tier = await TierManager.getServerTier(serverId);

		const limits = {
			free: 50,
			starter: 200,
			premium: -1,
		};

		return {
			maxResponses: limits[tier] || 0,
		};
	}
}

module.exports = FormBuilder;
