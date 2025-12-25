export = Extension;
declare class Extension {
    /**
     *	Create an Extension Module instance
     *	@param {Object} extensionDocument - The extension's subdocument
     *	@param {Document} serverDocument - The document of the guild in which the extension is being executed
     */
    constructor(extensionDocument: any, serverDocument: Document);
    name: any;
    type: any;
    key: any;
    keywords: any;
    case_sensitive: any;
    admin_level: any;
    interval: any;
    enabled_channel_ids: any;
    usage_help: any;
    extended_help: any;
    last_run: any;
    updates_available: any;
    description: any;
    points: any;
    owner_id: any;
    featured: any;
    event: any;
    fields: any;
    storage: {
        write: (key: any, value: any) => Promise<any>;
        get: (key: any) => any;
        delete: (key: any) => Promise<any>;
        clear: () => Promise<void>;
    };
}
//# sourceMappingURL=Extension.d.ts.map