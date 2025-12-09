const path = require("path");
const fs = require("fs");
const { loadConfigs } = require("../Configurations/env");
const database = require("../Database/Driver.js");

// Adjust path if run from root or scripts folder
const rootDir = path.resolve(__dirname, "..");

const runMigration = async () => {
	console.log("Loading configurations...");
	const { configJS } = loadConfigs();

	console.log("Connecting to MongoDB...");
	await database.initialize(configJS.database);
	const DB = database.get();

	console.log("Connected. Starting migration...");

	// 1. Filters
	const filterPath = path.join(rootDir, "Configurations", "filter.json");
	if (fs.existsSync(filterPath)) {
		const filters = require(filterPath);
		if (Array.isArray(filters)) {
			console.log(`Migrating ${filters.length} filters...`);
			let count = 0;
			for (const word of filters) {
				try {
					await DB.GlobalFilters.update(
						{ word },
						{ $set: { word } },
						{ upsert: true },
					);
					count++;
				} catch (e) {
					console.error(`Failed to migrate filter: ${word}`, e);
				}
			}
			console.log(`Migrated ${count} filters.`);
		}
	}

	// 2. Ranks
	const ranksPath = path.join(rootDir, "Configurations", "ranks.json");
	if (fs.existsSync(ranksPath)) {
		const ranks = require(ranksPath);
		if (Array.isArray(ranks)) {
			console.log(`Migrating ${ranks.length} ranks...`);
			let count = 0;
			for (const rank of ranks) {
				await DB.GlobalRanks.update(
					{ _id: rank._id },
					{ $set: rank },
					{ upsert: true },
				);
				count++;
			}
			console.log(`Migrated ${count} ranks.`);
		}
	}

	// 3. RSS Feeds
	const rssPath = path.join(rootDir, "Configurations", "rss_feeds.json");
	if (fs.existsSync(rssPath)) {
		const feeds = require(rssPath);
		if (Array.isArray(feeds)) {
			console.log(`Migrating ${feeds.length} RSS feeds...`);
			let count = 0;
			for (const feed of feeds) {
				await DB.GlobalRSSFeeds.update(
					{ _id: feed._id },
					{ $set: feed },
					{ upsert: true },
				);
				count++;
			}
			console.log(`Migrated ${count} RSS feeds.`);
		}
	}

	// 4. Status Messages
	const statusPath = path.join(rootDir, "Configurations", "status_messages.json");
	if (fs.existsSync(statusPath)) {
		const statusMsgs = require(statusPath);
		console.log(`Migrating status messages...`);
		let count = 0;
		for (const [key, value] of Object.entries(statusMsgs)) {
			await DB.GlobalStatusMessages.update(
				{ _id: key },
				{ $set: { messages: value } },
				{ upsert: true },
			);
			count++;
		}
		console.log(`Migrated ${count} status message types.`);
	}

	// 5. Tag Reactions
	const tagReactionPath = path.join(rootDir, "Configurations", "tag_reactions.json");
	if (fs.existsSync(tagReactionPath)) {
		const reactions = require(tagReactionPath);
		if (Array.isArray(reactions)) {
			console.log(`Migrating ${reactions.length} tag reactions...`);
			let count = 0;
			for (const content of reactions) {
				const exists = await DB.GlobalTagReactions.findOne({ content });
				if (!exists) {
					await DB.GlobalTagReactions.new({ content }).save();
					count++;
				}
			}
			console.log(`Migrated ${count} tag reactions.`);
		}
	}

	// 6. Tags
	const tagsPath = path.join(rootDir, "Configurations", "tags.json");
	if (fs.existsSync(tagsPath)) {
		const tags = require(tagsPath);
		if (Array.isArray(tags)) {
			console.log(`Migrating ${tags.length} tags...`);
			let count = 0;
			for (const tag of tags) {
				await DB.GlobalTags.update(
					{ _id: tag._id },
					{ $set: tag },
					{ upsert: true },
				);
				count++;
			}
			console.log(`Migrated ${count} tags.`);
		}
	}

	// 7. Trivia
	const triviaPath = path.join(rootDir, "Configurations", "trivia.json");
	if (fs.existsSync(triviaPath)) {
		const trivia = require(triviaPath);
		if (Array.isArray(trivia)) {
			console.log(`Migrating ${trivia.length} trivia questions...`);
			const existingCount = await DB.GlobalTrivia.count({});
			let count = 0;
			if (existingCount === 0) {
				await DB.GlobalTrivia.insert(trivia);
				count = trivia.length;
			} else {
				for (const item of trivia) {
					const res = await DB.GlobalTrivia.update(
						{ question: item.question },
						{ $set: item },
						{ upsert: true },
					);
					if (res && res.upsertedCount > 0) count++;
				}
			}
			console.log(`Migrated ${count} trivia questions.`);
		}
	}

	console.log("Migration complete.");
	process.exit(0);
};

runMigration().catch(err => {
	console.error("Migration failed:", err);
	process.exit(1);
});
