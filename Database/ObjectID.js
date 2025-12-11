/**
 * Cross-database ObjectID utility
 * Provides MongoDB ObjectId compatibility for both MongoDB and MariaDB backends
 */

const databaseType = process.env.DATABASE_TYPE || "mongodb";

let MongoObjectId = null;

/**
 * Create or validate an ObjectID
 * For MongoDB: Returns actual ObjectId instance
 * For MariaDB: Returns string representation
 * @param {string} [id] - The ID string to convert, or undefined to generate new
 * @returns {ObjectId|string} - ObjectId for MongoDB, string for MariaDB
 */
function ObjectID (id) {
	if (databaseType === "mariadb") {
		// For MariaDB, generate new ID if none provided
		if (id === undefined || id === null) {
			return ObjectID.generate();
		}
		// Just return the string ID
		if (typeof id !== "string") {
			throw new Error("Invalid ID format");
		}
		return id;
	}

	// For MongoDB, use actual ObjectId
	if (!MongoObjectId) {
		MongoObjectId = require("mongodb").ObjectId;
	}
	return new MongoObjectId(id);
}

/**
 * Check if a string is a valid ObjectID format
 * @param {string} id - The ID to validate
 * @returns {boolean}
 */
ObjectID.isValid = function (id) {
	if (databaseType === "mariadb") {
		// For MariaDB, accept any non-empty string
		return typeof id === "string" && id.length > 0;
	}

	// For MongoDB, use ObjectId validation
	if (!MongoObjectId) {
		MongoObjectId = require("mongodb").ObjectId;
	}
	return MongoObjectId.isValid(id);
};

/**
 * Generate a new ObjectID
 * @returns {ObjectId|string}
 */
ObjectID.generate = function () {
	if (databaseType === "mariadb") {
		// Generate 24 character hex string similar to MongoDB ObjectId
		const crypto = require("crypto");
		return crypto.randomBytes(12).toString("hex");
	}

	// For MongoDB, generate new ObjectId
	if (!MongoObjectId) {
		MongoObjectId = require("mongodb").ObjectId;
	}
	return new MongoObjectId();
};

module.exports = ObjectID;
