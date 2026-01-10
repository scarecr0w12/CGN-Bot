/**
 * Cloudflare R2 Storage Integration
 * S3-compatible object storage for static assets and extension files
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const logger = global.logger || console;

class CloudflareR2 {
	constructor (config = {}) {
		this.accountId = config.accountId || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
		this.accessKeyId = config.accessKeyId || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
		this.secretAccessKey = config.secretAccessKey || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
		this.bucketName = config.bucketName || process.env.CLOUDFLARE_R2_BUCKET_NAME || "skynet-assets";
		this.publicBucketName = config.publicBucketName || process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_NAME;

		this.enabled = !!(this.accountId && this.accessKeyId && this.secretAccessKey);

		if (!this.enabled) {
			logger.warn("CloudflareR2: Missing credentials - service disabled");
			return;
		}

		// Initialize S3 client with R2 endpoint
		this.client = new S3Client({
			region: "auto",
			endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: this.accessKeyId,
				secretAccessKey: this.secretAccessKey,
			},
		});

		logger.info("CloudflareR2: Initialized", {
			accountId: this.accountId,
			bucket: this.bucketName,
		});
	}

	/**
	 * Check if R2 integration is enabled
	 */
	isEnabled () {
		return this.enabled;
	}

	/**
	 * Upload a file to R2
	 * @param {string} key - Object key (file path in bucket)
	 * @param {Buffer|string|ReadableStream} body - File content
	 * @param {Object} options - Additional options
	 * @returns {Promise<Object>} Upload result
	 */
	async upload (key, body, options = {}) {
		if (!this.enabled) {
			throw new Error("CloudflareR2 is not configured");
		}

		const command = new PutObjectCommand({
			Bucket: options.bucket || this.bucketName,
			Key: key,
			Body: body,
			ContentType: options.contentType || this.getContentType(key),
			Metadata: options.metadata || {},
			CacheControl: options.cacheControl || "public, max-age=31536000",
		});

		try {
			const result = await this.client.send(command);
			logger.info(`CloudflareR2: Uploaded ${key} to ${options.bucket || this.bucketName}`);
			return result;
		} catch (err) {
			logger.error(`CloudflareR2: Failed to upload ${key}`, {}, err);
			throw err;
		}
	}

	/**
	 * Download a file from R2
	 * @param {string} key - Object key
	 * @param {Object} options - Additional options
	 * @returns {Promise<Buffer>} File content
	 */
	async download (key, options = {}) {
		if (!this.enabled) {
			throw new Error("CloudflareR2 is not configured");
		}

		const command = new GetObjectCommand({
			Bucket: options.bucket || this.bucketName,
			Key: key,
		});

		try {
			const result = await this.client.send(command);
			// Convert stream to buffer
			const chunks = [];
			for await (const chunk of result.Body) {
				chunks.push(chunk);
			}
			return Buffer.concat(chunks);
		} catch (err) {
			if (err.name === "NoSuchKey") {
				return null;
			}
			logger.error(`CloudflareR2: Failed to download ${key}`, {}, err);
			throw err;
		}
	}

	/**
	 * Delete a file from R2
	 * @param {string} key - Object key
	 * @param {Object} options - Additional options
	 */
	async delete (key, options = {}) {
		if (!this.enabled) {
			throw new Error("CloudflareR2 is not configured");
		}

		const command = new DeleteObjectCommand({
			Bucket: options.bucket || this.bucketName,
			Key: key,
		});

		try {
			await this.client.send(command);
			logger.info(`CloudflareR2: Deleted ${key}`);
		} catch (err) {
			logger.error(`CloudflareR2: Failed to delete ${key}`, {}, err);
			throw err;
		}
	}

	/**
	 * Check if a file exists in R2
	 * @param {string} key - Object key
	 * @param {Object} options - Additional options
	 * @returns {Promise<boolean>} True if exists
	 */
	async exists (key, options = {}) {
		if (!this.enabled) {
			throw new Error("CloudflareR2 is not configured");
		}

		const command = new HeadObjectCommand({
			Bucket: options.bucket || this.bucketName,
			Key: key,
		});

		try {
			await this.client.send(command);
			return true;
		} catch (err) {
			if (err.name === "NotFound") {
				return false;
			}
			throw err;
		}
	}

	/**
	 * List objects in R2 bucket
	 * @param {Object} options - List options
	 * @returns {Promise<Array>} List of objects
	 */
	async list (options = {}) {
		if (!this.enabled) {
			throw new Error("CloudflareR2 is not configured");
		}

		const command = new ListObjectsV2Command({
			Bucket: options.bucket || this.bucketName,
			Prefix: options.prefix || "",
			MaxKeys: options.maxKeys || 1000,
			ContinuationToken: options.continuationToken,
		});

		try {
			const result = await this.client.send(command);
			return {
				objects: result.Contents || [],
				isTruncated: result.IsTruncated,
				nextToken: result.NextContinuationToken,
			};
		} catch (err) {
			logger.error("CloudflareR2: Failed to list objects", {}, err);
			throw err;
		}
	}

	/**
	 * Generate a presigned URL for temporary access
	 * @param {string} key - Object key
	 * @param {Object} options - Options
	 * @returns {Promise<string>} Presigned URL
	 */
	async getSignedUrl (key, options = {}) {
		if (!this.enabled) {
			throw new Error("CloudflareR2 is not configured");
		}

		const command = new GetObjectCommand({
			Bucket: options.bucket || this.bucketName,
			Key: key,
		});

		try {
			const url = await getSignedUrl(this.client, command, {
				expiresIn: options.expiresIn || 3600, // 1 hour default
			});
			return url;
		} catch (err) {
			logger.error(`CloudflareR2: Failed to generate signed URL for ${key}`, {}, err);
			throw err;
		}
	}

	/**
	 * Get public URL for an object (if bucket has public access)
	 * @param {string} key - Object key
	 * @param {Object} options - Options
	 * @returns {string} Public URL
	 */
	getPublicUrl (key, options = {}) {
		const bucket = options.bucket || this.publicBucketName || this.bucketName;
		const customDomain = options.customDomain || process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

		if (customDomain) {
			return `https://${customDomain}/${key}`;
		}

		// R2 public bucket URL format
		return `https://${bucket}.${this.accountId}.r2.cloudflarestorage.com/${key}`;
	}

	/**
	 * Generate a unique key for file storage
	 * @param {string} originalName - Original filename
	 * @param {string} prefix - Optional prefix
	 * @returns {string} Unique key
	 */
	generateKey (originalName, prefix = "") {
		const hash = crypto.randomBytes(16).toString("hex");
		const ext = originalName.split(".").pop();
		const timestamp = Date.now();
		return `${prefix}${prefix ? "/" : ""}${timestamp}-${hash}.${ext}`;
	}

	/**
	 * Get content type from filename
	 * @param {string} filename - Filename or key
	 * @returns {string} Content type
	 */
	getContentType (filename) {
		const ext = filename.split(".").pop().toLowerCase();
		const types = {
			// Images
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			png: "image/png",
			gif: "image/gif",
			webp: "image/webp",
			svg: "image/svg+xml",
			// Documents
			pdf: "application/pdf",
			txt: "text/plain",
			md: "text/markdown",
			json: "application/json",
			xml: "application/xml",
			// Archives
			zip: "application/zip",
			tar: "application/x-tar",
			gz: "application/gzip",
			// Code
			js: "application/javascript",
			css: "text/css",
			html: "text/html",
			// Extensions
			skypkg: "application/json",
		};
		return types[ext] || "application/octet-stream";
	}

	/**
	 * Upload extension package to R2
	 * @param {string} extensionId - Extension ID
	 * @param {Buffer} packageData - Extension package data
	 * @returns {Promise<string>} R2 key
	 */
	async uploadExtensionPackage (extensionId, packageData) {
		const key = `extensions/${extensionId}.skypkg`;
		await this.upload(key, packageData, {
			contentType: "application/json",
			metadata: {
				type: "extension-package",
				extensionId,
			},
		});
		return key;
	}

	/**
	 * Upload static asset to R2
	 * @param {string} filename - Original filename
	 * @param {Buffer} data - File data
	 * @param {Object} options - Upload options
	 * @returns {Promise<Object>} Upload result with key and URL
	 */
	async uploadAsset (filename, data, options = {}) {
		const key = this.generateKey(filename, options.prefix || "assets");
		await this.upload(key, data, {
			contentType: options.contentType,
			cacheControl: options.cacheControl || "public, max-age=31536000, immutable",
			bucket: options.bucket || this.publicBucketName || this.bucketName,
		});

		return {
			key,
			url: this.getPublicUrl(key, { bucket: options.bucket }),
		};
	}
}

// Singleton instance
let instance = null;

module.exports = {
	CloudflareR2,

	/**
	 * Get or create singleton instance
	 * @param {Object} config - Optional configuration
	 */
	getInstance (config) {
		if (!instance) {
			instance = new CloudflareR2(config);
		}
		return instance;
	},

	/**
	 * Initialize new instance (replaces singleton)
	 * @param {Object} config - Configuration
	 */
	initialize (config) {
		instance = new CloudflareR2(config);
		return instance;
	},
};
