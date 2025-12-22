export = ModelSQL;
declare class ModelSQL {
    /**
     * Creates a new ModelSQL instance for a table
     * @param {Function} getPool Function to get the MariaDB pool
     * @param {string} tableName The name of the table
     * @param {Schema} schema The schema definition
     */
    constructor(getPool: Function, tableName: string, schema: Schema);
    _getPool: Function;
    _tableName: string;
    schema: Schema;
    _cache: Map<any, any>;
    /**
     * Get a connection from the pool
     * @returns {Promise<Connection>}
     */
    _getConnection(): Promise<Connection>;
    /**
     * Find documents matching a query
     * @param {object|string} query MongoDB-style query object or _id string
     * @returns {CursorSQL}
     */
    find(query?: object | string): CursorSQL;
    /**
     * Run an aggregation pipeline (extended support)
     * Supports: $match, $group, $project, $sort, $limit, $skip
     * @param {Array} pipeline Aggregation pipeline stages
     * @returns {Promise<Array>}
     */
    aggregate(pipeline: any[]): Promise<any[]>;
    _computedFields: {};
    /**
     * Build SQL expression from MongoDB arithmetic operators
     * @param {Array} operands Array of operands for the operation
     * @returns {string} SQL expression
     */
    _buildArithmeticExpr(operands: any[]): string;
    /**
     * Count documents matching a query
     * @param {object} query MongoDB-style query object
     * @returns {Promise<number>}
     */
    count(query?: object): Promise<number>;
    /**
     * Find a single document matching a query
     * @param {object|string} query MongoDB-style query object or _id string
     * @returns {Promise<DocumentSQL|null>}
     */
    findOne(query?: object | string): Promise<DocumentSQL | null>;
    /**
     * Find a document by its _id
     * @param {string} id The document ID
     * @returns {Promise<DocumentSQL|null>}
     */
    findOneByObjectID(id: string): Promise<DocumentSQL | null>;
    /**
     * Update documents matching a query
     * @param {object} query MongoDB-style query object
     * @param {object} update MongoDB-style update object
     * @param {object} options Update options
     * @returns {Promise<object>}
     */
    update(query: object, update: object, options?: object): Promise<object>;
    /**
     * Insert one or more documents
     * @param {object|Array} docs The document(s) to insert
     * @param {object} options Insert options (e.g., { ordered: false })
     * @returns {Promise<object>}
     */
    insert(docs: object | any[], options?: object): Promise<object>;
    /**
     * Insert a single document
     * @param {object|DocumentSQL} doc The document to insert
     * @returns {Promise<object>}
     * @private
     */
    private _insertOne;
    /**
     * Delete documents matching a query
     * @param {object} query MongoDB-style query object
     * @param {object} options Delete options
     * @returns {Promise<object>}
     */
    delete(query: object, options?: object): Promise<object>;
    /**
     * Create a new document instance (not saved)
     * @param {object} doc Initial document data
     * @returns {DocumentSQL}
     */
    "new"(doc?: object): DocumentSQL;
    /**
     * Create and save a new document
     * @param {object} doc Document data
     * @returns {Promise<DocumentSQL>}
     */
    create(doc: object): Promise<DocumentSQL>;
    /**
     * Convert a field name to SQL column reference
     * Handles dot notation for JSON fields: config.moderation.isEnabled -> JSON_EXTRACT(config, '$.moderation.isEnabled')
     * @param {string} field Field name (may contain dots for nested JSON access)
     * @returns {string} SQL column reference
     */
    _getFieldRef(field: string): string;
    /**
     * Build a WHERE clause from a MongoDB-style query
     * @param {object} query MongoDB-style query
     * @returns {{ whereClause: string, whereParams: Array }}
     */
    _buildWhereClause(query: object): {
        whereClause: string;
        whereParams: any[];
    };
    /**
     * Serialize a value for SQL storage
     * @param {*} value The value to serialize
     * @returns {*}
     */
    _serializeValue(value: any): any;
    /**
     * Parse a row from the database
     * @param {object} row The database row
     * @returns {object}
     */
    _parseRow(row: object): object;
    /**
     * Execute a query and return documents
     * @param {string} sql SQL query
     * @param {Array} params Query parameters
     * @returns {Promise<Array<DocumentSQL>>}
     */
    _executeQuery(sql: string, params?: any[]): Promise<Array<DocumentSQL>>;
}
import CursorSQL = require("./CursorSQL");
import DocumentSQL = require("./DocumentSQL");
//# sourceMappingURL=ModelSQL.d.ts.map