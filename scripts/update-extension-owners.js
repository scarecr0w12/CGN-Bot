/**
 * Update all gallery extensions to set owner_id from BOT_MAINTAINERS
 * Run with: node scripts/update-extension-owners.js
 */

require("dotenv").config();
const Database = require("../Database/Driver");

(async () => {
	await Database.initialize({
		database: process.env.MARIADB_DATABASE || "skynet",
		username: process.env.MARIADB_USER || "skynet",
		password: process.env.MARIADB_PASSWORD,
		host: process.env.MARIADB_HOST || "localhost",
		port: parseInt(process.env.MARIADB_PORT) || 3306,
	});

	const ownerId = process.env.BOT_MAINTAINERS.split(",")[0].trim();
	console.log("Setting owner_id to:", ownerId);

	const extensions = await global.Gallery.find({ owner_id: "system" }).exec();
	console.log(`Found ${extensions.length} extensions with owner_id 'system'`);

	for (const ext of extensions) {
		// Use _setAtomic to register the $set operation for the custom ORM
		ext._setAtomic("owner_id", ownerId, "$set");
		await ext.save();
		console.log(`✅ Updated: ${ext.name}`);
	}

	console.log("\n🎉 Done!");
	process.exit(0);
})();
