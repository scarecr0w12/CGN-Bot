#!/usr/bin/env node
/**
 * Cloudflare + SSL Auto-Configuration Script
 * 
 * This script automates:
 * 1. Cloudflare DNS record creation/update
 * 2. Let's Encrypt SSL certificate generation
 * 3. Bot configuration updates
 * 
 * Required environment variables:
 * - CLOUDFLARE_API_TOKEN: Cloudflare API token with DNS edit permissions
 * - CLOUDFLARE_ZONE_ID: Zone ID for your domain
 * - DOMAIN: Your domain (e.g., bot.example.com)
 * - EMAIL: Email for Let's Encrypt notifications
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const CERT_PATH = "/etc/letsencrypt/live";
const BOT_ROOT = path.resolve(__dirname, "..");

class CloudflareSSLSetup {
	constructor() {
		this.config = {
			cloudflareToken: process.env.CLOUDFLARE_API_TOKEN || "",
			cloudflareZoneId: process.env.CLOUDFLARE_ZONE_ID || "",
			domain: process.env.DOMAIN || "",
			email: process.env.EMAIL || "",
			serverIP: this.getPublicIP(),
		};
	}

	getPublicIP() {
		try {
			return execSync("curl -s ifconfig.me || curl -s icanhazip.com", { encoding: "utf8" }).trim();
		} catch {
			return null;
		}
	}

	async prompt(question) {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		return new Promise(resolve => {
			rl.question(question, answer => {
				rl.close();
				resolve(answer.trim());
			});
		});
	}

	async gatherConfig() {
		console.log("\n🔧 Cloudflare + SSL Auto-Configuration\n");
		console.log("═".repeat(50));

		if (!this.config.domain) {
			this.config.domain = await this.prompt("Enter your domain (e.g., bot.example.com): ");
		}
		if (!this.config.email) {
			this.config.email = await this.prompt("Enter your email (for Let's Encrypt): ");
		}
		if (!this.config.cloudflareToken) {
			this.config.cloudflareToken = await this.prompt("Enter Cloudflare API Token: ");
		}
		if (!this.config.cloudflareZoneId) {
			this.config.cloudflareZoneId = await this.prompt("Enter Cloudflare Zone ID: ");
		}

		if (!this.config.serverIP) {
			this.config.serverIP = await this.prompt("Enter server public IP: ");
		} else {
			console.log(`\n📍 Detected server IP: ${this.config.serverIP}`);
			const confirm = await this.prompt("Use this IP? (Y/n): ");
			if (confirm.toLowerCase() === "n") {
				this.config.serverIP = await this.prompt("Enter server public IP: ");
			}
		}

		console.log("\n📋 Configuration Summary:");
		console.log(`   Domain: ${this.config.domain}`);
		console.log(`   Email: ${this.config.email}`);
		console.log(`   Server IP: ${this.config.serverIP}`);
		console.log(`   Cloudflare Zone: ${this.config.cloudflareZoneId.substring(0, 8)}...`);
	}

	async setupCloudflare() {
		console.log("\n☁️  Configuring Cloudflare DNS...");

		const baseUrl = `https://api.cloudflare.com/client/v4/zones/${this.config.cloudflareZoneId}/dns_records`;
		const headers = {
			"Authorization": `Bearer ${this.config.cloudflareToken}`,
			"Content-Type": "application/json",
		};

		// Extract subdomain and root domain
		const domainParts = this.config.domain.split(".");
		const name = this.config.domain;

		// Check if record exists
		const listResponse = await fetch(`${baseUrl}?name=${name}&type=A`, { headers });
		const listData = await listResponse.json();

		if (!listData.success) {
			throw new Error(`Cloudflare API error: ${JSON.stringify(listData.errors)}`);
		}

		const recordData = {
			type: "A",
			name: name,
			content: this.config.serverIP,
			ttl: 1, // Auto
			proxied: true, // Enable Cloudflare proxy (orange cloud)
		};

		let response;
		if (listData.result.length > 0) {
			// Update existing record
			const recordId = listData.result[0].id;
			console.log(`   Updating existing DNS record (${recordId.substring(0, 8)}...)...`);
			response = await fetch(`${baseUrl}/${recordId}`, {
				method: "PUT",
				headers,
				body: JSON.stringify(recordData),
			});
		} else {
			// Create new record
			console.log("   Creating new DNS record...");
			response = await fetch(baseUrl, {
				method: "POST",
				headers,
				body: JSON.stringify(recordData),
			});
		}

		const result = await response.json();
		if (!result.success) {
			throw new Error(`Failed to configure DNS: ${JSON.stringify(result.errors)}`);
		}

		console.log(`   ✅ DNS record configured: ${name} -> ${this.config.serverIP} (proxied)`);
		return result;
	}

	async setupSSL() {
		console.log("\n🔐 Setting up SSL certificate...");

		// Check if certbot is installed
		try {
			execSync("which certbot", { encoding: "utf8" });
		} catch {
			console.log("   Installing certbot...");
			try {
				execSync("apt-get update && apt-get install -y certbot", { stdio: "inherit" });
			} catch (err) {
				console.log("   ⚠️  Could not install certbot automatically.");
				console.log("   Please install certbot manually: apt-get install certbot");
				return false;
			}
		}

		const certDir = path.join(CERT_PATH, this.config.domain);
		
		// Check if certificate already exists
		if (fs.existsSync(path.join(certDir, "fullchain.pem"))) {
			console.log("   Existing certificate found, attempting renewal...");
			try {
				execSync("certbot renew --quiet", { stdio: "inherit" });
				console.log("   ✅ Certificate renewed successfully");
				return true;
			} catch {
				console.log("   Certificate renewal not needed or failed, continuing...");
			}
		}

		// For Cloudflare-proxied domains, use DNS challenge
		console.log("   Generating certificate using standalone method...");
		console.log("   ⚠️  Note: Port 80 must be available for verification");
		
		// Stop any service using port 80 temporarily
		try {
			execSync("systemctl stop nginx 2>/dev/null || true", { stdio: "pipe" });
		} catch {}

		try {
			const certbotCmd = [
				"certbot", "certonly",
				"--standalone",
				"--non-interactive",
				"--agree-tos",
				"--email", this.config.email,
				"-d", this.config.domain,
			].join(" ");

			execSync(certbotCmd, { stdio: "inherit" });
			console.log("   ✅ SSL certificate generated successfully");
			return true;
		} catch (err) {
			console.log("\n   ⚠️  Standalone verification failed.");
			console.log("   This usually happens when Cloudflare proxy is enabled.");
			console.log("\n   Alternative: Use Cloudflare Origin Certificate:");
			console.log("   1. Go to Cloudflare Dashboard -> SSL/TLS -> Origin Server");
			console.log("   2. Create Certificate");
			console.log("   3. Save the certificate and key to:");
			console.log(`      - ${BOT_ROOT}/certs/${this.config.domain}.pem`);
			console.log(`      - ${BOT_ROOT}/certs/${this.config.domain}.key`);
			return false;
		} finally {
			// Restart nginx if it was running
			try {
				execSync("systemctl start nginx 2>/dev/null || true", { stdio: "pipe" });
			} catch {}
		}
	}

	async updateBotConfig() {
		console.log("\n⚙️  Updating bot configuration...");

		const certDir = path.join(CERT_PATH, this.config.domain);
		const customCertDir = path.join(BOT_ROOT, "certs");
		
		let certPath, keyPath;

		// Check for Let's Encrypt certs first
		if (fs.existsSync(path.join(certDir, "fullchain.pem"))) {
			certPath = path.join(certDir, "fullchain.pem");
			keyPath = path.join(certDir, "privkey.pem");
		} 
		// Check for custom certs
		else if (fs.existsSync(path.join(customCertDir, `${this.config.domain}.pem`))) {
			certPath = path.join(customCertDir, `${this.config.domain}.pem`);
			keyPath = path.join(customCertDir, `${this.config.domain}.key`);
		}
		// Create placeholder for Cloudflare Origin certs
		else {
			if (!fs.existsSync(customCertDir)) {
				fs.mkdirSync(customCertDir, { recursive: true });
			}
			certPath = path.join(customCertDir, `${this.config.domain}.pem`);
			keyPath = path.join(customCertDir, `${this.config.domain}.key`);
			console.log(`   ⚠️  No certificates found. Please add them to:`);
			console.log(`      - ${certPath}`);
			console.log(`      - ${keyPath}`);
		}

		// Update .env file
		const envPath = path.join(BOT_ROOT, ".env");
		let envContent = "";
		
		if (fs.existsSync(envPath)) {
			envContent = fs.readFileSync(envPath, "utf8");
		}

		const envUpdates = {
			HOSTING_URL: `https://${this.config.domain}/`,
			SSL_CERT_PATH: certPath,
			SSL_KEY_PATH: keyPath,
			HTTPS_REDIRECT: "true",
		};

		for (const [key, value] of Object.entries(envUpdates)) {
			const regex = new RegExp(`^${key}=.*$`, "m");
			if (regex.test(envContent)) {
				envContent = envContent.replace(regex, `${key}=${value}`);
			} else {
				envContent += `\n${key}=${value}`;
			}
		}

		fs.writeFileSync(envPath, envContent.trim() + "\n");
		console.log("   ✅ Updated .env with SSL configuration");

		// Create/update config.js if needed
		const configPath = path.join(BOT_ROOT, "Configurations", "config.js");
		if (fs.existsSync(configPath)) {
			let configContent = fs.readFileSync(configPath, "utf8");
			
			// Update hostingURL
			configContent = configContent.replace(
				/hostingURL:\s*["'].*["']/,
				`hostingURL: "https://${this.config.domain}/"`
			);
			
			// Update cert paths
			if (certPath && fs.existsSync(certPath)) {
				configContent = configContent.replace(
					/cert:\s*["'].*["']/,
					`cert: "${certPath}"`
				);
				configContent = configContent.replace(
					/privateKey:\s*["'].*["']/,
					`privateKey: "${keyPath}"`
				);
				configContent = configContent.replace(
					/httpsRedirect:\s*(true|false)/,
					`httpsRedirect: true`
				);
			}

			fs.writeFileSync(configPath, configContent);
			console.log("   ✅ Updated Configurations/config.js");
		}

		return { certPath, keyPath };
	}

	generateNginxConfig() {
		console.log("\n📝 Generating nginx configuration...");

		const nginxConfig = `# Nginx reverse proxy configuration for ${this.config.domain}
# Generated by setup-cloudflare-ssl.js

upstream gawesomebot {
    server 127.0.0.1:8081;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${this.config.domain};
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${this.config.domain};

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/${this.config.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${this.config.domain}/privkey.pem;
    
    # Modern SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Cloudflare real IP restoration
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    real_ip_header CF-Connecting-IP;

    # Proxy settings
    location / {
        proxy_pass http://gawesomebot;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # WebSocket support for dashboard
    location /socket.io/ {
        proxy_pass http://gawesomebot;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

		const nginxPath = path.join(BOT_ROOT, "nginx", `${this.config.domain}.conf`);
		const nginxDir = path.dirname(nginxPath);
		
		if (!fs.existsSync(nginxDir)) {
			fs.mkdirSync(nginxDir, { recursive: true });
		}

		fs.writeFileSync(nginxPath, nginxConfig);
		console.log(`   ✅ Nginx config saved to: ${nginxPath}`);
		console.log(`\n   To enable, run:`);
		console.log(`   sudo ln -sf ${nginxPath} /etc/nginx/sites-enabled/`);
		console.log(`   sudo nginx -t && sudo systemctl reload nginx`);

		return nginxPath;
	}

	async run() {
		try {
			await this.gatherConfig();
			
			const proceed = await this.prompt("\nProceed with setup? (Y/n): ");
			if (proceed.toLowerCase() === "n") {
				console.log("Setup cancelled.");
				process.exit(0);
			}

			await this.setupCloudflare();
			await this.setupSSL();
			await this.updateBotConfig();
			this.generateNginxConfig();

			console.log("\n" + "═".repeat(50));
			console.log("✅ Setup complete!\n");
			console.log("Next steps:");
			console.log("1. If using nginx, enable the generated config");
			console.log("2. Restart the bot: docker compose restart");
			console.log("3. Verify HTTPS is working: https://" + this.config.domain);
			console.log("\nCloudflare SSL mode recommendation: Full (strict)");
			console.log("Set this in Cloudflare Dashboard -> SSL/TLS -> Overview");

		} catch (err) {
			console.error("\n❌ Setup failed:", err.message);
			process.exit(1);
		}
	}
}

// Run if called directly
if (require.main === module) {
	const setup = new CloudflareSSLSetup();
	setup.run();
}

module.exports = CloudflareSSLSetup;
