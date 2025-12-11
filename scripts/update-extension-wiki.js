/* eslint-disable */
/**
 * Update Extension Development Wiki Page
 * Run with: node scripts/update-extension-wiki.js
 */

require("dotenv").config();
const Database = require("../Database/Driver");
const fs = require("fs");
const path = require("path");

async function updateExtensionWiki() {
	console.log("🚀 Updating Extension Development Wiki Page...\n");
	
	try {
		await Database.initialize();
		console.log("✅ Connected to database\n");
		
		const Wiki = global.Wiki;
		
		// Read the markdown content from the docs file
		const docPath = path.join(__dirname, "../docs/EXTENSION_DEVELOPMENT.md");
		const content = fs.readFileSync(docPath, "utf8");
		
		// Delete existing page if it exists, then create new one
		console.log("📝 Removing existing Extension-Development page if present...");
		try {
			await Wiki.delete({ _id: "Extension-Development" });
		} catch (e) {
			// Page might not exist, that's fine
		}
		
		// Small delay to ensure delete completes
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Create the page
		console.log("📝 Creating Extension-Development page...");
		const doc = Wiki.new({
			_id: "Extension-Development",
			content: content,
			reactions: [],
			updates: [{
				_id: "218536118591684613",
				timestamp: new Date(),
				diff: null,
			}],
		});
		await doc.save();
		console.log("✅ Page created successfully!")
		
		console.log("\n🌐 View at: /wiki/Extension-Development");
		
	} catch (error) {
		console.error("\n❌ Error:", error.message);
		throw error;
	} finally {
		process.exit(0);
	}
}

updateExtensionWiki().catch(err => {
	console.error(err);
	process.exit(1);
});
