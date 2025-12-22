export = SkynetClient;
declare class SkynetClient {
    constructor(botClient: any);
    bot: any;
    _apis: {
        versions: VersionAPI;
    };
    /**
     * Check if development mode is enabled
     * @returns {boolean} True if DEV_MODE is enabled
     */
    isDevMode(): boolean;
    API(api: any): any;
}
declare class VersionAPI {
    constructor(gClient: any);
    client: any;
    _branch: any;
    endpoint: string;
    branch(branch: any): this;
    get(version: any): Promise<Version>;
    _get(URL: any): Promise<any>;
}
declare class Version extends EventEmitter<any> {
    constructor(remoteVersion: any, valid: any, API: any);
    _v: any;
    valid: any;
    versionAPI: any;
    metadata: {
        changelog: any;
        name: any;
        published_at: any;
        description: any;
    };
    check(): Promise<{
        utd: boolean;
        current: Version;
    }>;
    download(onChunk: any): Promise<any>;
    _downloadPath: any;
    checkDownload(id?: any): Promise<boolean>;
    install(): Promise<void>;
    _log(id: any, msg: any, type?: string): void;
    _unpackVersion(DVP: any): Promise<any>;
    _generateFileList(): Promise<any[]>;
    _checkForConflicts(): Promise<boolean>;
    _conflicts: {
        file: any;
        reason: string;
    }[];
    _patchFiles(fileList: any): Promise<any>;
    _patchFile(filePath: any, configFile?: boolean): Promise<void>;
    _patchConfigurationFiles(fileList: any): Promise<any>;
    _verifyInstall(fileList: any): Promise<boolean>;
    _verifyFile(filePath: any): Promise<boolean>;
    _cleanUpInstall(): Promise<void>;
    get tag(): any;
    get branch(): any;
    get sha(): any;
}
import { EventEmitter } from "node:events";
//# sourceMappingURL=SkynetClient.d.ts.map