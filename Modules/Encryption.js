const { loadConfigs } = require("../Configurations/env.js");
const { auth: { discord: { clientID } }, configJS: { encryptionPassword, encryptionIv } } = loadConfigs();
const { createCipheriv, createDecipheriv, pbkdf2Sync } = require("crypto");

const pass = Buffer.from(`${clientID}:${encryptionPassword}`).toString("base64");

const deriveKey = salt => pbkdf2Sync(pass, salt, 100000, 16, "sha512").toString("hex");
let password;

module.exports = class EncryptionManager {
	constructor (client) {
		this.client = client;
		const fetchApp = async () => {
			try {
				let salt = clientID;
				if (client.application && typeof client.application.fetch === "function") {
					const app = await client.application.fetch();
					if (app && app.owner && app.owner.id) salt = app.owner.id;
				}
				password = deriveKey(salt);
			} catch (err) {
				// swallow to avoid crash; will use fallback salt on next attempt
			}
		};
		// try immediately; also retry on ready in case application data isn't available yet
		fetchApp();
		client.once("ready", fetchApp);
	}

	encrypt (data) {
		if (!password) password = deriveKey(clientID);
		const cipher = createCipheriv("aes256", password, encryptionIv);
		let encrypted = cipher.update(data, "utf8", "hex");
		encrypted += cipher.final("hex");
		return encrypted;
	}

	decrypt (data) {
		if (!password) password = deriveKey(clientID);
		const decipher = createDecipheriv("aes256", password, encryptionIv);
		let decrypted = decipher.update(data, "hex", "utf8");
		decrypted += decipher.final("utf8");
		return decrypted;
	}
};
