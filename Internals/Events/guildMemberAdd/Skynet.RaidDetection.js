const BaseEvent = require("../BaseEvent.js");
const { LoggingLevels, Colors } = require("../../Constants");
const { create: CreateModLog } = require("../../../Modules/ModLog");
const TierManager = require("../../../Modules/TierManager");

// In-memory storage for join tracking per guild
const joinTracker = new Map();

/**
 * Raid and Alt Detection for member joins
 */
class RaidDetection extends BaseEvent {
	async handle (member) {
		if (member.user.bot) return;

		const serverDocument = await Servers.findOne(member.guild.id);
		if (!serverDocument) return;

		const moderation = serverDocument.config.moderation;
		if (!moderation?.isEnabled) return;

		const filters = moderation.filters || {};

		// Check Tier 2 for premium features
		const hasTier2 = await TierManager.hasMinimumTierLevel(member.guild.id, 2);

		// Run alt check if enabled and has tier
		if (hasTier2 && filters.altcheck?.isEnabled) {
			await this.handleAltCheck(member, serverDocument, filters.altcheck);
		}

		// Run antiraid check if enabled and has tier
		if (hasTier2 && filters.antiraid?.isEnabled) {
			await this.handleAntiraid(member, serverDocument, filters.antiraid);
		}
	}

	async handleAltCheck (member, serverDocument, altcheck) {
		// Check whitelist
		const whitelist = altcheck.whitelist_user_ids || [];
		if (whitelist.includes(member.id)) return;

		// Calculate account age
		const accountAgeMs = Date.now() - member.user.createdAt.getTime();
		const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));
		const minAge = altcheck.min_account_age_days || 7;

		if (accountAgeDays >= minAge) return;

		logger.verbose(`Alt detection triggered for "${member.user.tag}" (${accountAgeDays} days old)`, {
			svrid: member.guild.id,
			usrid: member.id,
		});

		// Get log channel
		const logChannelId = altcheck.log_channel_id || serverDocument.modlog?.channel_id;
		const logChannel = logChannelId ? member.guild.channels.cache.get(logChannelId) : null;

		// Send alert
		const alertEmbed = {
			color: Colors.TRIVIA_WRONG || 0xFF6B6B,
			title: "🔍 Potential Alt Account Detected",
			thumbnail: { url: member.user.displayAvatarURL() },
			fields: [
				{ name: "User", value: `${member.user.tag} (${member.id})`, inline: true },
				{ name: "Account Age", value: `${accountAgeDays} days`, inline: true },
				{ name: "Threshold", value: `${minAge} days`, inline: true },
				{ name: "Created At", value: `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:F>`, inline: false },
			],
			timestamp: new Date().toISOString(),
		};

		if (logChannel) {
			await logChannel.send({ embeds: [alertEmbed] }).catch(() => null);
		}

		// Take action
		const action = altcheck.action || "flag";

		switch (action) {
			case "quarantine": {
				const quarantineRoleId = altcheck.quarantine_role_id;
				if (quarantineRoleId) {
					const role = member.guild.roles.cache.get(quarantineRoleId);
					if (role) {
						try {
							await member.roles.add(role, "Alt account detection - quarantine");
							this.client.logMessage(serverDocument, LoggingLevels.INFO,
								`Quarantined potential alt "${member.user.tag}" (account age: ${accountAgeDays} days)`,
								null, member.id);
						} catch (err) {
							logger.debug("Failed to add quarantine role", { svrid: member.guild.id, usrid: member.id }, err);
						}
					}
				}
				break;
			}

			case "kick": {
				try {
					await member.send({
						embeds: [{
							color: 0xFF0000,
							title: `Removed from ${member.guild.name}`,
							description: "Your account was flagged as a potential alt account due to its age. Please contact a moderator if this was a mistake.",
						}],
					}).catch(() => null);

					await member.kick("Alt account detection - account too new");
					CreateModLog(member.guild, "Kick (Alt Detection)", member, null,
						`Account age: ${accountAgeDays} days (min: ${minAge} days)`);
				} catch (err) {
					logger.debug("Failed to kick suspected alt", { svrid: member.guild.id, usrid: member.id }, err);
				}
				break;
			}

			case "ban": {
				try {
					await member.send({
						embeds: [{
							color: 0xFF0000,
							title: `Banned from ${member.guild.name}`,
							description: "Your account was flagged as a potential alt account due to its age.",
						}],
					}).catch(() => null);

					await member.ban({
						deleteMessageSeconds: 0,
						reason: "Alt account detection - account too new",
					});
					CreateModLog(member.guild, "Ban (Alt Detection)", member, null,
						`Account age: ${accountAgeDays} days (min: ${minAge} days)`);
				} catch (err) {
					logger.debug("Failed to ban suspected alt", { svrid: member.guild.id, usrid: member.id }, err);
				}
				break;
			}

			case "flag":
			default:
				this.client.logMessage(serverDocument, LoggingLevels.INFO,
					`Flagged potential alt "${member.user.tag}" (account age: ${accountAgeDays} days)`,
					null, member.id);
				break;
		}
	}

	async handleAntiraid (member, serverDocument, antiraid) {
		const guildId = member.guild.id;
		const now = Date.now();
		const timeWindow = (antiraid.time_window || 10) * 1000;
		const threshold = antiraid.join_threshold || 10;

		// Initialize tracker for this guild
		if (!joinTracker.has(guildId)) {
			joinTracker.set(guildId, {
				joins: [],
				isRaidMode: false,
				raidModeEnds: 0,
			});
		}

		const tracker = joinTracker.get(guildId);

		// Clean old entries
		tracker.joins = tracker.joins.filter(j => now - j.time < timeWindow);

		// Check if member has whitelisted role (unlikely for new joins, but check anyway)
		const whitelistRoles = antiraid.whitelist_role_ids || [];
		const hasWhitelistedRole = member.roles.cache.some(r => whitelistRoles.includes(r.id));
		if (hasWhitelistedRole) return;

		// Add this join
		tracker.joins.push({
			userId: member.id,
			time: now,
		});

		// Check if raid mode is active
		if (tracker.isRaidMode && now < tracker.raidModeEnds) {
			// We're in raid mode - handle this join
			await this.handleRaidJoin(member, serverDocument, antiraid);
			return;
		}

		// Check if we've hit the threshold
		if (tracker.joins.length >= threshold) {
			// Trigger raid mode
			tracker.isRaidMode = true;
			const lockdownDuration = (antiraid.lockdown_duration || 300) * 1000;
			tracker.raidModeEnds = now + lockdownDuration;

			logger.warn(`Raid detected in "${member.guild.name}" - ${tracker.joins.length} joins in ${antiraid.time_window}s`, {
				svrid: guildId,
			});

			// Get log channel
			const logChannelId = antiraid.log_channel_id || serverDocument.modlog?.channel_id;
			const logChannel = logChannelId ? member.guild.channels.cache.get(logChannelId) : null;

			// Send raid alert
			const alertEmbed = {
				color: 0xFF0000,
				title: "🚨 RAID DETECTED",
				description: `**${tracker.joins.length} members** joined within **${antiraid.time_window} seconds**!`,
				fields: [
					{ name: "Action", value: antiraid.action || "lockdown", inline: true },
					{ name: "Duration", value: `${Math.floor(lockdownDuration / 60000)} minutes`, inline: true },
					{ name: "Threshold", value: `${threshold} joins / ${antiraid.time_window}s`, inline: true },
				],
				timestamp: new Date().toISOString(),
			};

			if (logChannel) {
				await logChannel.send({
					content: "@here",
					embeds: [alertEmbed],
				}).catch(() => null);
			}

			// Notify admins
			await this.client.messageBotAdmins(member.guild, serverDocument, {
				embeds: [alertEmbed],
			});

			CreateModLog(member.guild, "Raid Detected", null, null,
				`${tracker.joins.length} joins in ${antiraid.time_window}s - Action: ${antiraid.action}`);

			// Handle recent joins during raid
			for (const join of tracker.joins) {
				const raidMember = member.guild.members.cache.get(join.userId);
				if (raidMember && !raidMember.user.bot) {
					await this.handleRaidJoin(raidMember, serverDocument, antiraid);
				}
			}

			// Schedule raid mode end
			setTimeout(() => {
				const currentTracker = joinTracker.get(guildId);
				if (currentTracker) {
					currentTracker.isRaidMode = false;
					currentTracker.joins = [];
					logger.info(`Raid mode ended for "${member.guild.name}"`, { svrid: guildId });

					if (logChannel) {
						logChannel.send({
							embeds: [{
								color: 0x00FF00,
								title: "✅ Raid Mode Ended",
								description: "The server has returned to normal operation.",
								timestamp: new Date().toISOString(),
							}],
						}).catch(() => null);
					}
				}
			}, lockdownDuration);
		}
	}

	async handleRaidJoin (member, serverDocument, antiraid) {
		const action = antiraid.action || "lockdown";
		const minAccountAge = antiraid.min_account_age || 7;
		const accountAgeDays = Math.floor((Date.now() - member.user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

		// If account is young, definitely handle it
		const isYoungAccount = accountAgeDays < minAccountAge;

		switch (action) {
			case "kick": {
				try {
					await member.send({
						embeds: [{
							color: 0xFF0000,
							title: `Removed from ${member.guild.name}`,
							description: "The server is currently under raid protection. Please try joining again later.",
						}],
					}).catch(() => null);

					await member.kick("Anti-raid protection");
				} catch (err) {
					logger.debug("Failed to kick raid member", { svrid: member.guild.id, usrid: member.id }, err);
				}
				break;
			}

			case "ban": {
				if (isYoungAccount) {
					try {
						await member.send({
							embeds: [{
								color: 0xFF0000,
								title: `Banned from ${member.guild.name}`,
								description: "You were banned due to suspected raid participation.",
							}],
						}).catch(() => null);

						await member.ban({
							deleteMessageSeconds: 86400,
							reason: "Anti-raid protection - young account during raid",
						});
					} catch (err) {
						logger.debug("Failed to ban raid member", { svrid: member.guild.id, usrid: member.id }, err);
					}
				}
				break;
			}

			case "lockdown":
			case "notify":
			default:
				// Just log - lockdown would prevent joins at Discord level if configured
				this.client.logMessage(serverDocument, LoggingLevels.INFO,
					`Raid join tracked: "${member.user.tag}" (age: ${accountAgeDays} days)`,
					null, member.id);
				break;
		}
	}
}

module.exports = RaidDetection;
