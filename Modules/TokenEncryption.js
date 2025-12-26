/**
 * Token Encryption Utility
 *
 * Provides AES-256-GCM encryption for storing sensitive tokens
 * like OAuth access tokens and refresh tokens.
 */

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Get or generate the encryption key from environment
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey () {
	const envKey = process.env.TOKEN_ENCRYPTION_KEY;

	if (!envKey) {
		// Fall back to deriving from session secret (less secure but functional)
		const configJS = require("../Configurations/config.js");
		if (!configJS.secret) {
			throw new Error("TOKEN_ENCRYPTION_KEY or session secret must be configured for token encryption");
		}
		logger.warn("TOKEN_ENCRYPTION_KEY not set - using derived key from session secret. Set TOKEN_ENCRYPTION_KEY for better security.");
		// Use session secret as input with a unique salt derived from hostname
		const uniqueSalt = crypto.createHash("sha256").update(`token-salt-${require("os").hostname()}`).digest();
		return crypto.scryptSync(configJS.secret, uniqueSalt, 32);
	}

	// If the key is hex-encoded (64 chars), decode it
	if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
		return Buffer.from(envKey, "hex");
	}

	// Otherwise derive a key from the provided string with a unique salt
	const uniqueSalt = crypto.createHash("sha256").update(`token-encryption-${require("os").hostname()}`).digest();
	return crypto.scryptSync(envKey, uniqueSalt, 32);
}

/**
 * Encrypt a token or sensitive string
 * @param {string} plaintext - The token to encrypt
 * @returns {string} Encrypted token as base64 string (iv:authTag:ciphertext)
 */
function encrypt (plaintext) {
	if (!plaintext) return null;

	try {
		const key = getEncryptionKey();
		const iv = crypto.randomBytes(IV_LENGTH);

		const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
		let encrypted = cipher.update(plaintext, "utf8", "base64");
		encrypted += cipher.final("base64");

		const authTag = cipher.getAuthTag();

		// Format: iv:authTag:ciphertext (all base64)
		return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
	} catch (err) {
		logger.error("Token encryption failed", {}, err);
		return null;
	}
}

/**
 * Decrypt an encrypted token
 * @param {string} encryptedToken - The encrypted token string
 * @returns {string|null} Decrypted plaintext or null if decryption fails
 */
function decrypt (encryptedToken) {
	if (!encryptedToken) return null;

	try {
		const parts = encryptedToken.split(":");
		if (parts.length !== 3) {
			logger.warn("Invalid encrypted token format");
			return null;
		}

		const [ivBase64, authTagBase64, ciphertext] = parts;
		const key = getEncryptionKey();
		const iv = Buffer.from(ivBase64, "base64");
		const authTag = Buffer.from(authTagBase64, "base64");

		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(ciphertext, "base64", "utf8");
		decrypted += decipher.final("utf8");

		return decrypted;
	} catch (err) {
		logger.error("Token decryption failed", {}, err);
		return null;
	}
}

/**
 * Generate a new random encryption key
 * @returns {string} Hex-encoded 256-bit key
 */
function generateKey () {
	return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token for comparison (one-way)
 * @param {string} token - Token to hash
 * @returns {string} SHA-256 hash of the token
 */
function hashToken (token) {
	if (!token) return null;
	return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Encrypt token data for storage in user document
 * @param {object} tokenData - Object with access_token, refresh_token, etc.
 * @returns {object} Object with encrypted tokens
 */
function encryptTokenData (tokenData) {
	if (!tokenData) return null;

	return {
		access_token_encrypted: tokenData.access_token ? encrypt(tokenData.access_token) : null,
		refresh_token_encrypted: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
		token_type: tokenData.token_type,
		expires_at: tokenData.expires_at,
		scope: tokenData.scope,
	};
}

/**
 * Decrypt token data from user document
 * @param {object} encryptedData - Object with encrypted tokens
 * @returns {object} Object with decrypted tokens
 */
function decryptTokenData (encryptedData) {
	if (!encryptedData) return null;

	return {
		access_token: encryptedData.access_token_encrypted ?
			decrypt(encryptedData.access_token_encrypted) : null,
		refresh_token: encryptedData.refresh_token_encrypted ?
			decrypt(encryptedData.refresh_token_encrypted) : null,
		token_type: encryptedData.token_type,
		expires_at: encryptedData.expires_at,
		scope: encryptedData.scope,
	};
}

module.exports = {
	encrypt,
	decrypt,
	generateKey,
	hashToken,
	encryptTokenData,
	decryptTokenData,
};
