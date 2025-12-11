/**
 * Cross-database ObjectID utility
 * Provides MongoDB ObjectId compatibility for both MongoDB and MariaDB backends
 */

const databaseType = process.env.DATABASE_TYPE || "mongodb";

let MongoObjectId = null;

/**
 * MariaDB ObjectID wrapper class
 * Wraps string IDs to provide consistent interface with MongoDB ObjectId
 */
class MariaDBObjectId {
	constructor (id) {
		if (id === undefined || id === null) {
			this._id = MariaDBObjectId.generate();
		} else if (typeof id === "string") {
			this._id = id;
		} else if (id instanceof MariaDBObjectId) {
			this._id = id._id;
		} else {
			throw new Error("Invalid ID format");
		}
	}

	toString () {
		return this._id;
	}

	toHexString () {
		return this._id;
	}

	equals (other) {
		if (other instanceof MariaDBObjectId) {
			return this._id === other._id;
		}
		return this._id === String(other);
	}

	static generate () {
		const crypto = require("crypto");
		return crypto.randomBytes(12).toString("hex");
	}

	static isValid (id) {
		return typeof id === "string" && id.length > 0;
	}
}

/**
 * Create or validate an ObjectID
 * For MongoDB: Returns actual ObjectId instance
 * For MariaDB: Returns MariaDBObjectId wrapper
 * @param {string} [id] - The ID string to convert, or undefined to generate new
 * @returns {ObjectId|MariaDBObjectId} - ObjectId for MongoDB, MariaDBObjectId for MariaDB
 */
function ObjectID (id) {
	if (databaseType === "mariadb") {
		return new MariaDBObjectId(id);
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
		return MariaDBObjectId.isValid(id);
	}

	// For MongoDB, use ObjectId validation
	if (!MongoObjectId) {
		MongoObjectId = require("mongodb").ObjectId;
	}
	return MongoObjectId.isValid(id);
};

/**
 * Generate a new ObjectID
 * @returns {ObjectId|MariaDBObjectId}
 */
ObjectID.generate = function () {
	if (databaseType === "mariadb") {
		return new MariaDBObjectId();
	}

	// For MongoDB, generate new ObjectId
	if (!MongoObjectId) {
		MongoObjectId = require("mongodb").ObjectId;
	}
	return new MongoObjectId();
};

module.exports = ObjectID;
