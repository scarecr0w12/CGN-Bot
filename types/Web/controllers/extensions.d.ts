export function gallery(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace gallery {
    function modify(req: any, res: any): Promise<any>;
}
export function installer(req: any, { res }: {
    res: any;
}): Promise<any>;
export function my(req: any, { res }: {
    res: any;
}): Promise<void>;
export function builder(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace builder {
    function post(req: any, res: any): Promise<void>;
}
export function premium(req: any, res: any): Promise<any>;
export function sales(req: any, { res }: {
    res: any;
}): Promise<any>;
export function download(req: any, res: any): Promise<any>;
/**
 * Export an extension as a portable JSON package that can be imported on another Skynet instance.
 * Includes metadata and code bundled together.
 */
declare function _export(req: any, res: any): Promise<any>;
/**
 * Import an extension from an uploaded JSON package.
 * Creates a new extension owned by the current user.
 */
declare function _import(req: any, res: any): Promise<any>;
export { _export as export, _import as import };
//# sourceMappingURL=extensions.d.ts.map