/**
 * Encrypt a token or sensitive string
 * @param {string} plaintext - The token to encrypt
 * @returns {string} Encrypted token as base64 string (iv:authTag:ciphertext)
 */
export function encrypt(plaintext: string): string;
/**
 * Decrypt an encrypted token
 * @param {string} encryptedToken - The encrypted token string
 * @returns {string|null} Decrypted plaintext or null if decryption fails
 */
export function decrypt(encryptedToken: string): string | null;
/**
 * Generate a new random encryption key
 * @returns {string} Hex-encoded 256-bit key
 */
export function generateKey(): string;
/**
 * Hash a token for comparison (one-way)
 * @param {string} token - Token to hash
 * @returns {string} SHA-256 hash of the token
 */
export function hashToken(token: string): string;
/**
 * Encrypt token data for storage in user document
 * @param {object} tokenData - Object with access_token, refresh_token, etc.
 * @returns {object} Object with encrypted tokens
 */
export function encryptTokenData(tokenData: object): object;
/**
 * Decrypt token data from user document
 * @param {object} encryptedData - Object with encrypted tokens
 * @returns {object} Object with decrypted tokens
 */
export function decryptTokenData(encryptedData: object): object;
//# sourceMappingURL=TokenEncryption.d.ts.map