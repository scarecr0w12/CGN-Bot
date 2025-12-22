export const landing: (req: any, { res }: {
    res: any;
}) => Promise<void>;
export const activity: (req: any, { res }: {
    res: any;
}) => Promise<void>;
export const extensions: typeof import("./extensions");
export const wiki: {
    (req: any, { res }: {
        res: any;
    }): Promise<void>;
    readArticle: (req: any, { res }: {
        res: any;
    }) => Promise<void>;
    edit: {
        (req: any, { res }: {
            res: any;
        }): Promise<void>;
        post: (req: any, res: any) => Promise<any>;
    };
    history: (req: any, { res }: {
        res: any;
    }) => Promise<void>;
    react: (req: any, res: any) => Promise<void>;
    delete: (req: any, res: any) => void;
};
export const blog: typeof import("./blog");
export const donate: (req: any, { res }: {
    res: any;
}) => Promise<void>;
export const status: {
    (req: any, { res }: {
        res: any;
    }): Promise<void>;
    api: (req: any, res: any) => Promise<void>;
    shards: (req: any, res: any) => Promise<void>;
};
export const dashboard: typeof import("./dashboard");
export const console: typeof import("./maintainer");
export const auth: typeof import("./auth");
export const api: typeof import("./api");
export const debug: typeof import("./debug");
export const membership: typeof import("./membership");
export const seo: typeof import("./seo");
export const server: typeof import("./server");
export const referral: typeof import("./referral");
export const templates: typeof import("./templates");
export const widgets: typeof import("./widgets");
export const vote: typeof import("./vote");
export function headerImage(req: any, res: any): Promise<void>;
export function paperwork(req: any, { res }: {
    res: any;
}): void;
export function error(req: any, res: any, next: any): any;
export function add(req: any, res: any): any;
//# sourceMappingURL=index.d.ts.map