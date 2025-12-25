export = CursorSQL;
/**
 * SQL Cursor - Provides MongoDB-compatible cursor interface for MariaDB queries
 * @class
 */
declare class CursorSQL {
    /**
     * Create a new Cursor
     * @param {ModelSQL} model
     * @param {Object} query
     * @param {Object} opts
     */
    constructor(model: ModelSQL, query?: any, opts?: any);
    _model: ModelSQL;
    _pool: any;
    _query: any;
    _opts: any;
    _skip: number;
    _limit: number;
    _sort: any;
    _projection: any;
    /**
     * Skip a number of documents
     * @param {number} val
     * @returns {CursorSQL}
     */
    skip(val: number): CursorSQL;
    /**
     * Limit the number of documents returned
     * @param {number} val
     * @returns {CursorSQL}
     */
    limit(val: number): CursorSQL;
    /**
     * Sort the documents
     * @param {Object} val Sort specification { field: 1 } for ASC, { field: -1 } for DESC
     * @returns {CursorSQL}
     */
    sort(val: any): CursorSQL;
    /**
     * Execute the query and return documents
     * @returns {Promise<DocumentSQL[]>}
     */
    exec(): Promise<DocumentSQL[]>;
    /**
     * Convert cursor to array (alias for exec)
     * @returns {Promise<DocumentSQL[]>}
     */
    toArray(): Promise<DocumentSQL[]>;
    /**
     * Count documents matching the query
     * @returns {Promise<number>}
     */
    count(): Promise<number>;
    /**
     * Parse a row from MariaDB into a document object
     * @param {Object} row
     * @returns {Object}
     * @private
     */
    private _parseRow;
}
import DocumentSQL = require("./DocumentSQL");
//# sourceMappingURL=CursorSQL.d.ts.map