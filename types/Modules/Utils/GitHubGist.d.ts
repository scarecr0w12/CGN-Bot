export = GitHubGist;
declare class GitHubGist {
    constructor(client: any);
    client: any;
    public: boolean;
    headers: {
        "User-Agent": string;
        Accept: string;
        "Content-Type": string;
    };
    apiURL: string;
    /**
     * Uploads text to GitHub Gist
     * @param {Object} [options] The text object
     * @param {String} [options.title] Optional title for the Gist
     * @param {String} options.text The content of the Gist
     * @returns {Object} Object containing the id and the url to the Gist
     */
    upload({ title, text, file }?: {
        title?: string;
        text: string;
    }): any;
    delete(id: any): Promise<boolean>;
}
//# sourceMappingURL=GitHubGist.d.ts.map