---
description: Specifications for handling extension marketplace workflows, validation, versioning and permissions
trigger: model_decision
---

# Extension Management Flow

The extension system implements a comprehensive marketplace workflow with security-first validation, granular permissions, and version control.

## Extension Lifecycle States

```
Draft → Saved → Queue → Review → Published
                  ↓
              Rejected (with feedback)
```

## Core Components

### Extension Marketplace System

**Importance Score: 85/100**  
Path: `Web/controllers/extensions.js`

- Multi-tier marketplace with free and premium extensions
- Semantic versioning enforcement
- Extension package validation and security scanning
- Author verification and reputation tracking
- Rating and feedback system
- Installation tracking and usage analytics

### Extension Sandbox Environment

**Importance Score: 90/100**  
Path: `Internals/Extensions/API/IsolatedSandbox.js`

- Secure extension execution with `isolated-vm`
- Memory limit: **128MB** per extension
- Execution timeout: **5 seconds** default
- Custom module resolution with allowlist
- Granular permission system for extension capabilities

### Extension Deployment Pipeline

**Importance Score: 80/100**  
Path: `Internals/Extensions/ExtensionManager.js`

- Automated validation of extension dependencies
- Cross-instance compatibility verification
- Extension state management and lifecycle hooks
- Hot-reload capability with rollback support

## Key Workflows

### 1. Publication Flow
```
Package Validation → Security Scan → Version Verify → Author Auth → Distribution
```

### 2. Installation Flow
```
Compatibility Check → Permission Validation → Resource Allocation → Sandbox Prep → State Init
```

### 3. Management Flow
```
Update Detection → Version Migration → Config Sync → Usage Monitor → Resource Cleanup
```

## Permission Management

**Importance Score: 90/100**  
Path: `Internals/Extensions/API/IsolatedSandbox.js`

### Multi-Tier Permission System
| Level | Capabilities |
|-------|-------------|
| Extension Owners | Full control over own extensions |
| Maintainers | Review and approve submissions |
| Administrators | Global marketplace management |

### 22 Extension Scopes (Categorized)

**Moderation:** `ban`, `kick`, `timeout`, `modlog`  
**Roles:** `roles_read`, `roles_manage`  
**Channels:** `channels_read`, `channels_manage`, `threads`  
**Guild:** `guild_read`, `guild_manage`  
**Members:** `members_read`, `members_manage`  
**Messages:** `messages_read`, `messages_global`, `messages_write`, `messages_manage`, `reactions`  
**Economy:** `economy_read`, `economy_manage`  
**Data:** `config`, `storage`  
**Network:** `http_request`, `webhooks`, `embed_links`

## Import/Export System

### Export (GET `/extensions/:extid/export`)
- Exports extension as JSON `.skypkg` package
- Includes: metadata, version config, code, source info
- Owners can export any state; others only published extensions

### Import (POST `/extensions/import`)
- Validates package structure and extension data
- Creates new extension owned by current user in "saved" state
- Saves extension code file with generated `code_id`

### Package Format (.skypkg)
```json
{
  "package_version": "1.0",
  "exported_at": "ISO date",
  "extension": { "name", "description", "version": {...}, "code" },
  "source": { "original_id", "original_owner" }
}
```

## Version Control

**Importance Score: 80/100**

- Semantic versioning enforcement
- Breaking change detection between versions
- Automated compatibility matrix generation
- Version-specific feature flagging
- Rollback capabilities for problematic versions
- Code verification with MD5 hash validation

## Business Rules

1. Extensions must pass security validation before review
2. Version updates require compatibility verification
3. Author reputation affects review priority
4. Server-specific extension policies override global defaults
5. Resource limits scale with server subscription tier

## Key Files

- `Web/controllers/extensions.js` - Marketplace controller (26KB)
- `Internals/Extensions/ExtensionManager.js` - Core manager
- `Internals/Extensions/API/IsolatedSandbox.js` - Sandbox (8KB)
- `Internals/Extensions/API/Structures/` - API structures
- `Internals/Extensions/API/Utils/` - Utility functions
- `extensions/` - Extension files (.skyext format)
