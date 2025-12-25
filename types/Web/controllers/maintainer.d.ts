export function maintainer(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace servers {
    function list(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace list {
        function post(req: any, res: any): Promise<void>;
    }
    function bigmessage(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace bigmessage {
        function post(req: any, res: any): Promise<void>;
    }
}
/**
 * Global scan - scan all servers for members and create user documents
 * POST /dashboard/maintainer/global-scan
 */
export function globalScan(req: any, res: any): Promise<void>;
export namespace options {
    function premiumExtensionsSales(req: any, { res }: {
        res: any;
    }): Promise<any>;
    function premiumExtensions(req: any, { res }: {
        res: any;
    }): Promise<any>;
    namespace premiumExtensions {
        function post(req: any, res: any): Promise<any>;
    }
    function blocklist(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace blocklist {
        function post(req: any, res: any): Promise<void>;
    }
    function bot(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace bot {
        function post(req: any, res: any): Promise<void>;
    }
    function homepage(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace homepage {
        function post(req: any, res: any): Promise<void>;
    }
    function contributors(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace contributors {
        function post(req: any, res: any): Promise<void>;
    }
    function donations(req: any, { res }: {
        res: any;
    }): Promise<any>;
    namespace donations {
        function post(req: any, res: any): Promise<any>;
    }
    function voteSites(req: any, { res }: {
        res: any;
    }): Promise<any>;
    namespace voteSites {
        function post(req: any, res: any): Promise<any>;
    }
    function botLists(req: any, { res }: {
        res: any;
    }): Promise<any>;
    namespace botLists {
        function post(req: any, res: any): Promise<any>;
        function syncCommands(req: any, res: any): Promise<any>;
    }
}
export namespace membership {
    function features(req: any, { res }: {
        res: any;
    }): Promise<any>;
    namespace features {
        function post(req: any, res: any): Promise<any>;
    }
    function tiers(req: any, { res }: {
        res: any;
    }): Promise<any>;
    namespace tiers {
        function post(req: any, res: any): Promise<any>;
    }
    function oauth(req: any, { res }: {
        res: any;
    }): Promise<any>;
    namespace oauth {
        function post(req: any, res: any): Promise<any>;
    }
    function payments(req: any, { res }: {
        res: any;
    }): Promise<any>;
    namespace payments {
        function post(req: any, res: any): Promise<any>;
    }
    function servers(req: any, { res }: {
        res: any;
    }): Promise<any>;
    namespace servers {
        function post(req: any, res: any): Promise<any>;
        function cancel(req: any, res: any): Promise<any>;
    }
    function email(req: any, { res }: {
        res: any;
    }): Promise<any>;
    namespace email {
        function post(req: any, res: any): Promise<any>;
        function test(req: any, res: any): Promise<any>;
    }
}
export namespace management {
    function maintainers(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace maintainers {
        function post(req: any, res: any): Promise<any>;
    }
    function shards(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace shards {
        function post(req: any, res: any): Promise<any>;
    }
    function injection(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace injection {
        function post(req: any, res: any): Promise<void>;
    }
    function version(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace version {
        function post(req: any, res: any): Promise<void>;
        function socket(socket: any): Promise<void>;
    }
    function eval(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace eval {
        function post(req: any, res: any): Promise<void>;
    }
    function logs(req: any, { res }: {
        res: any;
    }): Promise<void>;
    namespace logs {
        function socket(socket: any): Promise<void>;
    }
}
export namespace feedback {
    export function list(req: any, { res }: {
        res: any;
    }): Promise<void>;
    export function update(req: any, res: any): Promise<any>;
    function _delete(req: any, res: any): Promise<any>;
    export { _delete as delete };
    export function submit(req: any, res: any): Promise<any>;
}
export namespace tickets {
    export function list(req: any, { res }: {
        res: any;
    }): Promise<void>;
    export function view(req: any, { res }: {
        res: any;
    }): Promise<any>;
    export function update(req: any, res: any): Promise<any>;
    export function reply(req: any, res: any): Promise<any>;
    export function close(req: any, res: any): Promise<any>;
    function _delete(req: any, res: any): Promise<any>;
    export { _delete as delete };
    export function transcript(req: any, res: any): Promise<any>;
    export { getNextTicketNumber };
}
export function extensionQueue(req: any, { res }: {
    res: any;
}): Promise<void>;
export function networkApprovals(req: any, { res }: {
    res: any;
}): Promise<void>;
export function featuredCreators(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace featuredCreators {
    function setFeatured(req: any, res: any): Promise<any>;
    function updateStats(req: any, res: any): Promise<any>;
    function getCreatorStatus(req: any, res: any): Promise<void>;
}
export const indexnow: typeof import("./indexnow");
export const cloudflare: typeof import("./cloudflare");
/**
 * Get next ticket number (auto-increment)
 */
declare function getNextTicketNumber(): Promise<any>;
export {};
//# sourceMappingURL=maintainer.d.ts.map