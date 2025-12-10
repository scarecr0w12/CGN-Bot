# MongoDB to MariaDB 10.11 Migration

## Overview
This document outlines the migration from MongoDB to MariaDB 10.11 to address data integrity concerns with MongoDB's handling of replica sets and potential data loss when new systems join the cluster.

## Migration Goals
1. **Data Integrity**: ACID compliance with proper transaction support
2. **Referential Integrity**: Foreign key constraints to prevent orphaned data
3. **API Compatibility**: Maintain existing Model/Document/Query API to minimize application code changes
4. **Performance**: Proper indexing and query optimization

## Architecture Changes

### Current MongoDB Stack
```
Driver.js → Model.js → Document.js → Query.js
                ↓
            Cursor.js
                ↓
            Schema.js (validation layer)
```

### New MariaDB Stack
```
DriverSQL.js → ModelSQL.js → DocumentSQL.js → QuerySQL.js
                    ↓
               CursorSQL.js
                    ↓
               SchemaSQL.js (validation + DDL generation)
```

## Schema Mapping

### Collections → Tables

| MongoDB Collection | MariaDB Table | Notes |
|-------------------|---------------|-------|
| servers | servers | Main server table |
| servers.config | server_configs | 1:1 with servers |
| servers.members | server_members | Nested as JSON or separate table |
| servers.extensions | server_extensions | 1:N array |
| servers.games | server_games | 1:N array |
| servers.channels | server_channels | Nested as JSON or separate table |
| servers.voice_data | server_voice_data | 1:N array |
| servers.logs | server_logs | 1:N array |
| servers.modlog | server_modlogs | 1:N array |
| users | users | Main user table |
| users.subscription | user_subscriptions | Embedded or 1:1 |
| users.linked_accounts | user_linked_accounts | 1:N array |
| users.payment_ids | users (columns) | Flatten into users |
| gallery | gallery | Extension gallery |
| blog | blog | Blog posts |
| wiki | wiki | Wiki articles |
| traffic | traffic | Traffic stats |
| votes | votes | Voting records |
| global_* | global_* | Various global settings |
| site_settings | site_settings | Single config document → key-value or JSON |
| feedback | feedback | User feedback |

### Type Mapping

| MongoDB Type | MariaDB Type |
|--------------|--------------|
| String | VARCHAR(255) / TEXT / LONGTEXT |
| Number | INT / BIGINT / DECIMAL |
| Boolean | TINYINT(1) |
| Date | DATETIME(3) |
| ObjectId | VARCHAR(24) / CHAR(24) |
| Object (embedded) | JSON / Separate table |
| Array (embedded) | JSON / Separate table |
| Schema.Mixed | JSON |

### Nested Document Strategy

For MongoDB's nested documents/arrays, we have two options:

1. **JSON Columns** (MariaDB 10.2+): Store nested structures as JSON
   - Pros: Minimal schema changes, flexible
   - Cons: Limited indexing, no referential integrity

2. **Normalized Tables**: Break out into separate tables with foreign keys
   - Pros: Full SQL capabilities, proper indexing, referential integrity
   - Cons: More complex queries, migration effort

**Recommendation**: Hybrid approach
- High-cardinality arrays (logs, members) → Separate tables
- Low-cardinality embedded docs (config, payment_ids) → JSON columns
- Frequently queried arrays (extensions, reminders) → Separate tables with indexes

## Query Translation

### MongoDB → SQL Mapping

| MongoDB | SQL |
|---------|-----|
| `find({ _id: "123" })` | `SELECT * FROM table WHERE id = '123'` |
| `find({ field: value })` | `SELECT * FROM table WHERE field = value` |
| `findOne()` | `SELECT * FROM table ... LIMIT 1` |
| `count()` | `SELECT COUNT(*) FROM table` |
| `insertOne()` | `INSERT INTO table ...` |
| `insertMany()` | `INSERT INTO table ... VALUES (), (), ...` |
| `updateOne()` | `UPDATE table ... LIMIT 1` |
| `updateMany()` | `UPDATE table ...` |
| `deleteMany()` | `DELETE FROM table ...` |
| `aggregate()` | Complex JOINs / CTEs |

### Atomic Operations Translation

| MongoDB Atomic | SQL Equivalent |
|----------------|----------------|
| `$set` | `UPDATE ... SET field = value` |
| `$unset` | `UPDATE ... SET field = NULL` |
| `$inc` | `UPDATE ... SET field = field + value` |
| `$push` | INSERT into child table / JSON_ARRAY_APPEND |
| `$pull` | DELETE from child table / JSON_REMOVE |
| `$pullAll` | DELETE with IN clause |

## Implementation Plan

### Phase 1: Infrastructure (Week 1)
- [ ] Install mariadb package
- [ ] Create DriverSQL.js with connection pooling
- [ ] Create migration schema generator from existing Schema.js
- [ ] Generate initial SQL DDL scripts

### Phase 2: Core Classes (Week 2)
- [ ] Implement ModelSQL.js with CRUD operations
- [ ] Implement DocumentSQL.js with atomic operations
- [ ] Implement CursorSQL.js for query results
- [ ] Implement QuerySQL.js for document manipulation

### Phase 3: Data Migration (Week 3)
- [ ] Create data export scripts from MongoDB
- [ ] Create data import scripts to MariaDB
- [ ] Validate data integrity post-migration
- [ ] Create rollback procedures

### Phase 4: Testing & Cutover (Week 4)
- [ ] Dual-write mode for testing
- [ ] Performance benchmarking
- [ ] Application testing
- [ ] Production cutover

## Configuration

### New Environment Variables
```bash
# MariaDB Configuration
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=skynet
MARIADB_PASSWORD=<secret>
MARIADB_DATABASE=skynet
MARIADB_POOL_SIZE=10
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Query performance regression | Create proper indexes, analyze slow query log |
| Data type mismatches | Comprehensive type validation in SchemaSQL |
| Application code breaks | Maintain API compatibility, extensive testing |
| Migration data loss | Full backup before migration, validation scripts |

## Rollback Plan
1. Keep MongoDB running in parallel during initial phase
2. Maintain bidirectional sync capability
3. Feature flag for database backend selection
4. Full MongoDB backup before cutover

## Files to Create/Modify

### New Files
- `Database/DriverSQL.js` - MariaDB connection
- `Database/ModelSQL.js` - Table operations
- `Database/DocumentSQL.js` - Row operations  
- `Database/CursorSQL.js` - Result set handling
- `Database/QuerySQL.js` - Query building
- `Database/SchemaSQL.js` - DDL generation
- `Database/migrations/` - SQL migration files
- `scripts/migrate-to-mariadb.js` - Data migration script

### Modified Files
- `Database/Driver.js` - Add backend selection
- `Configurations/config.template.js` - Add MariaDB config
- `.env.example` - Add MariaDB variables
- `package.json` - Add mariadb dependency
