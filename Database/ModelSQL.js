const DocumentSQL = require("./DocumentSQL");
const CursorSQL = require("./CursorSQL");

/**
 * SQL Model - MongoDB-compatible interface for MariaDB tables
 */
module.exports = class ModelSQL {
	/**
	 * Creates a new ModelSQL instance for a table
	 * @param {Function} getPool Function to get the MariaDB pool
	 * @param {string} tableName The name of the table
	 * @param {Schema} schema The schema definition
	 */
	constructor (getPool, tableName, schema) {
		this._getPool = getPool;
		this._tableName = tableName;
		this.schema = schema;
		this._cache = new Map();
	}

	/**
	 * Get a connection from the pool
	 * @returns {Promise<Connection>}
	 */
	async _getConnection () {
		const pool = this._getPool();
		return pool.getConnection();
	}

	/**
	 * Find documents matching a query
	 * @param {object|string} query MongoDB-style query object or _id string
	 * @returns {CursorSQL}
	 */
	find (query = {}) {
		// Handle string query as _id lookup (MongoDB compatibility)
		if (typeof query === "string") {
			query = { _id: query };
		}
		return new CursorSQL(this, query);
	}

	/**
	 * Run an aggregation pipeline (extended support)
	 * Supports: $match, $group, $project, $sort, $limit, $skip
	 * @param {Array} pipeline Aggregation pipeline stages
	 * @returns {Promise<Array>}
	 */
	async aggregate (pipeline) {
		let conn;
		try {
			conn = await this._getConnection();

			let selectClause = "*";
			let whereClause = "";
			let groupByClause = "";
			let orderByClause = "";
			let limitClause = "";
			const params = [];

			// Process pipeline stages
			for (const stage of pipeline) {
				if (stage.$match) {
					const result = this._buildWhereClause(stage.$match);
					if (result.whereClause) {
						whereClause = ` WHERE ${result.whereClause}`;
						params.push(...result.whereParams);
					}
				}

				// Track computed fields from $addFields
				if (stage.$addFields) {
					// $addFields creates computed columns - we'll handle these in $project
					// Store them for later use
					if (!this._computedFields) this._computedFields = {};
					for (const [key, value] of Object.entries(stage.$addFields)) {
						this._computedFields[key] = value;
					}
				}

				if (stage.$group) {
					const groupFields = [];
					const selectFields = [];

					for (const [key, value] of Object.entries(stage.$group)) {
						if (key === "_id") {
							if (value === null) {
								selectFields.push("NULL as `_id`");
							} else if (typeof value === "string" && value.startsWith("$")) {
								const field = value.substring(1);
								selectFields.push(`\`${field}\` as \`_id\``);
								groupFields.push(`\`${field}\``);
							}
						} else if (typeof value === "object") {
							if (value.$sum !== undefined) {
								if (typeof value.$sum === "number") {
									selectFields.push(`COUNT(*) * ${value.$sum} as \`${key}\``);
								} else if (typeof value.$sum === "string" && value.$sum.startsWith("$")) {
									const field = value.$sum.substring(1);
									selectFields.push(`SUM(\`${field}\`) as \`${key}\``);
								} else {
									selectFields.push(`COUNT(*) as \`${key}\``);
								}
							} else if (value.$avg !== undefined) {
								const field = value.$avg.substring(1);
								selectFields.push(`AVG(\`${field}\`) as \`${key}\``);
							} else if (value.$count !== undefined) {
								selectFields.push(`COUNT(*) as \`${key}\``);
							} else if (value.$max !== undefined) {
								const field = value.$max.substring(1);
								selectFields.push(`MAX(\`${field}\`) as \`${key}\``);
							} else if (value.$min !== undefined) {
								const field = value.$min.substring(1);
								selectFields.push(`MIN(\`${field}\`) as \`${key}\``);
							}
						}
					}

					if (selectFields.length > 0) {
						selectClause = selectFields.join(", ");
					}
					if (groupFields.length > 0) {
						groupByClause = ` GROUP BY ${groupFields.join(", ")}`;
					} else if (selectFields.some(f => f.includes("COUNT(") || f.includes("SUM(") || f.includes("AVG("))) {
						// No GROUP BY needed for aggregate without grouping field
					}
				}

				if (stage.$project) {
					const projectFields = [];
					for (const [key, value] of Object.entries(stage.$project)) {
						if (value === 1 || value === true) {
							// Check if this is a computed field from $addFields
							if (this._computedFields && this._computedFields[key]) {
								const computed = this._computedFields[key];
								// Handle $size: { $objectToArray: "$field" } pattern
								if (computed.$size && computed.$size.$objectToArray) {
									const field = computed.$size.$objectToArray.substring(1);
									projectFields.push(`JSON_LENGTH(\`${field}\`) as \`${key}\``);
								}
							} else if (key.includes(".")) {
								// Handle JSON paths (fields with dots like "config.public_data")
								const parts = key.split(".");
								const baseCol = parts[0];
								const jsonPath = parts.slice(1).join(".");
								projectFields.push(`JSON_EXTRACT(\`${baseCol}\`, '$."${jsonPath}"') as \`${key.replace(/\./g, "_")}\``);
							} else {
								projectFields.push(`\`${key}\``);
							}
						} else if (typeof value === "object" && value.$add) {
							// $add - arithmetic addition
							const sqlExpr = this._buildArithmeticExpr(value.$add);
							projectFields.push(`(${sqlExpr}) as \`${key}\``);
						} else if (typeof value === "object" && value.$size) {
							// $size for JSON array length
							const field = value.$size.substring(1);
							projectFields.push(`JSON_LENGTH(\`${field}\`) as \`${key}\``);
						} else if (typeof value === "object" && value.$objectToArray) {
							// $objectToArray - for MariaDB, we need to handle JSON objects
							const field = value.$objectToArray.substring(1);
							if (field.includes(".")) {
								const parts = field.split(".");
								const baseCol = parts[0];
								const jsonPath = parts.slice(1).join(".");
								projectFields.push(`JSON_EXTRACT(\`${baseCol}\`, '$."${jsonPath}"') as \`${key}\``);
							} else {
								projectFields.push(`\`${field}\` as \`${key}\``);
							}
						}
					}
					if (projectFields.length > 0) {
						selectClause = projectFields.join(", ");
					}
				}

				if (stage.$sort) {
					const sortParts = Object.entries(stage.$sort).map(([field, dir]) =>
						`\`${field}\` ${dir === 1 ? "ASC" : "DESC"}`,
					);
					orderByClause = ` ORDER BY ${sortParts.join(", ")}`;
				}

				if (stage.$limit) {
					limitClause += ` LIMIT ${parseInt(stage.$limit, 10)}`;
				}

				if (stage.$skip) {
					if (!limitClause.includes("LIMIT")) {
						limitClause += " LIMIT 18446744073709551615";
					}
					limitClause += ` OFFSET ${parseInt(stage.$skip, 10)}`;
				}
			}

			const sql = `SELECT ${selectClause} FROM \`${this._tableName}\`${whereClause}${groupByClause}${orderByClause}${limitClause}`;
			const rows = await conn.query(sql, params);
			return Array.from(rows).map(row => this._parseRow(row));
		} finally {
			if (conn) conn.release();
		}
	}

	/**
	 * Build SQL expression from MongoDB arithmetic operators
	 * @param {Array} operands Array of operands for the operation
	 * @returns {string} SQL expression
	 */
	_buildArithmeticExpr (operands) {
		const parts = operands.map(op => {
			if (typeof op === "number") {
				return op.toString();
			} else if (typeof op === "string" && op.startsWith("$")) {
				const field = op.substring(1);
				// Check if this is a computed field
				if (this._computedFields && this._computedFields[field]) {
					const computed = this._computedFields[field];
					if (computed.$size && computed.$size.$objectToArray) {
						const jsonField = computed.$size.$objectToArray.substring(1);
						return `JSON_LENGTH(\`${jsonField}\`)`;
					}
				}
				return `\`${field}\``;
			} else if (typeof op === "object" && op.$multiply) {
				const mulParts = op.$multiply.map(m => {
					if (typeof m === "number") return m.toString();
					if (typeof m === "string" && m.startsWith("$")) {
						const f = m.substring(1);
						if (this._computedFields && this._computedFields[f]) {
							const c = this._computedFields[f];
							if (c.$size && c.$size.$objectToArray) {
								return `JSON_LENGTH(\`${c.$size.$objectToArray.substring(1)}\`)`;
							}
						}
						return `\`${f}\``;
					}
					if (typeof m === "object" && m.$multiply) {
						return `(${this._buildArithmeticExpr([{ $multiply: m.$multiply }])})`;
					}
					return "0";
				});
				return `(${mulParts.join(" * ")})`;
			} else if (typeof op === "object" && op.$add) {
				return `(${this._buildArithmeticExpr(op.$add)})`;
			}
			return "0";
		});
		return parts.join(" + ");
	}

	/**
	 * Count documents matching a query
	 * @param {object} query MongoDB-style query object
	 * @returns {Promise<number>}
	 */
	async count (query = {}) {
		let conn;
		try {
			conn = await this._getConnection();

			let sql = `SELECT COUNT(*) as count FROM \`${this._tableName}\``;
			const params = [];

			const { whereClause, whereParams } = this._buildWhereClause(query);
			if (whereClause) {
				sql += ` WHERE ${whereClause}`;
				params.push(...whereParams);
			}

			const [result] = await conn.query(sql, params);
			return Number(result.count);
		} finally {
			if (conn) conn.release();
		}
	}

	/**
	 * Find a single document matching a query
	 * @param {object|string} query MongoDB-style query object or _id string
	 * @returns {Promise<DocumentSQL|null>}
	 */
	async findOne (query = {}) {
		// Handle string query as _id lookup (MongoDB compatibility)
		if (typeof query === "string") {
			query = { _id: query };
		}
		const cursor = this.find(query).limit(1);
		const results = await cursor.exec();
		return results.length > 0 ? results[0] : null;
	}

	/**
	 * Find a document by its _id
	 * @param {string} id The document ID
	 * @returns {Promise<DocumentSQL|null>}
	 */
	async findOneByObjectID (id) {
		return this.findOne({ _id: id });
	}

	/**
	 * Update documents matching a query
	 * @param {object} query MongoDB-style query object
	 * @param {object} update MongoDB-style update object
	 * @param {object} options Update options
	 * @returns {Promise<object>}
	 */
	async update (query, update, options = {}) {
		let conn;
		try {
			conn = await this._getConnection();

			const setClauses = [];
			const params = [];

			// Handle $set operator
			if (update.$set) {
				for (const [key, value] of Object.entries(update.$set)) {
					setClauses.push(`\`${key}\` = ?`);
					params.push(this._serializeValue(value));
				}
			}

			// Handle $inc operator
			if (update.$inc) {
				for (const [key, value] of Object.entries(update.$inc)) {
					setClauses.push(`\`${key}\` = \`${key}\` + ?`);
					params.push(value);
				}
			}

			// Handle $unset operator
			if (update.$unset) {
				for (const key of Object.keys(update.$unset)) {
					setClauses.push(`\`${key}\` = NULL`);
				}
			}

			// Handle direct field updates (without operators)
			const operators = ["$set", "$inc", "$unset", "$push", "$pull", "$pullAll"];
			for (const [key, value] of Object.entries(update)) {
				if (!operators.includes(key)) {
					setClauses.push(`\`${key}\` = ?`);
					params.push(this._serializeValue(value));
				}
			}

			if (setClauses.length === 0) {
				return { modifiedCount: 0 };
			}

			let sql = `UPDATE \`${this._tableName}\` SET ${setClauses.join(", ")}`;

			const { whereClause, whereParams } = this._buildWhereClause(query);
			if (whereClause) {
				sql += ` WHERE ${whereClause}`;
				params.push(...whereParams);
			}

			if (!options.multi) {
				sql += " LIMIT 1";
			}

			const result = await conn.query(sql, params);
			return { modifiedCount: Number(result.affectedRows) };
		} finally {
			if (conn) conn.release();
		}
	}

	/**
	 * Insert one or more documents
	 * @param {object|Array} docs The document(s) to insert
	 * @param {object} options Insert options (e.g., { ordered: false })
	 * @returns {Promise<object>}
	 */
	async insert (docs, options = {}) {
		// Handle array of documents
		if (Array.isArray(docs)) {
			const results = { insertedIds: [], insertedCount: 0 };
			for (const doc of docs) {
				try {
					const result = await this._insertOne(doc);
					results.insertedIds.push(result.insertedId);
					results.insertedCount++;
				} catch (err) {
					if (options.ordered !== false) throw err;
					// Continue on error if ordered: false
				}
			}
			return results;
		}
		// Single document
		return this._insertOne(docs);
	}

	/**
	 * Insert a single document
	 * @param {object|DocumentSQL} doc The document to insert
	 * @returns {Promise<object>}
	 * @private
	 */
	async _insertOne (doc) {
		let conn;
		try {
			conn = await this._getConnection();

			// Extract plain object from DocumentSQL if needed
			const plainDoc = doc._doc ? doc._doc : doc;

			const keys = Object.keys(plainDoc);
			const columns = keys.map(k => `\`${k}\``).join(", ");
			const placeholders = keys.map(() => "?").join(", ");
			const values = keys.map(k => this._serializeValue(plainDoc[k]));

			const sql = `INSERT INTO \`${this._tableName}\` (${columns}) VALUES (${placeholders})`;
			const result = await conn.query(sql, values);

			return { insertedId: plainDoc._id || result.insertId };
		} finally {
			if (conn) conn.release();
		}
	}

	/**
	 * Delete documents matching a query
	 * @param {object} query MongoDB-style query object
	 * @param {object} options Delete options
	 * @returns {Promise<object>}
	 */
	async delete (query, options = {}) {
		let conn;
		try {
			conn = await this._getConnection();

			let sql = `DELETE FROM \`${this._tableName}\``;
			const params = [];

			const { whereClause, whereParams } = this._buildWhereClause(query);
			if (whereClause) {
				sql += ` WHERE ${whereClause}`;
				params.push(...whereParams);
			}

			if (!options.multi) {
				sql += " LIMIT 1";
			}

			const result = await conn.query(sql, params);
			return { deletedCount: Number(result.affectedRows) };
		} finally {
			if (conn) conn.release();
		}
	}

	/**
	 * Create a new document instance (not saved)
	 * @param {object} doc Initial document data
	 * @returns {DocumentSQL}
	 */
	new (doc = {}) {
		const builtDoc = this.schema ? this.schema.build(doc) : doc;
		if (!builtDoc._id) {
			builtDoc._id = DocumentSQL.generateId();
		}
		return new DocumentSQL(this, builtDoc, true);
	}

	/**
	 * Create and save a new document
	 * @param {object} doc Document data
	 * @returns {Promise<DocumentSQL>}
	 */
	async create (doc) {
		const document = this.new(doc);
		await document.save();
		return document;
	}

	/**
	 * Convert a field name to SQL column reference
	 * Handles dot notation for JSON fields: config.moderation.isEnabled -> JSON_EXTRACT(config, '$.moderation.isEnabled')
	 * @param {string} field Field name (may contain dots for nested JSON access)
	 * @returns {string} SQL column reference
	 */
	_getFieldRef (field) {
		if (!field.includes(".")) {
			return `\`${field}\``;
		}
		// Dot notation - convert to JSON_EXTRACT
		const parts = field.split(".");
		const column = parts[0];
		const jsonPath = `$.${parts.slice(1).join(".")}`;
		return `JSON_UNQUOTE(JSON_EXTRACT(\`${column}\`, '${jsonPath}'))`;
	}

	/**
	 * Build a WHERE clause from a MongoDB-style query
	 * @param {object} query MongoDB-style query
	 * @returns {{ whereClause: string, whereParams: Array }}
	 */
	_buildWhereClause (query) {
		const conditions = [];
		const params = [];

		for (const [key, value] of Object.entries(query)) {
			if (key === "$or" && Array.isArray(value)) {
				const orConditions = value.map(subQuery => {
					const { whereClause, whereParams } = this._buildWhereClause(subQuery);
					params.push(...whereParams);
					return `(${whereClause})`;
				});
				conditions.push(`(${orConditions.join(" OR ")})`);
			} else if (key === "$and" && Array.isArray(value)) {
				const andConditions = value.map(subQuery => {
					const { whereClause, whereParams } = this._buildWhereClause(subQuery);
					params.push(...whereParams);
					return `(${whereClause})`;
				});
				conditions.push(`(${andConditions.join(" AND ")})`);
			} else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
				// Check if this is a comparison operator object or a nested value
				const operators = ["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$exists", "$regex", "$like"];
				const hasOperator = Object.keys(value).some(k => operators.includes(k));

				if (hasOperator) {
					// Handle comparison operators
					for (const [op, opValue] of Object.entries(value)) {
						const fieldRef = this._getFieldRef(key);
						switch (op) {
							case "$eq":
								conditions.push(`${fieldRef} = ?`);
								params.push(this._serializeValue(opValue));
								break;
							case "$ne":
								conditions.push(`${fieldRef} != ?`);
								params.push(this._serializeValue(opValue));
								break;
							case "$gt":
								conditions.push(`${fieldRef} > ?`);
								params.push(opValue);
								break;
							case "$gte":
								conditions.push(`${fieldRef} >= ?`);
								params.push(opValue);
								break;
							case "$lt":
								conditions.push(`${fieldRef} < ?`);
								params.push(opValue);
								break;
							case "$lte":
								conditions.push(`${fieldRef} <= ?`);
								params.push(opValue);
								break;
							case "$in":
								if (Array.isArray(opValue) && opValue.length > 0) {
									const placeholders = opValue.map(() => "?").join(", ");
									conditions.push(`${fieldRef} IN (${placeholders})`);
									params.push(...opValue.map(v => this._serializeValue(v)));
								}
								break;
							case "$nin":
								if (Array.isArray(opValue) && opValue.length > 0) {
									const placeholders = opValue.map(() => "?").join(", ");
									conditions.push(`${fieldRef} NOT IN (${placeholders})`);
									params.push(...opValue.map(v => this._serializeValue(v)));
								}
								break;
							case "$exists":
								if (key.includes(".")) {
									// For JSON paths, check if the value is not null
									const parts = key.split(".");
									const column = parts[0];
									const jsonPath = `$.${parts.slice(1).join(".")}`;
									conditions.push(
										opValue ?
											`JSON_EXTRACT(\`${column}\`, '${jsonPath}') IS NOT NULL` :
											`JSON_EXTRACT(\`${column}\`, '${jsonPath}') IS NULL`,
									);
								} else {
									conditions.push(opValue ? `\`${key}\` IS NOT NULL` : `\`${key}\` IS NULL`);
								}
								break;
							case "$regex":
								conditions.push(`${fieldRef} REGEXP ?`);
								params.push(opValue);
								break;
							case "$like":
								conditions.push(`LOWER(${fieldRef}) LIKE LOWER(?)`);
								params.push(opValue);
								break;
							default:
								break;
						}
					}
				} else {
					// Not an operator object - treat as nested object value
					const fieldRef = this._getFieldRef(key);
					conditions.push(`${fieldRef} = ?`);
					params.push(this._serializeValue(value));
				}
			} else if (value === null) {
				const fieldRef = this._getFieldRef(key);
				conditions.push(`${fieldRef} IS NULL`);
			} else {
				const fieldRef = this._getFieldRef(key);
				// For boolean values in JSON, need to compare with JSON true/false
				if (typeof value === "boolean" && key.includes(".")) {
					conditions.push(`${fieldRef} = ?`);
					params.push(value ? "true" : "false");
				} else {
					conditions.push(`${fieldRef} = ?`);
					params.push(this._serializeValue(value));
				}
			}
		}

		return {
			whereClause: conditions.join(" AND "),
			whereParams: params,
		};
	}

	/**
	 * Serialize a value for SQL storage
	 * @param {*} value The value to serialize
	 * @returns {*}
	 */
	_serializeValue (value) {
		if (value === undefined) return null;
		if (value === null) return null;
		if (value instanceof Date) return value;
		if (typeof value === "object") {
			// Handle ObjectId objects (both MariaDBObjectId and MongoDB ObjectId)
			if (typeof value.toString === "function" && (value._id !== undefined || value.toHexString)) {
				return value.toString();
			}
			return JSON.stringify(value);
		}
		return value;
	}

	/**
	 * Parse a row from the database
	 * @param {object} row The database row
	 * @returns {object}
	 */
	_parseRow (row) {
		const parsed = {};
		for (const [key, value] of Object.entries(row)) {
			if (typeof value === "string") {
				// Try to parse JSON fields
				try {
					if ((value.startsWith("{") && value.endsWith("}")) ||
						(value.startsWith("[") && value.endsWith("]"))) {
						parsed[key] = JSON.parse(value);
						continue;
					}
				} catch {
					// Not JSON, use as-is
				}
			}
			parsed[key] = value;
		}
		return parsed;
	}

	/**
	 * Execute a query and return documents
	 * @param {string} sql SQL query
	 * @param {Array} params Query parameters
	 * @returns {Promise<Array<DocumentSQL>>}
	 */
	async _executeQuery (sql, params = []) {
		let conn;
		try {
			conn = await this._getConnection();
			const rows = await conn.query(sql, params);
			return Array.from(rows).map(row => {
				const parsed = this._parseRow(row);
				return new DocumentSQL(this, parsed, false);
			});
		} finally {
			if (conn) conn.release();
		}
	}
};
