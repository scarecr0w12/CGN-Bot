export function index(req: any, { res }: {
    res: any;
}): Promise<void>;
export function article(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace article {
    export function compose(req: any, { res }: {
        res: any;
    }): Promise<void>;
    export namespace compose {
        function post(req: any, res: any): Promise<void>;
    }
    export function react(req: any, res: any): Promise<void>;
    function _delete(req: any, res: any): void;
    export { _delete as delete };
}
//# sourceMappingURL=blog.d.ts.map