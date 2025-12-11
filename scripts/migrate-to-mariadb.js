#!/usr/bin/env node
/**
 * MongoDB to MariaDB Migration Script
 *
 * This script migrates all data from MongoDB to MariaDB.
 * Run this AFTER setting up MariaDB tables using the SQL schema.
 *
 * Usage:
 *   node scripts/migrate-to-mariadb.js [options]
 *
 * Options:
 *   --dry-run       Preview what would be migrated without making changes
 *   --collection    Migrate only a specific collection (e.g., --collection=users)
 *   --skip-verify   Skip verification step after migration
 *   --mongo-url     Override MongoDB URL (e.g., --mongo-url=mongodb://localhost:27017/)
 *   --maria-host    Override MariaDB host (e.g., --maria-host=127.0.0.1)
 */

const { MongoClient } = require("mongodb");
const mariadb = require("mariadb");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const skipVerify = args.includes("--skip-verify");
const collectionArg = args.find(a => a.startsWith("--collection="));
const targetCollection = collectionArg ? collectionArg.split("=")[1] : null;
const mongoUrlArg = args.find(a => a.startsWith("--mongo-url="));
const mongoUrl = mongoUrlArg ? mongoUrlArg.split("=")[1] : process.env.DATABASE_URL || "localhost";
const mariaHostArg = args.find(a => a.startsWith("--maria-host="));
const mariaHost = mariaHostArg ? mariaHostArg.split("=")[1] : process.env.MARIADB_HOST || "localhost";

// Collection to table mapping
const COLLECTION_MAP = {
	users: "users",
	servers: "servers",
	gallery: "gallery",
	blog: "blog",
	wiki: "wiki",
	traffic: "traffic",
	votes: "votes",
	global_filters: "global_filters",
	global_ranks: "global_ranks",
	global_rss_feeds: "global_rss_feeds",
	global_status_messages: "global_status_messages",
	global_tag_reactions: "global_tag_reactions",
	global_tags: "global_tags",
	global_trivia: "global_trivia",
	site_settings: "site_settings",
	feedback: "feedback",
};

// Fields that should be stored as JSON in MariaDB
const JSON_FIELDS = {
	users: ["past_names", "server_nicks", "reminders", "profile_fields", "upvoted_gallery_extensions", "subscription", "linked_accounts"],
	servers: ["config", "extensions", "members", "games", "channels", "command_usage", "voice_data", "logs", "modlog"],
	gallery: ["version", "published_version", "servers"],
	blog: ["tags"],
	wiki: ["history", "contributors", "reactions"],
	site_settings: ["membership", "payments", "injection", "social", "features"],
};

// Fields to flatten from payment_ids subdocument
const FLATTEN_FIELDS = {
	users: {
		"payment_ids.stripe_customer_id": "stripe_customer_id",
		"payment_ids.paypal_customer_id": "paypal_customer_id",
		"payment_ids.btcpay_customer_id": "btcpay_customer_id",
	},
};

let mongoClient = null;
let mariaPool = null;

async function connect () {
	console.log(`📦 Connecting to MongoDB at ${mongoUrl}...`);
	mongoClient = new MongoClient(mongoUrl);
	await mongoClient.connect();
	console.log("✅ MongoDB connected");

	console.log(`📦 Connecting to MariaDB at ${mariaHost}...`);
	mariaPool = mariadb.createPool({
		host: mariaHost,
		port: parseInt(process.env.MARIADB_PORT || "3306", 10),
		user: process.env.MARIADB_USER,
		password: process.env.MARIADB_PASSWORD,
		database: process.env.MARIADB_DATABASE,
		connectionLimit: 5,
	});
	// Test connection
	const conn = await mariaPool.getConnection();
	await conn.query("SELECT 1");
	conn.release();
	console.log("✅ MariaDB connected");
}

async function disconnect () {
	if (mongoClient) await mongoClient.close();
	if (mariaPool) await mariaPool.end();
	console.log("🔌 Disconnected from databases");
}

function transformDocument (doc, collectionName) {
	const transformed = { ...doc };

	// Convert ObjectId to string
	if (transformed._id && typeof transformed._id === "object" && transformed._id.toString) {
		transformed._id = transformed._id.toString();
	}

	// Handle flattening
	if (FLATTEN_FIELDS[collectionName]) {
		for (const [srcPath, destField] of Object.entries(FLATTEN_FIELDS[collectionName])) {
			const parts = srcPath.split(".");
			let value = transformed;
			for (const part of parts) {
				value = value?.[part];
			}
			if (value !== undefined) {
				transformed[destField] = value;
			}
			// Remove the nested object
			if (parts.length > 1) {
				delete transformed[parts[0]];
			}
		}
	}

	// Serialize JSON fields
	if (JSON_FIELDS[collectionName]) {
		for (const field of JSON_FIELDS[collectionName]) {
			if (transformed[field] !== undefined && transformed[field] !== null) {
				if (typeof transformed[field] !== "string") {
					transformed[field] = JSON.stringify(transformed[field]);
				}
			}
		}
	}

	// Handle dates
	for (const [key, value] of Object.entries(transformed)) {
		if (value instanceof Date) {
			transformed[key] = value;
		} else if (typeof value === "object" && value !== null && value.$date) {
			transformed[key] = new Date(value.$date);
		}
	}

	return transformed;
}

async function migrateCollection (collectionName, tableName) {
	const mongoDB = mongoClient.db(process.env.DATABASE_NAME);
	const collection = mongoDB.collection(collectionName);

	const count = await collection.countDocuments();
	console.log(`\n📋 Migrating ${collectionName} -> ${tableName} (${count} documents)`);

	if (count === 0) {
		console.log("   ⏭️  No documents to migrate");
		return { migrated: 0, errors: 0 };
	}

	if (isDryRun) {
		console.log("   🔍 DRY RUN - Would migrate", count, "documents");
		return { migrated: count, errors: 0 };
	}

	let conn;
	let migrated = 0;
	let errors = 0;

	try {
		conn = await mariaPool.getConnection();

		// Truncate table first (optional - comment out to append)
		await conn.query(`DELETE FROM \`${tableName}\``);
		console.log(`   🗑️  Cleared existing data from ${tableName}`);

		const cursor = collection.find();
		const batchSize = 100;
		let batch = [];

		while (await cursor.hasNext()) {
			const doc = await cursor.next();
			const transformed = transformDocument(doc, collectionName);
			batch.push(transformed);

			if (batch.length >= batchSize) {
				const results = await insertBatch(conn, tableName, batch);
				migrated += results.success;
				errors += results.errors;
				batch = [];
				process.stdout.write(`\r   📥 Progress: ${migrated}/${count}`);
			}
		}

		// Insert remaining batch
		if (batch.length > 0) {
			const results = await insertBatch(conn, tableName, batch);
			migrated += results.success;
			errors += results.errors;
		}

		console.log(`\n   ✅ Migrated ${migrated} documents (${errors} errors)`);
	} finally {
		if (conn) conn.release();
	}

	return { migrated, errors };
}

async function insertBatch (conn, tableName, documents) {
	let success = 0;
	let errors = 0;

	for (const doc of documents) {
		try {
			const keys = Object.keys(doc);
			const columns = keys.map(k => `\`${k}\``).join(", ");
			const placeholders = keys.map(() => "?").join(", ");
			const values = keys.map(k => {
				const val = doc[k];
				if (val === undefined) return null;
				if (val === null) return null;
				if (val instanceof Date) return val;
				if (typeof val === "object") return JSON.stringify(val);
				return val;
			});

			const sql = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`;
			await conn.query(sql, values);
			success++;
		} catch (err) {
			errors++;
			if (errors <= 5) {
				console.error(`\n   ❌ Error inserting document:`, err.message);
				console.error(`      Document _id: ${doc._id}`);
			}
		}
	}

	return { success, errors };
}

async function verifyMigration () {
	if (skipVerify) {
		console.log("\n⏭️  Skipping verification");
		return;
	}

	console.log("\n🔍 Verifying migration...");

	const mongoDB = mongoClient.db(process.env.DATABASE_NAME);
	let conn;

	try {
		conn = await mariaPool.getConnection();

		for (const [collection, table] of Object.entries(COLLECTION_MAP)) {
			if (targetCollection && collection !== targetCollection) continue;

			const mongoCount = await mongoDB.collection(collection).countDocuments();
			const [mariaResult] = await conn.query(`SELECT COUNT(*) as count FROM \`${table}\``);
			const mariaCount = Number(mariaResult.count);

			const status = mongoCount === mariaCount ? "✅" : "⚠️";
			console.log(`   ${status} ${collection}: MongoDB=${mongoCount}, MariaDB=${mariaCount}`);
		}
	} finally {
		if (conn) conn.release();
	}
}

async function main () {
	console.log("═══════════════════════════════════════════════════════════");
	console.log("       MongoDB to MariaDB Migration Tool");
	console.log("═══════════════════════════════════════════════════════════");

	if (isDryRun) {
		console.log("🔍 DRY RUN MODE - No changes will be made\n");
	}

	if (targetCollection) {
		console.log(`📌 Targeting collection: ${targetCollection}\n`);
	}

	try {
		await connect();

		let totalMigrated = 0;
		let totalErrors = 0;

		for (const [collection, table] of Object.entries(COLLECTION_MAP)) {
			if (targetCollection && collection !== targetCollection) continue;

			const result = await migrateCollection(collection, table);
			totalMigrated += result.migrated;
			totalErrors += result.errors;
		}

		console.log("\n═══════════════════════════════════════════════════════════");
		console.log(`   Total migrated: ${totalMigrated} documents`);
		console.log(`   Total errors: ${totalErrors}`);
		console.log("═══════════════════════════════════════════════════════════");

		await verifyMigration();

		console.log("\n🎉 Migration complete!");
	} catch (err) {
		console.error("\n❌ Migration failed:", err);
		process.exit(1);
	} finally {
		await disconnect();
	}
}

main();
