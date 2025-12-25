export class Route {
    constructor(router: any, route: any, middleware: any, controller: any, method: any, type: any, parent: any);
    router: any;
    route: any;
    controller: any;
    isAPI: boolean;
    isStatic: boolean;
    state: string;
    parentRoute: any;
    advanced: boolean;
    wrapper: (req: any, res: any, next: any) => Promise<void>;
    middleware: any[];
}
export class DashboardRoute extends Route {
    postMiddleware: any[];
    postRoute: Route;
    deleteRoute: Route;
}
export class ConsoleRoute extends Route {
    postMiddleware: any[];
    perm: any;
    postRoute: Route;
}
//# sourceMappingURL=Route.d.ts.map