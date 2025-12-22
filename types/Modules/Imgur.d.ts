export = Imgur;
declare class Imgur {
    constructor(clientID: any);
    clientID: any;
    uploadUrl(url: any, albumID: any): Promise<{
        status: any;
        body: any;
        data: any;
        raw: any;
    }>;
    createAlbum(): Promise<{
        status: any;
        body: any;
        data: any;
        raw: any;
    }>;
    getCredits(): Promise<{
        status: any;
        body: any;
        data: any;
        raw: any;
    }>;
    _createRequest(method: any, path: any, form: any): any;
}
//# sourceMappingURL=Imgur.d.ts.map