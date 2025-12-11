/**
 * Script to analyze extension code and update scopes in the database
 * This ensures extensions have the correct scopes based on what they actually use
 */

const fs = require('fs');
const path = require('path');

// Map of require() modules to required scopes
const MODULE_SCOPE_MAP = {
	'economy': ['economy_read'],  // getSelf, getLeaderboard, etc.
	'points': ['economy_read'],   // alias for economy
	'storage': ['storage'],       // extension.storage usage implies storage scope
};

// Map of specific method calls to additional scopes
const METHOD_SCOPE_MAP = {
	// Economy write methods
	'economy.addPoints': 'economy_manage',
	'economy.removePoints': 'economy_manage', 
	'economy.transfer': 'economy_manage',
	'economy.setPoints': 'economy_manage',
	'points.addPoints': 'economy_manage',
	'points.removePoints': 'economy_manage',
	'points.transfer': 'economy_manage',
	'points.setPoints': 'economy_manage',
	
	// Message methods
	'message.reply': 'messages_write',
	'message.channel.send': 'messages_write',
	'channel.send': 'messages_write',
	
	// Member methods
	'guild.members': 'members_read',
	'members.get': 'members_read',
	'members.fetch': 'members_read',
	
	// Role methods
	'guild.roles': 'roles_read',
	'member.roles': 'roles_read',
	
	// Channel methods
	'guild.channels': 'channels_read',
	
	// Reaction methods
	'message.react': 'reactions',
	'.react(': 'reactions',
	'addReaction': 'reactions',
	
	// Storage
	'extension.storage': 'storage',
	'storage.get': 'storage',
	'storage.write': 'storage',
	'storage.set': 'storage',
	
	// HTTP
	'http.get': 'http_request',
	'http.post': 'http_request',
	'http.request': 'http_request',
	'fetch(': 'http_request',
};

async function analyzeExtension(codePath) {
	try {
		const code = fs.readFileSync(codePath, 'utf8');
		const scopes = new Set();
		
		// Check for require statements
		const requireRegex = /require\s*\(\s*['"](\w+)['"]\s*\)/g;
		let match;
		while ((match = requireRegex.exec(code)) !== null) {
			const module = match[1];
			if (MODULE_SCOPE_MAP[module]) {
				MODULE_SCOPE_MAP[module].forEach(s => scopes.add(s));
			}
		}
		
		// Check for method calls that require specific scopes
		for (const [pattern, scope] of Object.entries(METHOD_SCOPE_MAP)) {
			if (code.includes(pattern)) {
				scopes.add(scope);
			}
		}
		
		// Special case: if using message module with reply/send, need messages_write
		if (code.includes("require('message')") || code.includes('require("message")')) {
			if (code.includes('.reply(') || code.includes('.send(')) {
				scopes.add('messages_write');
			}
		}
		
		// Special case: embed_links if creating embeds
		if (code.includes('embeds:') || code.includes("require('embed')")) {
			scopes.add('embed_links');
		}
		
		return Array.from(scopes);
	} catch (err) {
		console.error(`Error reading ${codePath}:`, err.message);
		return null;
	}
}

async function main() {
	// Initialize database
	require("dotenv").config();
	
	const Database = require("../Database/Driver");
	await Database.initialize();
	
	// Gallery is added to global scope by the driver
	const extensionsDir = path.join(__dirname, "..", "extensions");
	
	// Get all gallery extensions
	const extensions = await Gallery.find({ state: "gallery" }).exec();
	console.log(`Found ${extensions.length} gallery extensions to analyze\n`);
	
	let updated = 0;
	let needsReview = [];
	
	for (const ext of extensions) {
		if (!ext.versions || ext.versions.length === 0) continue;
		
		const latestVersion = ext.versions[ext.versions.length - 1];
		const codeId = latestVersion.code_id;
		if (!codeId) continue;
		
		const codePath = path.join(extensionsDir, `${codeId}.skyext`);
		const detectedScopes = await analyzeExtension(codePath);
		
		if (detectedScopes === null) {
			console.log(`⚠️  ${ext.name}: Code file not found`);
			continue;
		}
		
		const currentScopes = latestVersion.scopes || [];
		const currentSet = new Set(currentScopes);
		const detectedSet = new Set(detectedScopes);
		
		// Find missing scopes
		const missing = detectedScopes.filter(s => !currentSet.has(s));
		// Find invalid/extra scopes
		const extra = currentScopes.filter(s => !detectedSet.has(s) && !isValidScope(s));
		
		if (missing.length > 0 || extra.length > 0) {
			console.log(`\n📦 ${ext.name} (${ext._id})`);
			console.log(`   Current: [${currentScopes.join(', ')}]`);
			console.log(`   Detected: [${detectedScopes.join(', ')}]`);
			
			if (missing.length > 0) {
				console.log(`   ❌ Missing: [${missing.join(', ')}]`);
			}
			if (extra.length > 0) {
				console.log(`   ⚠️  Invalid/Extra: [${extra.join(', ')}]`);
			}
			
			// Update if there are missing scopes
			if (missing.length > 0) {
				const newScopes = [...new Set([...currentScopes, ...missing])].filter(s => isValidScope(s));
				
				// Update in database
				const versionIndex = ext.versions.findIndex(v => v._id === latestVersion._id);
				if (versionIndex !== -1) {
					ext.versions[versionIndex].scopes = newScopes;
					ext.query.set('versions', ext.versions);
					await ext.save();
					console.log(`   ✅ Updated to: [${newScopes.join(', ')}]`);
					updated++;
				}
			}
			
			needsReview.push({
				name: ext.name,
				id: ext._id,
				current: currentScopes,
				detected: detectedScopes,
				missing,
				extra
			});
		} else {
			console.log(`✓ ${ext.name}: OK`);
		}
	}
	
	console.log(`\n${'='.repeat(50)}`);
	console.log(`Summary: ${updated} extensions updated`);
	console.log(`${needsReview.length} extensions had scope issues`);
	
	process.exit(0);
}

// Valid scopes from Constants.js
const VALID_SCOPES = [
	'ban', 'kick', 'roles_read', 'roles_manage', 'channels_read', 'channels_manage',
	'guild_read', 'guild_manage', 'members_read', 'members_manage', 'messages_read',
	'messages_global', 'messages_write', 'messages_manage', 'config', 'economy_manage',
	'economy_read', 'storage', 'http_request', 'embed_links', 'reactions', 'threads',
	'webhooks', 'timeout', 'modlog'
];

function isValidScope(scope) {
	return VALID_SCOPES.includes(scope);
}

main().catch(err => {
	console.error('Error:', err);
	process.exit(1);
});
