export = SnekfetchShim;
declare class SnekfetchShim {
    constructor(method: any, url: any);
    method: any;
    url: any;
    headers: {
        "User-Agent": string;
    };
    bodyData: any;
    queryParams: {};
    set(key: any, value: any): this;
    query(params: any): this;
    send(data: any): this;
    attach(name: any, data: any, filename: any): this;
    formData: Map<any, any>;
    then(resolve: any, reject: any): Promise<void>;
    _execute(): Promise<{
        ok: boolean;
        status: number;
        statusCode: number;
        headers: {
            [k: string]: string;
        };
        body: unknown;
        text: string;
    }>;
}
declare namespace SnekfetchShim {
    export { get, post, put, patch, _delete as delete, head };
}
export function get(url: any): SnekfetchShim;
export function post(url: any): SnekfetchShim;
export function put(url: any): SnekfetchShim;
export function patch(url: any): SnekfetchShim;
export function head(url: any): SnekfetchShim;
//# sourceMappingURL=SnekfetchShim.d.ts.map