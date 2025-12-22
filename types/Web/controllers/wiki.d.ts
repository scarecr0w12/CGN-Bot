declare function _exports(req: any, { res }: {
    res: any;
}): Promise<void>;
declare namespace _exports {
    export function readArticle(req: any, { res }: {
        res: any;
    }): Promise<void>;
    export function edit(req: any, { res }: {
        res: any;
    }): Promise<void>;
    export namespace edit {
        function post(req: any, res: any): Promise<any>;
    }
    export function history(req: any, { res }: {
        res: any;
    }): Promise<void>;
    export function react(req: any, res: any): Promise<void>;
    export function _delete(req: any, res: any): void;
    export { _delete as delete };
}
export = _exports;
//# sourceMappingURL=wiki.d.ts.map