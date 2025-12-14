# Extension System Expansion Plan

This document outlines the planned expansion of the extension system to support external API communication, dashboard injection, and enhanced approval workflows.

---

## Table of Contents

1. [Current State Summary](#current-state-summary)
2. [Phase 1: Enhanced External API Communication](#phase-1-enhanced-external-api-communication)
3. [Phase 2: Dashboard Injection System](#phase-2-dashboard-injection-system)
4. [Phase 3: Approval & Versioning Enhancements](#phase-3-approval--versioning-enhancements)
5. [Security Considerations](#security-considerations)
6. [Database Schema Changes](#database-schema-changes)
7. [UI/UX Requirements](#uiux-requirements)
8. [Implementation Priority](#implementation-priority)

---

## Current State Summary

### Existing Capabilities

| Feature | Current State |
|---------|---------------|
| **Sandbox** | `isolated-vm` with 128MB memory, 5s timeout |
| **HTTP Requests** | Limited to hardcoded allowlist via `http_request` scope |
| **Storage** | 25KB per extension per server |
| **Scopes** | 22 scopes covering moderation, roles, channels, economy, etc. |
| **Tier Gating** | HTTP requests require Tier 2 |

### Current HTTP Allowlist (Default)

```javascript
// From IsolatedSandbox.js - getAllowedExtensionHttpHosts()
[
  "api.jikan.moe",
  "api.mojang.com",
  "sessionserver.mojang.com",
  "api.steampowered.com",
  "steamcommunity.com",
  "mc-heads.net",
  "api.mcsrvstat.us",
  "api.henrikdev.xyz",
  "fortnite-api.com",
  "ddragon.leagueoflegends.com",
  "raw.communitydragon.org"
]
```

### Current Limitations

1. **Static Allowlist**: Developers cannot request new API endpoints
2. **No Custom Endpoints**: Extensions cannot call user-defined APIs
3. **No Dashboard Integration**: Extensions cannot add UI to server dashboard
4. **No Configuration UI**: Server admins cannot configure extension settings via dashboard
5. **No Webhook Support**: Extensions cannot create/manage webhooks for external services

---

## Phase 1: Enhanced External API Communication

### 1.1 Extension-Level Network Trust Model

Rather than approving individual API endpoints, the extension itself is approved for network access. Once approved, the extension can connect to any endpoint - including user-provided URLs (like self-hosted game servers).

#### Trust Model Overview

```text
Extension submitted with "network" capability
    ↓
Maintainer reviews extension code & purpose
    ↓
Extension approved/rejected as a whole
    ↓
Approved extensions can make ANY external request
    ↓
Server admins configure URLs/endpoints as extension settings
```

#### Example: Minecraft Server Manager Extension

```javascript
{
  "name": "MC Server Manager",
  "version": "1.0.0",
  "type": "command",
  "scopes": ["messages_write"],
  
  // NEW: Network capability (approved at extension level)
  "capabilities": {
    "network": {
      "enabled": true,
      "description": "Connects to user-configured Minecraft server APIs",
      "user_configurable": true  // Server admin provides endpoint URLs
    }
  },
  
  // Dashboard settings for server admins to configure
  "dashboard": {
    "settings": {
      "sections": [
        {
          "id": "server_config",
          "title": "Minecraft Server",
          "fields": [
            {
              "id": "server_url",
              "type": "text",
              "label": "Server API URL",
              "placeholder": "https://my-mc-server.com:25575/api",
              "required": true
            },
            {
              "id": "rcon_password",
              "type": "secret",
              "label": "RCON Password"
            }
          ]
        }
      ]
    }
  }
}
```

#### Capability Levels

| Capability | What It Allows | Approval |
|------------|----------------|----------|
| **None** | No external requests | Default |
| **allowlist_only** | Only pre-approved public APIs | Auto-approved |
| **network** | Any external HTTPS endpoint | Maintainer review |
| **network_advanced** | HTTP + custom ports + webhooks | Maintainer review |

### 1.2 Server Admin Configuration

Server admins configure endpoints and credentials via the dashboard settings panel (defined by extension manifest).

#### Configuration Storage

```javascript
// Per-server extension config (from dashboard settings)
extensionConfigDocument.settings = {
  "server_url": "https://my-mc-server.com:25575/api",
  "rcon_password": "encrypted_value"
};
```

#### How Extensions Access Config

```javascript
// Inside extension code
const extension = require('extension');
const http = require('http');

// Get server-admin-configured URL
const serverUrl = extension.settings.get('server_url');

// Make request to user-configured endpoint
const response = await http.request({
  url: `${serverUrl}/players`,
  method: 'GET',
  // Secrets are auto-injected by runtime, never visible in code
  injectSecrets: { 'Authorization': 'rcon_password' }
});
```

#### Security Requirements

- Secrets encrypted at rest using server-specific encryption
- Secrets never exposed to extension code directly
- Secrets injected into request headers by sandbox runtime
- Secret field IDs defined by extension manifest
- All requests logged for audit

### 1.3 Webhook Integration

Allow extensions to register webhook receivers for external service callbacks.

#### Webhook Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Inbound** | External service calls Skynet | Payment notifications, GitHub events |
| **Outbound** | Extension sends to external webhook | Logging, notifications |

#### Inbound Webhook Flow

```
External Service → Skynet API Endpoint
                        ↓
               Validate webhook signature
                        ↓
               Route to correct extension
                        ↓
               Execute extension handler
```

#### Webhook Endpoint Structure

```
POST /api/webhooks/extensions/:extension_id/:webhook_id
```

#### Extension Manifest Addition

```javascript
{
  "webhooks": {
    "inbound": [
      {
        "id": "payment_callback",
        "description": "Receive payment confirmations",
        "signature_header": "X-Signature-SHA256",
        "signature_type": "hmac-sha256"
      }
    ],
    "outbound": [
      {
        "id": "activity_log",
        "description": "Send activity to external service",
        "configurable": true  // Server admin provides URL
      }
    ]
  }
}
```

### 1.4 Rate Limiting & Quotas

Enhanced rate limiting per extension and per server.

| Tier | Requests/Minute | Max Body Size | Timeout |
|------|-----------------|---------------|---------|
| **Tier 1** | 10 | 50KB | 5s |
| **Tier 2** | 30 | 100KB | 10s |
| **Tier 3** | 100 | 500KB | 15s |

### 1.5 Security Safeguards (Runtime)

Even with extension-level trust, runtime safeguards remain:

| Safeguard | Description |
|-----------|-------------|
| **No Private IPs** | Block requests to 127.0.0.1, 10.x.x.x, 192.168.x.x, etc. |
| **HTTPS Preferred** | HTTP only allowed for `network_advanced` capability |
| **Response Limits** | Max response size enforced |
| **Timeout Enforcement** | Requests killed after timeout |
| **Request Logging** | All outbound requests logged for audit |
| **DNS Rebinding Protection** | Resolve DNS before request, verify not private |

---

## Phase 2: Dashboard Injection System

### 2.1 Overview

Allow extensions to inject custom pages, settings panels, or widgets into the server dashboard.

#### Injection Points

| Location | Description | Example Use |
|----------|-------------|-------------|
| **Extension Settings** | Config panel for the extension | API key input, feature toggles |
| **Sidebar Menu Item** | New page in dashboard | Leaderboard, analytics |
| **Widget** | Embedded widget on overview | Quick stats, status |
| **Command Config** | Per-command configuration | Custom parameters |

### 2.2 Settings Panel Injection

Extensions can define configuration schemas that generate UI automatically.

#### Schema-Based Configuration

```javascript
{
  "dashboard": {
    "settings": {
      "title": "Weather Extension Settings",
      "sections": [
        {
          "id": "api_config",
          "title": "API Configuration",
          "fields": [
            {
              "id": "api_key",
              "type": "secret",
              "label": "OpenWeatherMap API Key",
              "required": true,
              "help": "Get your free API key at openweathermap.org"
            },
            {
              "id": "default_units",
              "type": "select",
              "label": "Default Units",
              "options": [
                { "value": "metric", "label": "Celsius" },
                { "value": "imperial", "label": "Fahrenheit" }
              ],
              "default": "metric"
            },
            {
              "id": "cache_duration",
              "type": "number",
              "label": "Cache Duration (minutes)",
              "min": 5,
              "max": 60,
              "default": 15
            }
          ]
        },
        {
          "id": "channels",
          "title": "Channel Settings",
          "fields": [
            {
              "id": "allowed_channels",
              "type": "channel_select",
              "label": "Allowed Channels",
              "multiple": true,
              "help": "Leave empty for all channels"
            }
          ]
        }
      ]
    }
  }
}
```

#### Field Types

| Type | Description | Rendered As |
|------|-------------|-------------|
| `text` | Single line text | Input |
| `textarea` | Multi-line text | Textarea |
| `number` | Numeric value | Number input |
| `secret` | API keys, passwords | Password input (encrypted) |
| `toggle` | Boolean on/off | Toggle switch |
| `select` | Single selection | Dropdown |
| `multi_select` | Multiple selection | Multi-select |
| `channel_select` | Discord channel picker | Channel dropdown |
| `role_select` | Discord role picker | Role dropdown |
| `user_select` | Discord user picker | User autocomplete |
| `color` | Color picker | Color input |
| `json` | JSON editor | Code editor |

### 2.3 Custom Page Injection

Extensions can inject full custom pages into the dashboard.

#### Page Definition

```javascript
{
  "dashboard": {
    "pages": [
      {
        "id": "leaderboard",
        "title": "Extension Leaderboard",
        "icon": "fa-trophy",
        "menu_group": "extensions",  // Where in sidebar
        "template": "leaderboard.ejs",  // EJS template
        "data_endpoint": "/api/extension/:ext_id/leaderboard",
        "permissions": ["view_dashboard"]  // Required perms
      }
    ]
  }
}
```

#### Template Sandboxing

- Templates rendered server-side with limited context
- No access to raw database or client
- Data provided via defined endpoints only
- CSP restrictions on injected content

#### Available Template Context

```javascript
{
  server: { id, name, icon, memberCount },
  user: { id, username, avatar, isAdmin },
  extension: { id, name, version, config },
  data: { /* from data_endpoint */ }
}
```

### 2.4 Widget Injection

Small embedded components on the dashboard overview.

```javascript
{
  "dashboard": {
    "widgets": [
      {
        "id": "quick_stats",
        "title": "Weather Stats",
        "size": "small",  // small, medium, large
        "template": "widget.ejs",
        "refresh_interval": 300  // seconds
      }
    ]
  }
}
```

### 2.5 API Endpoints for Extensions

Extensions can define custom API endpoints accessible from their dashboard pages.

```javascript
{
  "dashboard": {
    "api_endpoints": [
      {
        "path": "/leaderboard",
        "method": "GET",
        "handler": "getLeaderboard",  // Function name in extension
        "cache": 60  // Cache for 60 seconds
      },
      {
        "path": "/settings",
        "method": "POST",
        "handler": "saveSettings",
        "permissions": ["admin"]
      }
    ]
  }
}
```

---

## Phase 3: Approval & Versioning Enhancements

### 3.1 Version-Based Capability Approval

Capabilities are approved per-version, not globally.

#### Version Approval Matrix

| Capability | v1.0.0 | v1.1.0 | v2.0.0 |
|------------|--------|--------|--------|
| `api.jikan.moe` | ✅ | ✅ | ✅ |
| `api.openweathermap.org` | ❌ | ✅ | ✅ |
| Dashboard Page | ❌ | ❌ | ✅ |

#### Version Upgrade Flow

```
Developer publishes v2.0.0 with new capabilities
    ↓
System compares to approved v1.1.0 capabilities
    ↓
New capabilities flagged for review
    ↓
Version enters review queue
    ↓
Maintainer approves new capabilities
    ↓
v2.0.0 becomes available
    ↓
Servers on auto-update get prompted to approve new capabilities
```

### 3.2 Capability Categories

| Category | Auto-Approve | Review Required |
|----------|--------------|-----------------|
| **Safe** | New scopes within existing categories | - |
| **Moderate** | Pre-approved API endpoints | - |
| **Sensitive** | - | New API endpoints, webhooks |
| **Critical** | - | Dashboard pages, custom templates |

### 3.3 Server-Level Capability Approval

When an extension requests new capabilities, server admins must approve.

#### Server Approval UI

```
┌─────────────────────────────────────────────────────────────┐
│  Extension Update Available: Weather Command v2.0.0         │
├─────────────────────────────────────────────────────────────┤
│  New capabilities requested:                                │
│                                                             │
│  ⚠️  External API: api.openweathermap.org                   │
│      Used for: Fetching weather forecasts                   │
│      [Approve] [Deny]                                       │
│                                                             │
│  ⚠️  Dashboard Page: Weather Dashboard                      │
│      Adds a new page to your server dashboard               │
│      [Approve] [Deny]                                       │
│                                                             │
│  ℹ️  Requires API Key Configuration                         │
│      You'll need to provide an OpenWeatherMap API key       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Update with Selected] [Skip This Version] [Disable Auto]  │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Rollback System

Quick rollback to previous versions if issues arise.

```javascript
// Extension config
{
  "current_version": "2.0.0",
  "installed_versions": ["1.0.0", "1.1.0", "2.0.0"],
  "rollback_available": true,
  "last_stable_version": "1.1.0"
}
```

---

## Security Considerations

### 4.1 API Security

| Threat | Mitigation |
|--------|------------|
| SSRF (Server-Side Request Forgery) | No private IPs, DNS rebinding protection, request logging |
| Secret Leakage | Secrets never in extension code, injected at runtime |
| Data Exfiltration | Response size limits, request logging for audit |
| Rate Limit Bypass | Per-extension + per-server limits |
| Malicious Extension | Maintainer code review before network capability approval |

### 4.2 Dashboard Security

| Threat | Mitigation |
|--------|------------|
| XSS | CSP headers, template sanitization |
| Code Injection | Template sandboxing, no eval |
| Privilege Escalation | Permission checks on all endpoints |
| Data Access | Limited context, no raw DB access |

### 4.3 Webhook Security

| Threat | Mitigation |
|--------|------------|
| Spoofed Webhooks | Signature verification required |
| Replay Attacks | Timestamp validation, nonce checking |
| DoS | Rate limiting per webhook endpoint |

### 4.4 Template Sandbox Rules

```javascript
// Allowed in templates
- Variable interpolation: <%= data.value %>
- Conditionals: <% if (condition) { %>
- Loops: <% data.forEach(item => { %>
- Built-in helpers: formatDate, formatNumber, truncate

// Blocked in templates
- require() calls
- eval() or Function()
- Direct database access
- File system access
- Network requests
- Process/global access
```

---

## Database Schema Changes

### 5.1 Extension Document Additions

```javascript
// gallerySchema.js additions
{
  // Existing fields...
  
  // NEW: External API declarations
  external_apis: [{
    host: String,
    paths: [String],
    methods: [String],
    reason: String,
    requires_api_key: Boolean,
    documentation_url: String,
    approved: Boolean,
    approved_by: String,
    approved_at: Date
  }],
  
  // NEW: Webhook definitions
  webhooks: {
    inbound: [{
      id: String,
      description: String,
      signature_header: String,
      signature_type: String,
      secret_key: String  // Generated on approval
    }],
    outbound: [{
      id: String,
      description: String,
      configurable: Boolean
    }]
  },
  
  // NEW: Dashboard injections
  dashboard: {
    settings: Schema.Mixed,  // Settings schema
    pages: [{
      id: String,
      title: String,
      icon: String,
      template: String,
      approved: Boolean
    }],
    widgets: [{
      id: String,
      title: String,
      size: String,
      template: String
    }],
    api_endpoints: [{
      path: String,
      method: String,
      handler: String
    }]
  },
  
  // NEW: Per-version capability tracking
  version_capabilities: [{
    version: Number,
    apis_approved: [String],
    dashboard_approved: Boolean,
    webhooks_approved: Boolean,
    approved_at: Date
  }]
}
```

### 5.2 Server Extension Config Additions

```javascript
// extensionConfigSchema.js additions
{
  // Existing fields...
  
  // NEW: API key storage (encrypted)
  api_keys: Schema.Mixed,
  
  // NEW: Webhook configurations
  webhook_config: {
    outbound_urls: Schema.Mixed  // { webhook_id: url }
  },
  
  // NEW: Dashboard settings (from schema)
  dashboard_settings: Schema.Mixed,
  
  // NEW: Capability approvals
  approved_capabilities: {
    apis: [String],
    dashboard_pages: [String],
    webhooks: [String]
  },
  
  // NEW: Version pinning
  pinned_version: Number,
  auto_update: { type: Boolean, default: true }
}
```

### 5.3 New Collections

```javascript
// extensionWebhookLogsSchema.js
{
  extension_id: ObjectId,
  server_id: String,
  webhook_id: String,
  direction: String,  // "inbound" | "outbound"
  timestamp: Date,
  status: Number,
  payload_hash: String,
  error: String
}

// extensionApiLogsSchema.js
{
  extension_id: ObjectId,
  server_id: String,
  endpoint: String,
  method: String,
  timestamp: Date,
  status: Number,
  response_time: Number,
  error: String
}
```

---

## UI/UX Requirements

### 6.1 Developer Experience

#### Extension Builder Additions

- [ ] API endpoint declaration UI
- [ ] Webhook configuration builder
- [ ] Dashboard settings schema builder
- [ ] Template editor with preview
- [ ] Capability diff viewer for version updates

#### Extension Submission Flow

- [ ] Capability review checklist
- [ ] API documentation link validator
- [ ] Template security scanner
- [ ] Preview mode for dashboard pages

### 6.2 Maintainer Experience

#### Review Queue Additions

- [ ] API endpoint review panel
- [ ] Security risk assessment display
- [ ] Bulk approve for allowlisted endpoints
- [ ] Template sandbox test runner

### 6.3 Server Admin Experience

#### Dashboard Additions

- [ ] Extension capability approval modal
- [ ] API key management panel
- [ ] Webhook URL configuration
- [ ] Extension-injected pages in sidebar
- [ ] Version management with rollback

---

## Implementation Priority

### Phase 1: External API (Priority: HIGH)

| Task | Effort | Dependencies |
|------|--------|--------------|
| API manifest schema | 2 days | None |
| Approval workflow backend | 3 days | Schema |
| Sandbox API validation | 2 days | Schema |
| API key encryption | 2 days | None |
| Rate limit enhancements | 1 day | None |
| Maintainer review UI | 3 days | Backend |
| Server admin approval UI | 2 days | Backend |

**Total: ~15 days**

### Phase 2: Dashboard Injection (Priority: MEDIUM)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Settings schema parser | 3 days | None |
| Settings UI generator | 4 days | Parser |
| Template sandbox | 5 days | None |
| Page injection routing | 3 days | Sandbox |
| Widget system | 3 days | Sandbox |
| Extension API endpoints | 3 days | None |
| Dashboard integration | 4 days | All above |

**Total: ~25 days**

### Phase 3: Webhooks (Priority: MEDIUM)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Webhook routing system | 3 days | None |
| Signature verification | 2 days | Routing |
| Inbound webhook handler | 3 days | Verification |
| Outbound webhook caller | 2 days | None |
| Webhook logs & monitoring | 2 days | Handlers |
| Admin configuration UI | 2 days | Backend |

**Total: ~14 days**

### Phase 4: Version Capabilities (Priority: HIGH)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Capability diff system | 2 days | None |
| Version approval workflow | 3 days | Diff |
| Server approval prompts | 2 days | Workflow |
| Rollback mechanism | 2 days | None |
| Auto-update with approval | 2 days | Prompts |

**Total: ~11 days**

---

## Open Questions

1. **API Key Storage**: Use separate secrets manager (Vault) or encrypted DB field?
2. **Template Language**: Stick with EJS or use a more restricted DSL?
3. **Webhook Limits**: How many webhooks per extension? Per server?
4. **Dashboard Page Limits**: Max pages per extension?
5. **Review SLA**: What's the target review time for new capabilities?
6. **Monetization**: Should API-heavy extensions require premium?

---

## Next Steps

1. Review and approve this document
2. Create detailed technical specs for Phase 1
3. Design database migration plan
4. Create UI mockups for key flows
5. Set up feature flags for gradual rollout

---

*Document created: December 2024*
*Status: PLANNING - Pending Approval*
