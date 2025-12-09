/**
 * Additional Passport OAuth Strategies for linked accounts
 *
 * These strategies are used for linking additional accounts (Google, GitHub, Twitch, Patreon)
 * to an existing Discord-authenticated user. They do NOT replace Discord as the primary auth.
 */

const GoogleStrategy = require("passport-google-oauth20")?.Strategy;
const GitHubStrategy = require("passport-github2")?.Strategy;
const TwitchStrategy = require("passport-twitch-new")?.Strategy;
const PatreonStrategy = require("passport-patreon")?.Strategy;

const TierManager = require("../Modules/TierManager");

/**
 * Initialize additional OAuth strategies
 * @param {object} passport - Passport instance
 * @param {object} configJS - Config object
 */
module.exports = async (passport, configJS) => {
	const siteSettings = await TierManager.getSiteSettings();
	const oauthProviders = siteSettings?.oauth_providers || {};

	// Google OAuth Strategy
	if (oauthProviders.google?.isEnabled && process.env.GOOGLE_OAUTH_CLIENT_ID && GoogleStrategy) {
		passport.use("google-link", new GoogleStrategy({
			clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
			clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
			callbackURL: `${configJS.hostingURL}auth/google/callback`,
			passReqToCallback: true,
		}, async (req, accessToken, refreshToken, profile, done) => {
			try {
				// User must already be logged in via Discord
				if (!req.user?.id) {
					return done(null, false, { message: "You must be logged in to link accounts" });
				}

				const linkedAccount = {
					_id: "google",
					provider_user_id: profile.id,
					username: profile.displayName,
					email: profile.emails?.[0]?.value,
					avatar_url: profile.photos?.[0]?.value,
					linked_at: new Date(),
					// TODO: encrypt tokens before storing
					access_token_encrypted: accessToken,
					refresh_token_encrypted: refreshToken,
				};

				// Save to user document
				let user = await Users.findOne(req.user.id);
				if (!user) {
					user = Users.new({ _id: req.user.id });
				}

				// Remove existing Google link if present
				const existingAccounts = user.linked_accounts?.filter(a => a._id !== "google") || [];
				existingAccounts.push(linkedAccount);
				user.query.set("linked_accounts", existingAccounts);
				await user.save();

				return done(null, req.user);
			} catch (err) {
				logger.error("Google OAuth link error", {}, err);
				return done(err);
			}
		}));
		logger.info("Google OAuth strategy initialized for account linking");
	}

	// GitHub OAuth Strategy
	if (oauthProviders.github?.isEnabled && process.env.GITHUB_OAUTH_CLIENT_ID && GitHubStrategy) {
		passport.use("github-link", new GitHubStrategy({
			clientID: process.env.GITHUB_OAUTH_CLIENT_ID,
			clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
			callbackURL: `${configJS.hostingURL}auth/github/callback`,
			passReqToCallback: true,
		}, async (req, accessToken, refreshToken, profile, done) => {
			try {
				if (!req.user?.id) {
					return done(null, false, { message: "You must be logged in to link accounts" });
				}

				const linkedAccount = {
					_id: "github",
					provider_user_id: profile.id,
					username: profile.username,
					email: profile.emails?.[0]?.value,
					avatar_url: profile.photos?.[0]?.value,
					linked_at: new Date(),
					access_token_encrypted: accessToken,
					refresh_token_encrypted: refreshToken,
				};

				let user = await Users.findOne(req.user.id);
				if (!user) {
					user = Users.new({ _id: req.user.id });
				}

				const existingAccounts = user.linked_accounts?.filter(a => a._id !== "github") || [];
				existingAccounts.push(linkedAccount);
				user.query.set("linked_accounts", existingAccounts);
				await user.save();

				return done(null, req.user);
			} catch (err) {
				logger.error("GitHub OAuth link error", {}, err);
				return done(err);
			}
		}));
		logger.info("GitHub OAuth strategy initialized for account linking");
	}

	// Twitch OAuth Strategy
	if (oauthProviders.twitch?.isEnabled && process.env.TWITCH_OAUTH_CLIENT_ID && TwitchStrategy) {
		passport.use("twitch-link", new TwitchStrategy({
			clientID: process.env.TWITCH_OAUTH_CLIENT_ID,
			clientSecret: process.env.TWITCH_OAUTH_CLIENT_SECRET,
			callbackURL: `${configJS.hostingURL}auth/twitch/callback`,
			scope: "user:read:email",
			passReqToCallback: true,
		}, async (req, accessToken, refreshToken, profile, done) => {
			try {
				if (!req.user?.id) {
					return done(null, false, { message: "You must be logged in to link accounts" });
				}

				const linkedAccount = {
					_id: "twitch",
					provider_user_id: profile.id,
					username: profile.display_name || profile.login,
					email: profile.email,
					avatar_url: profile.profile_image_url,
					linked_at: new Date(),
					access_token_encrypted: accessToken,
					refresh_token_encrypted: refreshToken,
				};

				let user = await Users.findOne(req.user.id);
				if (!user) {
					user = Users.new({ _id: req.user.id });
				}

				const existingAccounts = user.linked_accounts?.filter(a => a._id !== "twitch") || [];
				existingAccounts.push(linkedAccount);
				user.query.set("linked_accounts", existingAccounts);
				await user.save();

				return done(null, req.user);
			} catch (err) {
				logger.error("Twitch OAuth link error", {}, err);
				return done(err);
			}
		}));
		logger.info("Twitch OAuth strategy initialized for account linking");
	}

	// Patreon OAuth Strategy
	if (oauthProviders.patreon?.isEnabled && process.env.PATREON_CLIENT_ID && PatreonStrategy) {
		passport.use("patreon-link", new PatreonStrategy({
			clientID: process.env.PATREON_CLIENT_ID,
			clientSecret: process.env.PATREON_CLIENT_SECRET,
			callbackURL: `${configJS.hostingURL}auth/patreon/callback`,
			scope: "identity identity[email] campaigns campaigns.members",
			passReqToCallback: true,
		}, async (req, accessToken, refreshToken, profile, done) => {
			try {
				if (!req.user?.id) {
					return done(null, false, { message: "You must be logged in to link accounts" });
				}

				const linkedAccount = {
					_id: "patreon",
					provider_user_id: profile.id,
					username: profile.attributes?.full_name || profile.attributes?.vanity,
					email: profile.attributes?.email,
					avatar_url: profile.attributes?.image_url,
					linked_at: new Date(),
					access_token_encrypted: accessToken,
					refresh_token_encrypted: refreshToken,
				};

				let user = await Users.findOne(req.user.id);
				if (!user) {
					user = Users.new({ _id: req.user.id });
				}

				const existingAccounts = user.linked_accounts?.filter(a => a._id !== "patreon") || [];
				existingAccounts.push(linkedAccount);
				user.query.set("linked_accounts", existingAccounts);
				await user.save();

				// Check if user has an active pledge and assign tier
				if (profile.pledges?.length > 0) {
					const tierMapping = oauthProviders.patreon?.tier_mapping || [];
					for (const pledge of profile.pledges) {
						const mapping = tierMapping.find(m => m._id === pledge.reward?.id);
						if (mapping) {
							await TierManager.setUserTier(req.user.id, mapping.local_tier_id, "patreon", null, "patreon_link");
							break;
						}
					}
				}

				return done(null, req.user);
			} catch (err) {
				logger.error("Patreon OAuth link error", {}, err);
				return done(err);
			}
		}));
		logger.info("Patreon OAuth strategy initialized for account linking");
	}
};
