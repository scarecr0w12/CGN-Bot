export = TemporaryStorage;
declare class TemporaryStorage {
    _temporaryStorage: string;
    _metadataLocation: string;
    /**
     * Create a TemporaryStorage entry and directory.
     * @param {TemporaryStorageEntry} data
     * @returns {Promise<TemporaryStorageEntry>}
     */
    create(data: TemporaryStorageEntry): Promise<TemporaryStorageEntry>;
    /**
     * Get a TemporaryStorage entry.
     * @param type
     * @param id
     * @returns {Promise<?TemporaryStorageEntry>}
     */
    get(type: any, id: any): Promise<TemporaryStorageEntry | null>;
    /**
     * Delete a TemporaryStorage entry.
     * @param type
     * @param id
     * @returns {Promise<?TemporaryStorageEntry>}
     */
    delete(type: any, id: any): Promise<TemporaryStorageEntry | null>;
    /**
     * Create a metadata entry.
     * @param {TemporaryStorageEntry} data
     * @returns {Promise<TemporaryStorageMetadata>}
     * @private
     */
    private _createMetadataEntry;
    /**
     * Delete a metadata entry.
     * @param {TemporaryStorageEntry} data
     * @returns {Promise<TemporaryStorageMetadata>}
     * @private
     */
    private _deleteMetadataEntry;
    /**
     * Get current metadata.
     * @returns {Promise<TemporaryStorageMetadata>}
     * @private
     */
    private _getMetadata;
    createStorage(): Promise<void>;
}
declare namespace TemporaryStorage {
    export { TemporaryStorageEntry, TemporaryStorageMetadata };
}
/**
 * A metadata entry for TemporaryStorage.
 */
type TemporaryStorageEntry = {
    prefix: string;
    type: string;
    id: string | null;
    path: string | null;
    persistent: boolean;
};
/**
 * TemporaryStorage metadata.
 */
type TemporaryStorageMetadata = {
    entries: TemporaryStorageEntry[];
};
//# sourceMappingURL=Temp.d.ts.map