/**
 * Cleanup script to remove duplicate extensions from the Gallery database.
 * These extensions duplicate built-in commands and should be removed.
 *
 * Run with: node scripts/cleanup-duplicate-extensions.js
 */

const path = require("path");
const fs = require("fs").promises;

// Extensions to remove - these duplicate built-in commands
const EXTENSIONS_TO_REMOVE = [
	{ name: "Dice Roll", key: "roll", reason: "Duplicates built-in roll command" },
	{ name: "Countdown Timer", key: "countdown", reason: "Duplicates built-in countdown command" },
	{ name: "Trivia", key: "trivia", reason: "Duplicates built-in trivia command" },
	{ name: "Reminder", key: "remind", reason: "Duplicates built-in remindme command" },
	{ name: "Todo List", key: "todo", reason: "Duplicates built-in list command" },
	{ name: "Leaderboard", key: "leaderboard", reason: "Duplicates built-in ranks/messages commands" },
	{ name: "Profile", key: "profile", reason: "Duplicates built-in profile command" },
	{ name: "Lottery", key: "lottery", reason: "Duplicates built-in lottery command" },
	{ name: "Poll", key: "poll", reason: "Duplicates built-in poll command" },
	{ name: "Emoji Info", key: "emoji", reason: "Duplicates built-in emoji command" },
];

async function cleanupDuplicateExtensions () {
	// Load environment and database
	require("dotenv").config();
	const Database = require("../Database/Driver");

	await Database.initialize({
		database: process.env.MARIADB_DATABASE || "skynet",
		username: process.env.MARIADB_USER || "skynet",
		password: process.env.MARIADB_PASSWORD,
		host: process.env.MARIADB_HOST || "localhost",
		port: parseInt(process.env.MARIADB_PORT) || 3306,
	});

	const Gallery = global.Gallery;

	console.log("🧹 Cleaning up duplicate extensions...\n");
	console.log("Extensions to remove:");
	EXTENSIONS_TO_REMOVE.forEach((ext, i) => {
		console.log(`  ${i + 1}. ${ext.name} (${ext.key}) - ${ext.reason}`);
	});
	console.log("");

	let removed = 0;
	let notFound = 0;
	const removedCodeIds = [];

	for (const ext of EXTENSIONS_TO_REMOVE) {
		try {
			// Try to find by name first
			let existing = await Gallery.findOne({ name: ext.name }).catch(() => null);

			// If not found by name, try by key in versions
			if (!existing) {
				const allExtensions = await Gallery.find({}).catch(() => []);
				existing = allExtensions.find(e =>
					e.versions && e.versions.some(v => v.key === ext.key),
				);
			}

			if (existing) {
				// Store code_id to clean up extension files
				if (existing.code_id) {
					removedCodeIds.push(existing.code_id);
				}
				if (existing.versions) {
					existing.versions.forEach(v => {
						if (v.code_id && !removedCodeIds.includes(v.code_id)) {
							removedCodeIds.push(v.code_id);
						}
					});
				}

				// Remove from database
				await Gallery.delete({ _id: existing._id });
				console.log(`✅ Removed "${ext.name}" (${ext.key})`);
				removed++;
			} else {
				console.log(`⏭️  Not found: "${ext.name}" (${ext.key}) - may already be removed`);
				notFound++;
			}
		} catch (err) {
			console.error(`❌ Error removing "${ext.name}":`, err.message);
		}
	}

	// Clean up orphaned extension files
	console.log("\n🗑️  Cleaning up extension files...");
	let filesRemoved = 0;
	for (const codeId of removedCodeIds) {
		const filePath = path.join(__dirname, `../extensions/${codeId}.skyext`);
		try {
			if (await fs.access(filePath).then(() => true).catch(() => false)) {
				await fs.unlink(filePath);
				console.log(`  Removed: ${codeId}.skyext`);
				filesRemoved++;
			}
		} catch (err) {
			console.error(`  Failed to remove ${codeId}.skyext:`, err.message);
		}
	}

	console.log(`\n📊 Summary:`);
	console.log(`  Extensions removed from database: ${removed}`);
	console.log(`  Extensions not found (already removed): ${notFound}`);
	console.log(`  Extension files cleaned up: ${filesRemoved}`);
	console.log("\n🎉 Cleanup complete!");

	process.exit(0);
}

cleanupDuplicateExtensions().catch(err => {
	console.error("Fatal error:", err);
	process.exit(1);
});
