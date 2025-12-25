export = ObjectID;
/**
 * Create or validate an ObjectID
 * For MongoDB: Returns actual ObjectId instance
 * For MariaDB: Returns MariaDBObjectId wrapper
 * @param {string} [id] - The ID string to convert, or undefined to generate new
 * @returns {ObjectId|MariaDBObjectId} - ObjectId for MongoDB, MariaDBObjectId for MariaDB
 */
declare function ObjectID(id?: string): ObjectId | MariaDBObjectId;
declare namespace ObjectID {
    /**
     * Check if a string is a valid ObjectID format
     * @param {string} id - The ID to validate
     * @returns {boolean}
     */
    function isValid(id: string): boolean;
    /**
     * Generate a new ObjectID
     * @returns {ObjectId|MariaDBObjectId}
     */
    function generate(): ObjectId | MariaDBObjectId;
}
/**
 * MariaDB ObjectID wrapper class
 * Wraps string IDs to provide consistent interface with MongoDB ObjectId
 */
declare class MariaDBObjectId {
    static generate(): string;
    static isValid(id: any): boolean;
    constructor(id: any);
    _id: string;
    toString(): string;
    toHexString(): string;
    equals(other: any): boolean;
}
//# sourceMappingURL=ObjectID.d.ts.map