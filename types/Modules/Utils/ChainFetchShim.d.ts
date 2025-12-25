export = ChainFetch;
declare class ChainFetch {
    static get(url: any): ChainFetch;
    static post(url: any): ChainFetch;
    constructor(url: any, method?: string);
    url: any;
    method: string;
    headers: {
        "User-Agent": string;
    };
    queryObj: {};
    set(headers: any, value: any): this;
    query(params: any): this;
    send(body: any): this;
    body: any;
    toJSON(): this;
    parseJson: boolean;
    onlyBody(): Promise<unknown>;
    then(resolve: any, reject: any): Promise<void>;
}
//# sourceMappingURL=ChainFetchShim.d.ts.map