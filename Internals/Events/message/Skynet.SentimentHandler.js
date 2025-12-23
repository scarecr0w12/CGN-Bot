const BaseEvent = require("../BaseEvent.js");
const BatchWriteManager = require("../../../Modules/BatchWriteManager");
const { LoggingLevels, Colors } = require("../../Constants");
const TierManager = require("../../../Modules/TierManager");
const SentimentAnalyzer = require("../../../Modules/SentimentAnalyzer");

// Track recent violations per user for escalation
const recentViolations = new Map();

class SentimentHandler extends BaseEvent {
	constructor (client) {
		super(client);
		this.analyzer = new SentimentAnalyzer(client);
	}

	requirements (msg) {
		if (!msg.guild) return false;
		if (msg.author.bot) return false;
		return !msg.editedAt && msg.type === "DEFAULT";
	}

	async handle (msg) {
		const serverDocument = await Servers.findOne(msg.guild.id);
		if (!serverDocument) {
			return;
		}

		// Check if moderation and sentiment filter are enabled
		if (!serverDocument.config.moderation?.isEnabled) return;

		const sentimentConfig = serverDocument.config.moderation?.filters?.sentiment_filter;
		if (!sentimentConfig?.isEnabled) return;

		// Check if channel is excluded
		if (sentimentConfig.disabled_channel_ids?.includes(msg.channel.id)) return;

		// Check tier access (Tier 1 feature)
		const hasAccess = await TierManager.canAccess(msg.guild.id, "sentiment_analysis");
		if (!hasAccess) return;

		// Check if user is admin (skip admins)
		const memberAdminLevel = this.client.getUserBotAdmin(msg.guild, serverDocument, msg.member);
		if (memberAdminLevel >= 1) return;

		// Check message length
		if (msg.content.length < (sentimentConfig.min_message_length || 10)) return;

		// Analyze sentiment
		const result = await this.analyzer.analyze(msg.content, sentimentConfig, serverDocument);

		if (result.skip) {
			return;
		}

		// Check if action should be triggered
		const actionResult = this.analyzer.shouldTriggerAction(result, sentimentConfig);

		if (!actionResult.shouldAct) {
			return;
		}

		// Log the detection
		this.client.logMessage(
			serverDocument,
			LoggingLevels.INFO,
			`Sentiment violation detected from "${msg.author.tag}": ${actionResult.reasons.join(", ")}`,
			msg.channel.id,
			msg.author.id,
		);

		// Get or create member document
		let memberDocument = serverDocument.members[msg.author.id];
		if (!memberDocument) {
			serverDocument.query.prop("members").push({ _id: msg.author.id });
			memberDocument = serverDocument.members[msg.author.id];
		}

		// Check for repeat violations and escalation
		const shouldEscalate = this._checkEscalation(
			msg.author.id,
			msg.guild.id,
			sentimentConfig,
		);

		// Determine action
		let action = sentimentConfig.action || "mute";
		if (shouldEscalate && sentimentConfig.escalate_on_repeat) {
			action = this._escalateAction(action);
		}

		// Delete message if configured
		if (sentimentConfig.delete_message) {
			try {
				await msg.delete();
			} catch (err) {
				logger.debug(`Failed to delete message for sentiment violation`, { svrid: msg.guild.id, msgid: msg.id }, err);
			}
		}

		// Log to configured channel
		if (sentimentConfig.log_channel_id) {
			await this._logViolation(msg, serverDocument, sentimentConfig, actionResult, result);
		}

		// Warn user if configured
		if (sentimentConfig.warn_user) {
			await this._warnUser(msg, actionResult);
		}

		// Take action if not "none" or "warn"
		if (action !== "none" && action !== "warn") {
			const userDocument = await Users.findOne(msg.author.id);
			if (userDocument) {
				const violatorRoleID = sentimentConfig.violator_role_id || null;
				await this.client.handleViolation(
					msg.guild,
					serverDocument,
					msg.channel,
					msg.member,
					userDocument,
					memberDocument,
					`Your message was flagged for ${actionResult.reasons.join(", ")}`,
					`**@${this.client.getName(serverDocument, msg.member, true)}** sent a message flagged for: ${actionResult.reasons.join(", ")}`,
					`Sentiment violation: ${actionResult.reasons.join(", ")}`,
					action,
					violatorRoleID,
				);
			}
		} else if (action === "warn") {
			// Add strike for warning
			const memberQueryDocument = serverDocument.query.id("members", memberDocument._id);
			memberQueryDocument.prop("strikes").push({
				admin: this.client.user.id,
				reason: `Sentiment warning: ${actionResult.reasons.join(", ")}`,
			});
		}

		BatchWriteManager.queue(serverDocument);
	}

	/**
	 * Check if user should face escalated action due to repeat violations
	 * @private
	 */
	_checkEscalation (userId, guildId, config) {
		const key = `${guildId}:${userId}`;
		const now = Date.now();
		const windowMs = (config.repeat_window_minutes || 60) * 60 * 1000;
		const threshold = config.repeat_threshold || 3;

		let violations = recentViolations.get(key) || [];

		// Filter to only recent violations within window
		violations = violations.filter(t => now - t < windowMs);

		// Add current violation
		violations.push(now);
		recentViolations.set(key, violations);

		// Clean up old entries periodically
		if (recentViolations.size > 10000) {
			const oldestAllowed = now - windowMs;
			for (const [k, v] of recentViolations.entries()) {
				const recent = v.filter(t => t > oldestAllowed);
				if (recent.length === 0) {
					recentViolations.delete(k);
				} else {
					recentViolations.set(k, recent);
				}
			}
		}

		return violations.length >= threshold;
	}

	/**
	 * Escalate action to next severity level
	 * @private
	 */
	_escalateAction (currentAction) {
		const escalationOrder = ["none", "warn", "block", "mute", "kick", "ban"];
		const currentIndex = escalationOrder.indexOf(currentAction);
		if (currentIndex < escalationOrder.length - 1) {
			return escalationOrder[currentIndex + 1];
		}
		return currentAction;
	}

	/**
	 * Log violation to configured channel
	 * @private
	 */
	async _logViolation (msg, serverDocument, config, actionResult, analysisResult) {
		const logChannel = msg.guild.channels.cache.get(config.log_channel_id);
		if (!logChannel) return;

		try {
			await logChannel.send({
				embeds: [{
					color: actionResult.severity === "high" ? Colors.RED : Colors.ORANGE,
					title: "🔍 Sentiment Violation Detected",
					fields: [
						{
							name: "User",
							value: `${msg.author.tag} (${msg.author.id})`,
							inline: true,
						},
						{
							name: "Channel",
							value: `<#${msg.channel.id}>`,
							inline: true,
						},
						{
							name: "Severity",
							value: actionResult.severity.toUpperCase(),
							inline: true,
						},
						{
							name: "Reasons",
							value: actionResult.reasons.join("\n") || "None",
							inline: false,
						},
						{
							name: "Sentiment Score",
							value: `${analysisResult.score?.toFixed(2) || "N/A"} (Provider: ${analysisResult.provider || "unknown"})`,
							inline: true,
						},
						{
							name: "Message Preview",
							value: msg.content.length > 200 ? `${msg.content.substring(0, 200)}...` : msg.content,
							inline: false,
						},
					],
					timestamp: new Date().toISOString(),
					footer: {
						text: `Message ID: ${msg.id}`,
					},
				}],
			});
		} catch (err) {
			logger.debug(`Failed to log sentiment violation`, { svrid: msg.guild.id }, err);
		}
	}

	/**
	 * Warn user about their message
	 * @private
	 */
	async _warnUser (msg, actionResult) {
		try {
			await msg.author.send({
				embeds: [{
					color: Colors.ORANGE,
					title: "⚠️ Message Flagged",
					description: `Your message in **${msg.guild.name}** was flagged by our content moderation system.`,
					fields: [
						{
							name: "Reason",
							value: actionResult.reasons.join(", "),
							inline: false,
						},
						{
							name: "Note",
							value: "Please keep conversations respectful. Repeated violations may result in further action.",
							inline: false,
						},
					],
					footer: {
						text: "This is an automated message",
					},
				}],
			});
		} catch (err) {
			// User may have DMs disabled
		}
	}
}

module.exports = SentimentHandler;
