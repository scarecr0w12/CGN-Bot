/**
 * Scan server members and create user documents for any missing users
 * POST /:svrid/administration/scan-members
 */
export function scanMembers(req: any, res: any): Promise<any>;
export function admins(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace admins {
    function post(req: any, res: any): void;
}
export function moderation(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace moderation {
    function post(req: any, res: any): Promise<void>;
}
export function blocked(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace blocked {
    function post(req: any, res: any): Promise<void>;
}
export function muted(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace muted {
    function post(req: any, res: any): Promise<void>;
}
export function strikes(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace strikes {
    function post(req: any, res: any): Promise<void>;
}
export function status(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace status {
    function post(req: any, res: any): Promise<void>;
}
export function filters(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace filters {
    function post(req: any, res: any): Promise<any>;
}
export function MOTD(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace MOTD {
    function post(req: any, res: any): Promise<void>;
}
export function voicetext(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace voicetext {
    function post(req: any, res: any): Promise<void>;
}
export function roles(req: any, { res }: {
    res: any;
}): Promise<void>;
export namespace roles {
    function post(req: any, res: any): Promise<void>;
}
export function logs(req: any, { res }: {
    res: any;
}): Promise<void>;
/**
 * Search members within a server
 * GET /api/dashboard/:svrid/search-members
 */
export function searchMembers(req: any, res: any): Promise<any>;
//# sourceMappingURL=administration.d.ts.map