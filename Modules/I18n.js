/**
 * Internationalization (i18n) Module
 * Provides multilingual support for bot commands and web interface
 */

const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const path = require("path");

// Supported languages with metadata
const SUPPORTED_LANGUAGES = {
	en: { name: "English", nativeName: "English", flag: "🇺🇸" },
	es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
	fr: { name: "French", nativeName: "Français", flag: "🇫🇷" },
	de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
	pt: { name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
	ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
	ko: { name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
	zh: { name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
	ru: { name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
	it: { name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
	nl: { name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
	pl: { name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
	tr: { name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
	ar: { name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
	hi: { name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
};

// Default language
const DEFAULT_LANGUAGE = "en";

// Namespaces for organizing translations
const NAMESPACES = [
	"common",
	"commands",
	"errors",
	"web",
	"dashboard",
	"moderation",
	"extensions",
	"premium",
];

let initialized = false;

/**
 * Initialize the i18n system
 * @returns {Promise<void>}
 */
async function initialize () {
	if (initialized) return;

	const localesPath = path.join(__dirname, "..", "locales");

	await i18next
		.use(Backend)
		.init({
			backend: {
				loadPath: path.join(localesPath, "{{lng}}", "{{ns}}.json"),
				addPath: path.join(localesPath, "{{lng}}", "{{ns}}.missing.json"),
			},
			fallbackLng: DEFAULT_LANGUAGE,
			supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
			ns: NAMESPACES,
			defaultNS: "common",
			preload: Object.keys(SUPPORTED_LANGUAGES),
			interpolation: {
				escapeValue: false, // Not needed for Discord/server-side
			},
			saveMissing: process.env.NODE_ENV === "development",
			saveMissingTo: "current",
			missingKeyHandler: (lngs, ns, key, _fallbackValue) => {
				if (process.env.NODE_ENV === "development") {
					console.warn(`[i18n] Missing translation: ${lngs.join(", ")} - ${ns}:${key}`);
				}
			},
		});

	initialized = true;
	console.log(`[i18n] Initialized with ${Object.keys(SUPPORTED_LANGUAGES).length} languages`);
}

/**
 * Get a translator function for a specific language
 * @param {string} lng - Language code
 * @returns {Function} Translation function
 */
function getTranslator (lng = DEFAULT_LANGUAGE) {
	const language = SUPPORTED_LANGUAGES[lng] ? lng : DEFAULT_LANGUAGE;
	return i18next.getFixedT(language);
}

/**
 * Translate a key with optional interpolation
 * @param {string} key - Translation key (namespace:key format)
 * @param {string} lng - Language code
 * @param {Object} options - Interpolation options
 * @returns {string} Translated string
 */
function translate (key, lng = DEFAULT_LANGUAGE, options = {}) {
	const language = SUPPORTED_LANGUAGES[lng] ? lng : DEFAULT_LANGUAGE;
	return i18next.t(key, { lng: language, ...options });
}

/**
 * Get language from various sources (user preference, server config, etc.)
 * @param {Object} options - Options containing user, server, or request
 * @returns {string} Language code
 */
function getLanguage ({ userDocument, serverDocument, req } = {}) {
	// Priority: User preference > Server preference > Browser/Accept-Language > Default

	// 1. Check user preference
	if (userDocument?.preferences?.language) {
		const userLang = userDocument.preferences.language;
		if (SUPPORTED_LANGUAGES[userLang]) return userLang;
	}

	// 2. Check server preference
	if (serverDocument?.config?.language) {
		const serverLang = serverDocument.config.language;
		if (SUPPORTED_LANGUAGES[serverLang]) return serverLang;
	}

	// 3. Check request Accept-Language header (for web)
	if (req?.headers?.["accept-language"]) {
		const acceptLang = req.headers["accept-language"].split(",")[0].split("-")[0];
		if (SUPPORTED_LANGUAGES[acceptLang]) return acceptLang;
	}

	// 4. Check cookie (for web)
	if (req?.cookies?.lang) {
		const cookieLang = req.cookies.lang;
		if (SUPPORTED_LANGUAGES[cookieLang]) return cookieLang;
	}

	return DEFAULT_LANGUAGE;
}

/**
 * Create a context-aware translator for bot commands
 * @param {Object} context - Context with guild, user documents
 * @returns {Object} Translator object with t function and language info
 */
function createBotTranslator ({ serverDocument, userDocument } = {}) {
	const lng = getLanguage({ serverDocument, userDocument });
	const translator = getTranslator(lng);

	return {
		t: translator,
		lng,
		language: SUPPORTED_LANGUAGES[lng],
		cmd: (key, options) => translator(`commands:${key}`, options),
		err: (key, options) => translator(`errors:${key}`, options),
		common: (key, options) => translator(`common:${key}`, options),
		mod: (key, options) => translator(`moderation:${key}`, options),
	};
}

/**
 * Create a context-aware translator for web requests
 * @param {Object} req - Express request object
 * @returns {Object} Translator object
 */
function createWebTranslator (req) {
	const lng = getLanguage({ req, userDocument: req.userDocument });
	const translator = getTranslator(lng);

	return {
		t: translator,
		lng,
		language: SUPPORTED_LANGUAGES[lng],
		languages: SUPPORTED_LANGUAGES,
		web: (key, options) => translator(`web:${key}`, options),
		dash: (key, options) => translator(`dashboard:${key}`, options),
		common: (key, options) => translator(`common:${key}`, options),
	};
}

/**
 * Express middleware to add i18n to requests
 */
function middleware () {
	return (req, res, next) => {
		// Get language from various sources
		const lng = getLanguage({ req, userDocument: req.userDocument });

		// Attach translator to request and response locals
		req.i18n = createWebTranslator(req);
		req.lng = lng;
		req.language = SUPPORTED_LANGUAGES[lng];

		// Make available in templates
		res.locals.t = req.i18n.t;
		res.locals.lng = lng;
		res.locals.language = SUPPORTED_LANGUAGES[lng];
		res.locals.languages = SUPPORTED_LANGUAGES;
		res.locals.i18n = req.i18n;

		next();
	};
}

/**
 * Check if a language is supported
 * @param {string} lng - Language code
 * @returns {boolean}
 */
function isSupported (lng) {
	return Boolean(SUPPORTED_LANGUAGES[lng]);
}

/**
 * Get list of supported languages
 * @returns {Object} Supported languages object
 */
function getSupportedLanguages () {
	return { ...SUPPORTED_LANGUAGES };
}

/**
 * Get the i18next instance for advanced usage
 * @returns {Object} i18next instance
 */
function getInstance () {
	return i18next;
}

module.exports = {
	initialize,
	t: translate,
	getTranslator,
	getLanguage,
	createBotTranslator,
	createWebTranslator,
	middleware,
	isSupported,
	getSupportedLanguages,
	getInstance,
	SUPPORTED_LANGUAGES,
	DEFAULT_LANGUAGE,
	NAMESPACES,
};
