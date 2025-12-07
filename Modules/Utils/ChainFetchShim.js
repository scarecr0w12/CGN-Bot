const Constants = require("../../Internals/Constants");

class ChainFetch {
	constructor (url, method = "GET") {
		this.url = url;
		this.method = method;
		this.headers = { "User-Agent": Constants.UserAgent };
		this.queryObj = {};
	}

	static get (url) { return new ChainFetch(url, "GET"); }
	static post (url) { return new ChainFetch(url, "POST"); }

	set (headers, value) {
		if (typeof headers === "object") {
			Object.assign(this.headers, headers);
		} else if (headers && value) {
			this.headers[headers] = value;
		}
		return this;
	}

	query (params) {
		Object.assign(this.queryObj, params);
		return this;
	}

	send (body) {
		this.body = body;
		return this;
	}

	toJSON () {
		this.parseJson = true;
		return this;
	}

	async onlyBody () {
		const url = new URL(this.url);
		Object.entries(this.queryObj).forEach(([k, v]) => url.searchParams.append(k, v));

		const res = await fetch(url.toString(), {
			method: this.method,
			headers: this.headers,
			body: this.body ? JSON.stringify(this.body) : undefined,
		});

		if (this.parseJson || (res.headers.get("content-type") && res.headers.get("content-type").includes("application/json"))) {
			return res.json();
		}
		return res.text();
	}

	async then (resolve, reject) {
		let url;
		try {
			url = new URL(this.url);
		} catch (e) {
			// Handle partial urls if base is not set, but chainfetch usually expects full urls or relative to something?
			// Assuming full URLs for now as per commands.
			// If this.url is relative, this throws.
			if (this.url.startsWith("http")) {
				url = new URL(this.url);
			} else {
				// Fallback or error? Native fetch handles relative if base is document, but here we are in node.
				// We'll assume strict URL or let fetch handle it.
				url = this.url;
			}
		}

		if (url instanceof URL) {
			Object.entries(this.queryObj).forEach(([k, v]) => url.searchParams.append(k, v));
			url = url.toString();
		} else {
			// Manual query append if string?
			const queryString = new URLSearchParams(this.queryObj).toString();
			if (queryString) url += (url.includes("?") ? "&" : "?") + queryString;
		}

		try {
			const res = await fetch(url, {
				method: this.method,
				headers: this.headers,
				body: this.body ? JSON.stringify(this.body) : undefined,
			});
			const body = res.headers.get("content-type") && res.headers.get("content-type").includes("application/json") ?
				await res.json().catch(() => null) :
				await res.text().catch(() => null);

			resolve({
				ok: res.ok,
				status: res.status,
				body,
			});
		} catch (err) {
			reject(err);
		}
	}
}

module.exports = ChainFetch;
