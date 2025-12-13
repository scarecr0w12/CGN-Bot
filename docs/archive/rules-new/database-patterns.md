---
description: Custom ODM patterns, query execution, and MariaDB/MongoDB dual-database support
trigger: model_decision
---

# Database Patterns

The project uses a custom Object-Document Mapper (ODM) supporting both MongoDB and MariaDB/SQL backends.

## Architecture

```text
Driver.js → Model.js → Document.js → Query.js
                ↓
            Cursor.js
                ↓
            Schema.js (validation layer)
```

## Critical: Query Execution Pattern

**The most common bug pattern in this codebase involves improper query execution.**

### ✅ Correct Pattern

```javascript
// Always chain .limit() and .exec() for find queries
const users = await Users.find({ status: 'active' }).limit(10).exec();

// For single document queries
const user = await Users.findOne({ _id: id });

// With sorting
const topUsers = await Users.find({}).sort({ score: -1 }).limit(25).exec();
```

### ❌ Incorrect Pattern

```javascript
// WRONG: Passing limit as second argument (Mongoose style)
const users = await Users.find({ status: 'active' }, 10);  // Returns Cursor, not Array!

// WRONG: Missing .exec() - returns Cursor object
const users = await Users.find({ status: 'active' }).limit(10);  // Still a Cursor!

// This causes: "TypeError: users is not iterable"
```

## Model.js Methods

Path: `Database/Model.js`

| Method | Returns | Description |
|--------|---------|-------------|
| `find(query)` | Cursor | Query multiple documents |
| `findOne(query)` | Document/null | Query single document |
| `update(query, data)` | Result | Update documents |
| `insert(data)` | Document | Insert new document |
| `delete(query)` | Result | Delete documents |
| `create(data)` | Document | Alias for insert |
| `new(data)` | Document | Create unsaved document |

## Schema.js Validation

Path: `Database/Schema.js`

### Supported Types

- `String`, `Date`, `Array`, `Object`, `Number`, `Boolean`, `Schema.Mixed`

### Validators

- `required`, `default`, `min`, `max`, `enum`

### Key Difference from Mongoose

```javascript
// schema.build(data) does NOT validate required fields immediately
const doc = schema.build(data);  // No validation yet!

// Validation must be triggered manually
const error = schema.validate(doc);  // Returns ValidationError or null

// Or validation occurs during save/insert
await doc.save();  // Validates here
```

## Document.js Atomic Operations

Path: `Database/Document.js`

### MongoDB Atomic Operators → SQL Translation

| MongoDB | SQL Equivalent |
|---------|----------------|
| `$set` | `UPDATE ... SET field = value` |
| `$unset` | `UPDATE ... SET field = NULL` |
| `$inc` | `UPDATE ... SET field = field + value` |
| `$push` | INSERT into child table / JSON_ARRAY_APPEND |
| `$pull` | DELETE from child table / JSON_REMOVE |

## MariaDB Support

Path: `Database/DriverSQL.js`, `Database/ModelSQL.js`, `Database/CursorSQL.js`

### Environment Configuration

```bash
DATABASE_TYPE=mariadb  # or 'mongodb'
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=skynet
MARIADB_PASSWORD=<secret>
MARIADB_DATABASE=skynet
MARIADB_POOL_SIZE=10
```

### ObjectID Support

Path: `Database/ObjectID.js`

MariaDB uses `MariaDBObjectId` class for ID generation, maintaining API compatibility with MongoDB ObjectIds.

## Schema Files

Path: `Database/Schemas/` (23 schemas)

| Schema | Size | Purpose |
|--------|------|---------|
| `serverConfigSchema.js` | 10.8KB | Server configuration (largest) |
| `serverAISchema.js` | 4.7KB | AI settings per server |
| `siteSettingsSchema.js` | 4.7KB | Global site settings |
| `userSchema.js` | 3KB | User data |
| `serverModlogSchema.js` | 1.2KB | Moderation logs |

## Migration Files

Path: `Database/migrations/`

- `001_initial_schema.sql` - Initial table structure
- `002_add_server_subscription.sql` - Server subscription support
- `002_fix_feedback_votes_schema.sql` - Feedback votes fix

## Common Query Patterns

### Pagination

```javascript
const page = 1;
const perPage = 25;
const results = await Model.find(query)
    .skip((page - 1) * perPage)
    .limit(perPage)
    .exec();
```

### Sorting

```javascript
const sorted = await Model.find({})
    .sort({ createdAt: -1 })  // Descending
    .limit(10)
    .exec();
```

### Counting

```javascript
const count = await Model.find(query).count();
```

## Known Bug Fixes Reference

1. **Users.find() with limit**: Use `.limit().exec()` not passing number as 2nd arg
2. **Missing .exec()**: Always call `.exec()` on find queries to get arrays
3. **Blog collection name**: Use 'blog' not 'blogs'
4. **Sitemap query**: Don't query for non-existent 'published' field
