export = ManageCommands;
declare class ManageCommands {
    constructor({ client, Constants: { Colors, Text, LoggingLevels } }: {
        client: any;
        Constants: {
            Colors: any;
            Text: any;
            LoggingLevels: any;
        };
    }, { serverDocument, serverQueryDocument, channelDocument, channelQueryDocument }: {
        serverDocument: any;
        serverQueryDocument: any;
        channelDocument: any;
        channelQueryDocument: any;
    }, msg: any, commandData: any);
    msg: any;
    suffix: any;
    channel: any;
    client: any;
    commandData: any;
    serverDocument: any;
    serverQueryDocument: any;
    channelDocument: any;
    channelQueryDocument: any;
    disableAll: any[];
    enableAll: any[];
    disableInChannel: any[];
    enableInChannel: any[];
    Colors: any;
    Text: any;
    LoggingLevels: any;
    parse(mode?: any): number;
    executeDisable(): Promise<void>;
    listDisabled(): Promise<void>;
    executeEnable(): Promise<void>;
    listEnabled(): Promise<void>;
}
//# sourceMappingURL=ManageCommands.d.ts.map