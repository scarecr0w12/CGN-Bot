const DocumentSQL = require("./DocumentSQL");

/**
 * SQL Cursor - Provides MongoDB-compatible cursor interface for MariaDB queries
 * @class
 */
class CursorSQL {
	/**
	 * Create a new Cursor
	 * @param {ModelSQL} model
	 * @param {Object} query
	 * @param {Object} opts
	 */
	constructor (model, query = {}, opts = {}) {
		this._model = model;
		this._pool = this._model._pool;
		this._query = query;
		this._opts = opts;
		this._skip = null;
		this._limit = null;
		this._sort = null;
		this._projection = opts.projection || null;
	}

	/**
	 * Skip a number of documents
	 * @param {number} val
	 * @returns {CursorSQL}
	 */
	skip (val) {
		this._skip = val;
		return this;
	}

	/**
	 * Limit the number of documents returned
	 * @param {number} val
	 * @returns {CursorSQL}
	 */
	limit (val) {
		this._limit = val;
		return this;
	}

	/**
	 * Sort the documents
	 * @param {Object} val Sort specification { field: 1 } for ASC, { field: -1 } for DESC
	 * @returns {CursorSQL}
	 */
	sort (val) {
		this._sort = val;
		return this;
	}

	/**
	 * Execute the query and return documents
	 * @returns {Promise<DocumentSQL[]>}
	 */
	async exec () {
		// Build SELECT statement
		let columns = "*";
		if (this._projection) {
			const fields = Object.entries(this._projection)
				.filter(([, include]) => include)
				.map(([field]) => `\`${field}\``);
			if (fields.length > 0) {
				columns = fields.join(", ");
			}
		}

		let sql = `SELECT ${columns} FROM \`${this._model._table}\``;
		const params = [];

		// Build WHERE clause
		if (Object.keys(this._query).length > 0) {
			const { conditions, values } = this._model._buildWhereClause(this._query);
			if (conditions.length > 0) {
				sql += ` WHERE ${conditions.join(" AND ")}`;
				params.push(...values);
			}
		}

		// Build ORDER BY clause
		if (this._sort) {
			const sortParts = Object.entries(this._sort).map(([field, dir]) =>
				`\`${field}\` ${dir === 1 ? "ASC" : "DESC"}`,
			);
			sql += ` ORDER BY ${sortParts.join(", ")}`;
		}

		// Build LIMIT and OFFSET
		if (this._limit !== null) {
			sql += ` LIMIT ${parseInt(this._limit, 10)}`;
		}

		if (this._skip !== null) {
			if (this._limit === null) {
				// MariaDB requires LIMIT with OFFSET
				sql += ` LIMIT 18446744073709551615`;
			}
			sql += ` OFFSET ${parseInt(this._skip, 10)}`;
		}

		let conn;
		try {
			conn = await this._pool.getConnection();
			const rows = await conn.query(sql, params);

			if (!Array.isArray(rows)) {
				return rows ? [new DocumentSQL(this._parseRow(rows), this._model)] : [];
			}

			return rows.map(row => new DocumentSQL(this._parseRow(row), this._model));
		} finally {
			if (conn) conn.release();
		}
	}

	/**
	 * Convert cursor to array (alias for exec)
	 * @returns {Promise<DocumentSQL[]>}
	 */
	async toArray () {
		return this.exec();
	}

	/**
	 * Count documents matching the query
	 * @returns {Promise<number>}
	 */
	async count () {
		return this._model.count(this._query);
	}

	/**
	 * Parse a row from MariaDB into a document object
	 * @param {Object} row
	 * @returns {Object}
	 * @private
	 */
	_parseRow (row) {
		const parsed = { ...row };

		// Parse JSON columns
		for (const [key, value] of Object.entries(parsed)) {
			if (typeof value === "string") {
				// Try to parse as JSON
				if ((value.startsWith("{") && value.endsWith("}")) ||
					(value.startsWith("[") && value.endsWith("]"))) {
					try {
						parsed[key] = JSON.parse(value);
					} catch (e) {
						// Not valid JSON, keep as string
					}
				}
			}
		}

		return parsed;
	}
}

module.exports = CursorSQL;
