/**
 * Heavily inspired from Discord.js's Error code, which in turn is inspired from Node's `internal/errors` module
 */
declare const kCode: unique symbol;
export function register(sym: any, val: any): Map<any, any>;
export let Error: {
    new (key: any, meta: any, ...args: any[]): {
        [x: string]: any;
        _meta: any;
        get name(): string;
        get code(): any;
        [kCode]: any;
    };
    [x: string]: any;
};
export let TypeError: {
    new (key: any, meta: any, ...args: any[]): {
        [x: string]: any;
        _meta: any;
        get name(): string;
        get code(): any;
        [kCode]: any;
    };
    [x: string]: any;
};
export let RangeError: {
    new (key: any, meta: any, ...args: any[]): {
        [x: string]: any;
        _meta: any;
        get name(): string;
        get code(): any;
        [kCode]: any;
    };
    [x: string]: any;
};
export {};
//# sourceMappingURL=SkynetError.d.ts.map