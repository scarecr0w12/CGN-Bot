---
description: Technical specification for cross-shard communication and coordination in a distributed Discord bot system
trigger: model_decision
---

# Shard Communication Protocol

The shard communication protocol implements a custom IPC system for coordinating Discord bot shards with message routing, state synchronization, and lifecycle management.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Master Process (Sharder.js)                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Shard 0   │    │   Shard 1   │    │   Shard N   │ │
│  │  (Worker)   │◄──►│  (Worker)   │◄──►│  (Worker)   │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│         │                 │                  │          │
│         └─────────────────┼──────────────────┘          │
│                           │                             │
│                    ┌──────▼──────┐                      │
│                    │  IPC Router │                      │
│                    └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

## Message Routing System

**Importance Score: 85/100**

### Protocol Message Types
```
SHARD_READY      → Shard initialization complete
SHARD_DISCONNECT → Graceful shard shutdown
GUILD_SYNC       → Guild state synchronization
STATE_UPDATE     → Partial state updates
BROADCAST        → Cross-shard broadcast
```

### Message Categories
| Type | Purpose |
|------|---------|
| `GUILD_INFO` | Propagates guild configuration changes |
| `MEMBER_UPDATE` | Syncs member data across shards |
| `COMMAND_SYNC` | Coordinates command registration |
| `STATS_UPDATE` | Aggregates metrics and activity data |
| `USER_UPDATE` | Propagates user data changes |
| `PRESENCE_UPDATE` | Manages cross-shard presence state |
| `COMMAND_EXEC` | Routes slash commands to target shards |
| `CACHE_INVALIDATE` | Coordinates cache updates |

### Routing Features
- Custom routing tables for cross-shard message delivery
- Guild-specific message targeting with shard mapping
- Automatic rerouting for guild migration between shards
- Priority-based message delivery with failure recovery

## State Synchronization

**Importance Score: 90/100**

### Master-Worker Architecture
- Bidirectional state sync between master and worker shards
- Incremental state updates to minimize IPC overhead
- Sharded data storage with eventual consistency

### Shared State Primitives
- Premium feature activation
- Global user cooldowns
- Cross-server moderation actions
- Economy transactions
- Transaction logging with rollback capability

### Sync Targets
- Guild configurations
- Member data
- Permission updates
- Cross-guild user data

## Shard Lifecycle Management

**Importance Score: 80/100**

### Automated Management
- Automated shard scaling based on guild count
- Graceful shard respawning with state preservation
- Dead shard detection and recovery
- Staggered startup to prevent API rate limits

### Health Monitoring
- Heartbeat system for shard health monitoring
- Automatic shard reconnection with state recovery
- Load balancing through dynamic shard assignment
- Guild migration coordination between shards

## Cross-Shard Features

**Importance Score: 85/100**

| Feature | Description |
|---------|-------------|
| Global user presence | Track users across all shards |
| Distributed rate limiting | Shared command cooldowns |
| Cross-shard ban sync | Coordinated moderation |
| Global economy | Transaction coordination |
| Multi-shard stats | Aggregated metrics |

## Worker Process Communication

Path: `Internals/Worker.js`, `Internals/WorkerManager.js`

- Extension execution result propagation
- Math operation distribution and result collection
- Emoji processing load balancing
- Custom IPC messaging format for worker tasks

## Key Files

| File | Purpose |
|------|---------|
| `Internals/Sharder.js` | Core sharding implementation |
| `Internals/ShardUtil.js` | Shard utilities |
| `Internals/IPC.js` | Inter-process communication |
| `Internals/Worker.js` | Worker process handling |
| `Internals/WorkerManager.js` | Worker lifecycle management |

## Implementation Notes

The protocol implements Discord-specific business logic for maintaining consistent state across a distributed bot instance, with emphasis on:

1. **Guild data synchronization** - Ensuring config consistency
2. **Command routing** - Directing interactions to correct shards
3. **State preservation** - Maintaining data across restarts
4. **Rate limit coordination** - Shared API rate limit tracking
