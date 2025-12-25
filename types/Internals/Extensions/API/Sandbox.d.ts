export = Sandbox;
declare class Sandbox {
    constructor(rawClient: any, { extensionDocument, versionDocument, msg, guild, serverDocument, extensionConfigDocument, eventData }: {
        extensionDocument: any;
        versionDocument: any;
        msg: any;
        guild: any;
        serverDocument: any;
        extensionConfigDocument: any;
        eventData: any;
    }, scopes: any);
    require: (name: any) => any;
}
//# sourceMappingURL=Sandbox.d.ts.map