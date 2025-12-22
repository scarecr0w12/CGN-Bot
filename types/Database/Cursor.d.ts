export = Cursor;
/**
 * A GADriver Cursor wrapper for the MongoDB Cursor
 * @class
 */
declare class Cursor {
    /**
     * Create a new Cursor
     * @param {Cursor} cursor
     * @param {Model} model
     */
    constructor(cursor: Cursor, model: Model);
    _model: Model;
    _client: any;
    _cursor: Cursor;
    skip(val: any): this;
    limit(val: any): this;
    sort(val: any): this;
    exec(): Promise<any>;
}
//# sourceMappingURL=Cursor.d.ts.map