# Windsurf Rules - Updated & New

This directory contains cleaned-up and new Windsurf rules for the CGN-Bot project. These are ready to be copied to `.windsurf/rules/` when you want to apply them.

## Installation

Copy all `.md` files from this directory to `.windsurf/rules/`:

```bash
cp docs/rules-new/*.md .windsurf/rules/
```

## Files Overview

### Updated Rules (Cleaned from Duplicates)

| File | Description |
|------|-------------|
| `activity-scoring-algorithm.md` | Server activity scoring and ranking (consolidated from 4 sections) |
| `extension-management-flow.md` | Extension marketplace workflows (consolidated from 4 sections) |
| `moderation-system-model.md` | Progressive discipline system (consolidated from 4 sections) |
| `shard-communication-protocol.md` | Cross-shard IPC protocol (consolidated from 3 sections) |
| `extensions-creation.md` | **Expanded** - Full API reference for extension development |

### New Rules

| File | Description |
|------|-------------|
| `database-patterns.md` | **NEW** - Custom ODM, `.exec()`/`.limit()` patterns, MariaDB support |
| `ai-integration.md` | **NEW** - Multi-provider AI system, rate limiting, usage tracking |
| `tier-system.md` | **NEW** - Server-based premium subscriptions, feature gating |
| `command-framework.md` | **NEW** - Command structure, categories, rate limiting |
| `web-dashboard.md` | **NEW** - Controller patterns, middleware, EJS templates |

### Unchanged (Keep Existing)

These files in `.windsurf/rules/` should be kept as-is:

- `memory-knowledge-graph.md` - Memory MCP usage guidelines
- `qdrant-memory.md` - Qdrant semantic memory guidelines
- `self_improve.md` - Rule improvement triggers
- `windsurf_rules.md` - Rule formatting guidelines

## Key Improvements

### 1. Duplicate Removal
The original rules had 3-4 duplicate sections with conflicting information. These have been consolidated into single authoritative documents.

### 2. Database Patterns (Critical)
New rule documenting the most common bug pattern:

```javascript
// ✅ CORRECT
const users = await Users.find({ status: 'active' }).limit(10).exec();

// ❌ WRONG - Returns Cursor, not Array!
const users = await Users.find({ status: 'active' }, 10);
```

### 3. Tier System Documentation
Clarifies that **premium features are per-SERVER, not per-user**:

```javascript
// Premium is per-server - use guild ID
const hasAccess = await TierManager.canAccess(msg.guild.id, 'ai_chat');
```

### 4. Extension API Reference
Expanded from basic 40 lines to comprehensive 300+ line guide including:
- All 22 extension scopes with categories
- Complete module API reference
- Working code examples
- Economy read/write patterns

## Rule Triggers

All rules use `trigger: model_decision` meaning they activate when the AI determines they're relevant to the current task.

## Lint Warnings

The markdown files have some minor lint warnings (MD036, MD022, etc.) related to formatting. These are stylistic and don't affect functionality. The content prioritizes clarity for AI consumption over strict markdown lint compliance.
