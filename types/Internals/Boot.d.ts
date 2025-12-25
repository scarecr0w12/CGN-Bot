export = Boot;
declare function Boot(configs: any, scope: any): Promise<void>;
declare namespace Boot {
    let preStack: (() => void)[];
    let preShardStack: (() => void)[];
    function runPreStack(): Promise<void>;
    let bootStack: {
        func: () => NodeJS.Process;
        val: any;
    }[];
    function populateStack(): void;
    function runStack({ configJS, configJSON, auth }: {
        configJS: any;
        configJSON: any;
        auth: any;
    }, scope: any): Promise<void>;
}
//# sourceMappingURL=Boot.d.ts.map