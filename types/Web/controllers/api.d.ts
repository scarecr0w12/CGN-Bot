export function status(req: any, res: any): Promise<void>;
export function servers(req: any, res: any): Promise<void>;
export namespace servers {
    function channels(req: any, res: any): Promise<any>;
    function list(req: any, res: any): Promise<void>;
}
export function users(req: any, res: any): Promise<void>;
export namespace users {
    function list(req: any, res: any): Promise<void>;
}
export function extensions(req: any, res: any): Promise<void>;
export namespace extensions {
    function purchase(req: any, res: any): Promise<any>;
    function ownership(req: any, res: any): Promise<any>;
}
export namespace user {
    function language(req: any, res: any): Promise<any>;
}
//# sourceMappingURL=api.d.ts.map