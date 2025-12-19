/* eslint-disable no-unused-vars */
const specVersion = "1.0";

const { EventEmitter } = require("events");
const fs = require("fs");
const https = require("https");
const path = require("path");
const fetch = require("./Utils/ChainFetchShim");
const Unzip = require("adm-zip");
const { Console, Constants, Errors: { Error: SkynetError } } = require("../Internals");
const { FileExists, PromiseWait } = require("./Utils");

const validateSpecVersion = body => specVersion;

class SkynetClient {
	constructor (botClient) {
		this.bot = botClient;
		this._apis = {
			versions: new VersionAPI(this),
		};
	}

	/**
	 * Check if development mode is enabled
	 * @returns {boolean} True if DEV_MODE is enabled
	 */
	isDevMode () {
		return process.env.DEV_MODE === "true" || process.env.DEV_MODE === "1";
	}

	API (api) {
		return this._apis[api];
	}
}

class VersionAPI {
	constructor (gClient) {
		this.client = gClient;
		this._branch = null;
		this.endpoint = `${Constants.CENTRAL.GITHUB_API}/repos/${Constants.CENTRAL.REPO_OWNER}/${Constants.CENTRAL.REPO_NAME}`;
	}

	branch (branch) {
		this._branch = branch;
		return this;
	}

	async get (version) {
		// Try to fetch by tag (try with and without 'v' prefix)
		let res = await this._get(`/releases/tags/${version}`);
		if (!res.ok && !version.startsWith("v")) {
			res = await this._get(`/releases/tags/v${version}`);
		}

		if (res.ok && res.body) {
			return new Version(res.body, true, this);
		} else if (res.status === 404) {
			return new Version({ tag_name: version, name: version, body: "Version not found on GitHub." }, false, this);
		} else {
			throw new SkynetError("CENTRAL_ERROR", { status: res.status }, res.status, res.body && res.body.message);
		}
	}

	async _get (URL) {
		let res;
		try {
			res = await fetch.get(`${this.endpoint}${URL}`).set("User-Agent", Constants.UserAgent);
		} catch (err) {
			return { ok: false, status: 500, body: { err: err.message } };
		}
		// GitHub API doesn't return apiVersion, so we skip validateSpecVersion
		return res;
	}
}

class Version extends EventEmitter {
	constructor (remoteVersion, valid, API) {
		super();
		this._v = remoteVersion;
		this.valid = valid;
		this.versionAPI = API;

		this.metadata = {
			changelog: this._v.body || "No changelog available.",
			name: this._v.name || this.tag,
			published_at: this._v.published_at,
			description: this._v.name || this.tag,
		};
	}

	async check () {
		if (!this.valid) return { utd: false, current: null };
		const res = await this.versionAPI._get(`/releases/latest`);
		if (!res.ok && res.status !== 404) throw new SkynetError("CENTRAL_ERROR", { status: res.status }, res.status, res.body && res.body.message);
		else if (!res.ok && res.status === 404) return { utd: false, current: null };

		const latest = res.body;
		const latestTag = latest.tag_name;

		// Basic tag comparison
		if (this.tag === latestTag || `v${this.tag}` === latestTag || this.tag === `v${latestTag}`) {
			return { utd: true, current: new Version(latest, true, this.versionAPI) };
		} else {
			return { utd: false, current: new Version(latest, true, this.versionAPI) };
		}
	}

	async download (onChunk) {
		const { path: tempFolder } = await this.versionAPI.client.bot.tempStorage.create({ type: "version", persistent: true, id: this.tag });
		return new Promise((resolve, reject) => {
			const fileStream = fs.createWriteStream(path.join(tempFolder, `${this.tag}.zip`));
			const downloadUrl = this._v.zipball_url;

			const get = (url) => {
				https.get(url, { headers: { "User-Agent": Constants.UserAgent } }, res => {
					const { statusCode } = res;

					if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
						return get(res.headers.location);
					}

					if (statusCode !== 200) reject(new SkynetError("CENTRAL_DOWNLOAD_ERROR", {}, statusCode));

					res.on("data", chunk => {
						if (onChunk) onChunk(chunk);
					});

					res.on("end", () => {
						this._downloadPath = tempFolder;
						resolve(tempFolder);
					});

					res.pipe(fileStream);
				}).on("error", reject);
			};

			if (!downloadUrl) reject(new SkynetError("CENTRAL_DOWNLOAD_ERROR_NO_URL", {}, 404));
			else get(downloadUrl);
		});
	}

	async checkDownload (id = this.tag) {
		const entry = await this.versionAPI.client.bot.tempStorage.get("version", id);
		if (entry) this._downloadPath = entry.path;
		return !!entry;
	}

	async install () {
		// Check if dev mode is enabled - prevent updates from overwriting local files
		if (this.versionAPI.client.isDevMode()) {
			this._log("install", "⚠️ DEV_MODE is enabled - updates are disabled to protect local changes.", "warn");
			this._log("install", "Set DEV_MODE=false in .env to enable updates.", "warn");
			this.emit("installFinish");
			return;
		}

		await this.checkDownload();
		const downloadedVersionPath = path.join(this._downloadPath, `${this.tag}.zip`);
		if (!await FileExists(downloadedVersionPath)) throw new SkynetError("CENTRAL_VERSION_NOT_DOWNLOADED");

		try {
			this._log("unpack", "Unpacking patch files...");
			await this._unpackVersion(downloadedVersionPath);
			this._log("unpack", "Unpacked patch files.", "success");
		} catch (err) {
			this._log("unpack", `An error occurred while unpacking files. ${err.message}`, "error");
			throw err;
		}

		// Dynamically find the extracted folder (GitHub puts it in Repo-Ref folder)
		const extractedContents = await fs.promises.readdir(this._downloadPath);
		const directories = extractedContents.filter(item => item !== `${this.tag}.zip` && fs.statSync(path.join(this._downloadPath, item)).isDirectory());

		if (directories.length === 1) {
			this._downloadPath = path.join(this._downloadPath, directories[0]);
		}

		let fileList, configFileList;

		try {
			this._log("patching", "Preparing files for patching...");
			[fileList, configFileList] = await this._generateFileList();
			await this._checkForConflicts();
			await PromiseWait(50);
			const fileTotal = await this._patchFiles(fileList, downloadedVersionPath);
			this._log("patching", `Successfully patched ${fileTotal} files.`, "success");
		} catch (err) {
			this._log("patching", `A fatal error occurred while patching update files! ${err.message}`, "error");
			throw err;
		}

		try {
			this._log("patchingc", "Preparing configuration files for patching...");
			await PromiseWait(50);
			const cFileTotal = await this._patchConfigurationFiles(configFileList, downloadedVersionPath);
			this._log("patchingc", `Successfully patched ${cFileTotal} configuration files.`, "success");
		} catch (err) {
			this._log("patchingc", `A fatal error occurred while patching configuration files! ${err.message}`, "error");
		}

		try {
			this._log("verify", "Verifying installation...");
			await PromiseWait(50);
			await this._verifyInstall([...fileList, ...configFileList]);
			this._log("verify", "Installation verified.", "success");
		} catch (err) {
			this._log("verify", `Failed to verify installation. Please fix the following error and try again: ${err.message}`, "error");
			throw err;
		}

		try {
			this._log("cleanup", "Cleaning up update...");
			await PromiseWait(50);
			await this._cleanUpInstall();
			this._log("cleanup", `Finished updating SkynetBot to version ${this.metadata.name}.`, "success");
		} catch (err) {
			this._log("cleanup", `Failed to clean up installation. This is not a fatal exception. ${err.message}`, "warn");
		}
		this.emit("installFinish");
	}

	_log (id, msg, type = "info") {
		this.emit("installLog", { id, msg, type });
	}

	async _unpackVersion (DVP) {
		const versionArchive = new Unzip(DVP);
		await versionArchive.extractAllTo(this._downloadPath, true);
		return versionArchive;
	}

	async _generateFileList () {
		// Recursive file list generation since GitHub zip preserves directory structure
		const getFiles = async (dir, baseDir = "") => {
			const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
			const files = await Promise.all(dirents.map((dirent) => {
				const res = path.resolve(dir, dirent.name);
				const relPath = path.join(baseDir, dirent.name);
				return dirent.isDirectory() ? getFiles(res, relPath) : relPath;
			}));
			return Array.prototype.concat(...files);
		};

		const allFiles = await getFiles(this._downloadPath);
		// Filter out unrelated files/folders if necessary, but for now take all
		// Original code had this.files property from API, but GitHub API doesn't give file list.
		// So we use extracted files.

		const configFiles = allFiles.filter(file => file.startsWith("Configurations/"));
		const files = allFiles.filter(file => !file.startsWith("Configurations/"));
		return [files, configFiles];
	}

	async _checkForConflicts () {
		const conflicts = [];
		const botRoot = path.join(__dirname, `..`);

		// Get list of files that will be patched
		const [files, configFiles] = await this._generateFileList();
		const allFiles = [...files, ...configFiles];

		for (const filePath of allFiles) {
			const targetPath = path.join(botRoot, filePath);
			const patchPath = path.join(this._downloadPath, filePath);

			// Check if target file exists and differs from patch
			if (await FileExists(targetPath) && await FileExists(patchPath)) {
				try {
					const targetBuffer = await fs.promises.readFile(targetPath);
					const patchBuffer = await fs.promises.readFile(patchPath);

					// If files differ, check if it's a meaningful conflict
					if (!targetBuffer.equals(patchBuffer)) {
						// Skip binary files and certain auto-generated files
						const ext = path.extname(filePath).toLowerCase();
						const skipExtensions = [".zip", ".png", ".jpg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot"];

						if (!skipExtensions.includes(ext)) {
							conflicts.push({
								file: filePath,
								reason: "Local file differs from update",
							});
						}
					}
				} catch (err) {
					// If we can't read the file, log but don't block
					this._log("conflicts", `Warning: Could not check ${filePath}: ${err.message}`, "warn");
				}
			}
		}

		if (conflicts.length > 0) {
			this._log("conflicts", `Found ${conflicts.length} file(s) that differ from the update. These will be overwritten.`, "warn");
			for (const conflict of conflicts.slice(0, 10)) {
				this._log("conflicts", `  - ${conflict.file}`, "warn");
			}
			if (conflicts.length > 10) {
				this._log("conflicts", `  ... and ${conflicts.length - 10} more`, "warn");
			}
		}

		// Store conflicts for potential rollback/review but don't block update
		this._conflicts = conflicts;
		return true;
	}

	async _patchFiles (fileList) {
		for (const filePath of fileList) {
			await PromiseWait(50);
			await this._patchFile(filePath);
		}
		return fileList.length;
	}

	async _patchFile (filePath, configFile = false) {
		const patchLocation = path.join(this._downloadPath, filePath);
		const patchTarget = path.join(path.join(__dirname, `..`), filePath);

		// Ensure directory exists
		await fs.promises.mkdir(path.dirname(patchTarget), { recursive: true });

		if (!await FileExists(patchLocation) && await FileExists(patchTarget)) {
			// If file exists in target but not in update, do we delete it?
			// In git based update, yes. But here we iterate over *new* files.
			// So this condition (!patchLocation && patchTarget) is never met if iterating fileList from update.
			// To support deletion, we'd need to compare target tree with update tree.
			// For now, we only overwrite/add.
		} else if (await FileExists(patchLocation)) {
			this._log(configFile ? "patchingc" : "patching", `Patching file ${filePath}...`);
			await fs.promises.copyFile(patchLocation, patchTarget);
		}
	}

	async _patchConfigurationFiles (fileList) {
		for (const filePath of fileList) {
			await PromiseWait(50);
			await this._patchFile(filePath, true);
		}
		return fileList.length;
	}

	async _verifyInstall (fileList) {
		let verifiedPatches = [];
		for (const filePath of fileList) {
			await PromiseWait(50);
			const fileValid = await this._verifyFile(filePath);
			if (fileValid) {
				verifiedPatches++;
				this._log("verify", `Verified ${verifiedPatches} patches out of ${fileList.length}...`);
			} else {
				throw new SkynetError("PATCH_CORRUPTED", {}, filePath);
			}
		}
		return true;
	}

	async _verifyFile (filePath) {
		const patchLocation = path.join(this._downloadPath, filePath);
		const patchTarget = path.join(path.join(__dirname, `..`), filePath);

		const patchBuffer = await FileExists(patchLocation) ? await fs.promises.readFile(patchLocation) : Buffer.alloc(0);
		const patchedBuffer = await FileExists(patchTarget) ? await fs.promises.readFile(patchTarget) : Buffer.alloc(0);

		return patchBuffer.equals(patchedBuffer);
	}

	async _cleanUpInstall () {
		await this.versionAPI.client.bot.tempStorage.delete("version", this.tag);
	}

	get tag () {
		return this._v.tag_name || this._v.name;
	}

	get branch () {
		return this._v.target_commitish || this._branch;
	}

	get sha () {
		// GitHub release doesn't explicitly provide SHA in the root object, but it is in target_commitish sometimes
		return this._v.target_commitish || "unknown";
	}

	// 'files' getter was removed because we generate it dynamically now
}

module.exports = SkynetClient;
