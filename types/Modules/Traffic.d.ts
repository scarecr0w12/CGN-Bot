export = Traffic;
declare class Traffic {
    constructor(IPC: any, isWorker: any);
    db: any;
    IPC: any;
    logger: any;
    isWorker: any;
    pageViews: number;
    authViews: number;
    uniqueUsers: number;
    seenUsers: Set<any>;
    requestBuffer: any[];
    REQUEST_BUFFER_SIZE: number;
    REQUEST_BUFFER_FLUSH_INTERVAL: number;
    hashIP(ip: any): string;
    getAndReset(): {
        pageViews: number;
        authViews: number;
        uniqueUsers: number;
    };
    flush(pageViews: any, authViews: any, uniqueUsers: any): Promise<void>;
    fetch(): Promise<void>;
    count(userIdentifier: any, authenticated: any): void;
    logRequest(requestData: any): void;
    flushRequestBuffer(): Promise<void>;
    data(): Promise<{
        current: {
            pageViews: number;
            authViews: number;
            uniqueUsers: number;
        };
        day: any;
        days: {};
        week: any[];
        month: any[];
    }>;
}
//# sourceMappingURL=Traffic.d.ts.map