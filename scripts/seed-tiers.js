/* eslint-disable */
/**
 * Seed script for tiers and features configuration
 * Run: node scripts/seed-tiers.js
 */

require("dotenv").config();
const Database = require("../Database/Driver");

const defaultFeatures = [
	{
		_id: "ai_chat",
		name: "AI Chat",
		description: "Access to AI-powered chat commands",
		isEnabled: true,
	},
	{
		_id: "ai_images",
		name: "AI Image Generation",
		description: "Generate images using AI",
		isEnabled: true,
	},
	{
		_id: "custom_prefix",
		name: "Custom Command Prefix",
		description: "Set a custom bot command prefix",
		isEnabled: true,
	},
	{
		_id: "custom_commands",
		name: "Unlimited Custom Commands",
		description: "Create unlimited custom tags/commands",
		isEnabled: true,
	},
	{
		_id: "auto_roles",
		name: "Auto Roles",
		description: "Automatically assign roles to new members",
		isEnabled: true,
	},
	{
		_id: "voice_features",
		name: "Voice Features",
		description: "Advanced voice channel features including temporary rooms",
		isEnabled: true,
	},
	{
		_id: "advanced_moderation",
		name: "Advanced Moderation",
		description: "Advanced moderation filters and automation",
		isEnabled: true,
	},
	{
		_id: "extended_logs",
		name: "Extended Logs",
		description: "Access to extended activity logs (1000+ entries)",
		isEnabled: true,
	},
	{
		_id: "advanced_stats",
		name: "Advanced Analytics",
		description: "Advanced server analytics and insights",
		isEnabled: true,
	},
	{
		_id: "export_data",
		name: "Data Export",
		description: "Export server data and configurations",
		isEnabled: true,
	},
	{
		_id: "custom_branding",
		name: "Custom Branding",
		description: "Customize bot responses with server branding",
		isEnabled: true,
	},
	{
		_id: "webhooks",
		name: "Webhooks",
		description: "Send webhook notifications for events",
		isEnabled: true,
	},
];

const defaultTiers = [
	{
		_id: "free",
		name: "Free",
		description: "Basic features for all servers",
		level: 0,
		price_monthly: 0,
		is_purchasable: false,
		is_default: true,
		color: "#888888",
		badge_icon: null,
		features: [], // Free tier gets NO premium features
	},
	{
		_id: "starter",
		name: "Starter",
		description: "Essential premium features",
		level: 1,
		price_monthly: 499, // $4.99 in cents
		is_purchasable: true,
		is_default: false,
		color: "#3273dc",
		badge_icon: "fa-star",
		features: [
			"custom_prefix",
			"custom_commands",
			"auto_roles",
		],
	},
	{
		_id: "premium",
		name: "Premium",
		description: "Full access to all premium features",
		level: 2,
		price_monthly: 999, // $9.99 in cents
		is_purchasable: true,
		is_default: false,
		color: "#ffdd57",
		badge_icon: "fa-crown",
		features: [
			"ai_chat",
			"ai_images",
			"custom_prefix",
			"custom_commands",
			"auto_roles",
			"voice_features",
			"advanced_moderation",
			"extended_logs",
			"advanced_stats",
			"export_data",
			"custom_branding",
			"webhooks",
		],
	},
];

async function seed() {
	const databaseType = process.env.DATABASE_TYPE || "mongodb";
	console.log(`Initializing ${databaseType} database...`);

	try {
		await Database.initialize();
		console.log("Connected successfully to database");

		const SiteSettings = global.SiteSettings;

		console.log("Looking for existing siteSettings...");
		let settings = await SiteSettings.findOne("main");

		if (!settings) {
			console.log("Creating new siteSettings document...");
			settings = SiteSettings.new({ _id: "main" });
		}

		console.log("Setting tiers...");
		settings.query.set("tiers", defaultTiers);

		console.log("Setting features...");
		settings.query.set("features", defaultFeatures);

		console.log("Setting yearly discount...");
		settings.query.set("yearly_discount", 20);

		console.log("Saving...");
		await settings.save();

		console.log("✅ Successfully seeded tiers and features!");
		console.log(`   - ${defaultTiers.length} tiers created`);
		console.log(`   - ${defaultFeatures.length} features created`);

		// Verify
		const verify = await SiteSettings.findOne("main");
		console.log("\nVerification:");
		console.log(`   - Tiers in DB: ${verify?.tiers?.length || 0}`);
		console.log(`   - Features in DB: ${verify?.features?.length || 0}`);

		process.exit(0);
	} catch (err) {
		console.error("❌ Error seeding tiers:", err);
		process.exit(1);
	}
}

seed();
