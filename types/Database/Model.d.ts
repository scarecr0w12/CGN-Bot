export = Model;
declare class Model {
    /**
     * A representation of a MongoDB collection
     * @param {MongoClient} client The MongoDB client initialising the Model
     * @param {string} collection Name of the collection this Model is representing
     * @param {Schema} schema The schema of the collection this Model is representing
     * @constructor
     */
    constructor(client: MongoClient, collection: string, schema: Schema);
    schema: Schema;
    _collection: string;
    _client: any;
    _cache: Map<any, any>;
    /**
     * Find documents matching the query
     * @param {Object} query MongoDB query object
     * @param {Object} [opts] MongoDB find options
     * @returns {Cursor} A custom Cursor instance
     */
    find(query: any, opts?: any): Cursor;
    /**
     * Perform an aggregation pipeline
     * @param {Array} pipeline Aggregation pipeline stages
     * @param {Object} [opts] Aggregation options
     * @returns {Promise<Array>} Array of results
     */
    aggregate(pipeline: any[], opts?: any): Promise<any[]>;
    /**
     * Count documents matching the query
     * @param {Object} query MongoDB query object
     * @param {Object} [opts] Count options
     * @returns {Promise<number>} Count of documents
     */
    count(query: any, opts?: any): Promise<number>;
    /**
     * Finds a document by ID or filter object, returns null if no documents were found
     * @param {string|Object} query The ID of the object to find, or a filter object
     * @returns {Promise<Document|null>}
     */
    findOne(query: string | any): Promise<Document | null>;
    findOneByObjectID(id: any): Promise<Document>;
    update(query: any, operations: any, opts?: {}): Promise<any>;
    insert(data: any, opts: any): Promise<any>;
    delete(query: any, options: any): any;
    "new"(data: any): any;
    create(data: any): Promise<any>;
    _find(query: any, opts: any, multi: any): any;
    _findCache(query: any): any;
}
import Cursor = require("./Cursor");
import Document = require("./Document");
//# sourceMappingURL=Model.d.ts.map