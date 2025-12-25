export = SharderIPC;
declare class SharderIPC {
    constructor(sharder: any, logger: any);
    sharder: any;
    logger: any;
    onEvents: Map<any, any>;
    onceEvents: Map<any, any>;
    send(subject: any, payload: any, shard: any, timeout: any): any;
    on(event: any, callback: any): void;
    once(event: any, callback: any): void;
    forward(event: any, prop?: string): void;
    shard(guildID: any): number;
}
//# sourceMappingURL=IPC.d.ts.map