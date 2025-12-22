export let Boot: {
    (configs: any, scope: any): Promise<void>;
    preStack: (() => void)[];
    preShardStack: (() => void)[];
    runPreStack(): Promise<void>;
    bootStack: {
        func: () => NodeJS.Process;
        val: any;
    }[];
    populateStack(): void;
    runStack({ configJS, configJSON, auth }: {
        configJS: any;
        configJSON: any;
        auth: any;
    }, scope: any): Promise<void>;
};
export let Logger: typeof import("./Logger");
export let Constants: typeof import("./Constants");
export let Errors: {
    register: (sym: any, val: any) => Map<any, any>;
    Error: {
        new (key: any, meta: any, ...args: any[]): {
            [x: string]: any;
            _meta: any;
            get name(): string;
            get code(): any;
            [kCode]: any;
        };
        [x: string]: any;
    };
    TypeError: {
        new (key: any, meta: any, ...args: any[]): {
            [x: string]: any;
            _meta: any;
            get name(): string;
            get code(): any;
            [kCode]: any;
        };
        [x: string]: any;
    };
    RangeError: {
        new (key: any, meta: any, ...args: any[]): {
            [x: string]: any;
            _meta: any;
            get name(): string;
            get code(): any;
            [kCode]: any;
        };
        [x: string]: any;
    };
    Messages: typeof import("./Errors/Messages");
};
export let EventHandler: {
    new (client: any, configJS: any): import("./Events/EventHandler");
};
export let Sharder: typeof import("./Sharder");
export let SharderIPC: typeof import("./IPC");
export let ShardUtil: {
    new (client: any): import("./ShardUtil");
};
export let WorkerManager: typeof import("./WorkerManager");
//# sourceMappingURL=index.d.ts.map