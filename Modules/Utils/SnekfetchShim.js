/**
 * Snekfetch compatibility shim using undici/native fetch
 * Replaces the deprecated snekfetch package
 */
const Constants = require("../../Internals/Constants");

class SnekfetchShim {
	constructor(method, url) {
		this.method = method;
		this.url = url;
		this.headers = { "User-Agent": Constants.UserAgent };
		this.bodyData = null;
		this.queryParams = {};
	}

	static get(url) { return new SnekfetchShim("GET", url); }
	static post(url) { return new SnekfetchShim("POST", url); }
	static put(url) { return new SnekfetchShim("PUT", url); }
	static patch(url) { return new SnekfetchShim("PATCH", url); }
	static delete(url) { return new SnekfetchShim("DELETE", url); }
	static head(url) { return new SnekfetchShim("HEAD", url); }

	set(key, value) {
		if (typeof key === "object") {
			Object.assign(this.headers, key);
		} else {
			this.headers[key] = value;
		}
		return this;
	}

	query(params) {
		if (typeof params === "object") {
			Object.assign(this.queryParams, params);
		}
		return this;
	}

	send(data) {
		this.bodyData = data;
		return this;
	}

	attach(name, data, filename) {
		// For file uploads - simplified implementation
		if (!this.formData) {
			this.formData = new Map();
		}
		this.formData.set(name, { data, filename });
		return this;
	}

	async then(resolve, reject) {
		try {
			const result = await this._execute();
			resolve(result);
		} catch (err) {
			reject(err);
		}
	}

	async _execute() {
		let url = this.url;

		// Append query parameters
		if (Object.keys(this.queryParams).length > 0) {
			const urlObj = new URL(url);
			Object.entries(this.queryParams).forEach(([k, v]) => {
				urlObj.searchParams.append(k, v);
			});
			url = urlObj.toString();
		}

		const options = {
			method: this.method,
			headers: { ...this.headers },
		};

		// Handle body data
		if (this.bodyData && this.method !== "GET" && this.method !== "HEAD") {
			if (typeof this.bodyData === "object") {
				if (this.headers["Content-Type"] === "application/x-www-form-urlencoded") {
					options.body = new URLSearchParams(this.bodyData).toString();
				} else {
					options.headers["Content-Type"] = options.headers["Content-Type"] || "application/json";
					options.body = JSON.stringify(this.bodyData);
				}
			} else {
				options.body = this.bodyData;
			}
		}

		const response = await fetch(url, options);
		const contentType = response.headers.get("content-type") || "";

		let body;
		if (contentType.includes("application/json")) {
			body = await response.json().catch(() => null);
		} else if (contentType.includes("image") || contentType.includes("octet-stream")) {
			body = Buffer.from(await response.arrayBuffer());
		} else {
			body = await response.text();
		}

		return {
			ok: response.ok,
			status: response.status,
			statusCode: response.status,
			headers: Object.fromEntries(response.headers.entries()),
			body,
			text: typeof body === "string" ? body : JSON.stringify(body),
		};
	}
}

// Export both the class and convenience methods
module.exports = SnekfetchShim;
module.exports.get = SnekfetchShim.get;
module.exports.post = SnekfetchShim.post;
module.exports.put = SnekfetchShim.put;
module.exports.patch = SnekfetchShim.patch;
module.exports.delete = SnekfetchShim.delete;
module.exports.head = SnekfetchShim.head;

