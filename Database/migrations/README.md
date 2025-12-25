# Database Migrations

This directory contains SQL migration files for the SkynetBot MariaDB database.

## Migration Naming Convention

Migrations follow the format: `XXX_description.sql`

- `XXX`: Three-digit migration version number (001, 002, 003, etc.)
- `description`: Snake_case description of the migration

**Example:** `001_initial_schema.sql`

## Running Migrations

Use the automated migration runner:

```bash
# Show migration status
node scripts/migrate.js status

# Run all pending migrations
node scripts/migrate.js up

# Run specific number of migrations
node scripts/migrate.js up 3

# Rollback last migration
node scripts/migrate.js down

# Rollback multiple migrations
node scripts/migrate.js down 2

# Validate migration numbering
node scripts/migrate.js validate
```

## Environment Variables

Set these before running migrations:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=skynet
```

## Migration Guidelines

### 1. Version Numbers

- Use the next sequential number
- Never reuse or skip numbers
- Check for duplicates with `node scripts/migrate.js validate`

### 2. SQL Best Practices

```sql
-- Always use IF NOT EXISTS for safety
CREATE TABLE IF NOT EXISTS table_name (...);

-- Use IF EXISTS for drops
ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;

-- Add comments explaining complex changes
-- Migration: Add user preferences
ALTER TABLE users ADD COLUMN preferences JSON DEFAULT NULL;
```

### 3. Transactions

The migration runner automatically wraps migrations in transactions:
- If migration succeeds, it's committed
- If migration fails, it's rolled back
- Migration record is only added on success

### 4. Rollback Strategy

**Important:** The `down` command only removes the migration record from the database. It does NOT automatically reverse schema changes.

For critical migrations, consider creating companion rollback scripts:
- `015_add_feature.sql` (forward migration)
- `015_add_feature_rollback.sql` (manual rollback, not auto-run)

### 5. Multi-Statement Support

The runner supports multiple SQL statements in a single file:

```sql
CREATE TABLE new_table (...);

ALTER TABLE existing_table ADD COLUMN new_column VARCHAR(255);

INSERT INTO config (key, value) VALUES ('setting', 'value');
```

## Migration History

The `migrations` table tracks applied migrations:

```sql
CREATE TABLE migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version INT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Query migration history:

```sql
-- See all applied migrations
SELECT * FROM migrations ORDER BY version;

-- Check if specific migration was applied
SELECT * FROM migrations WHERE version = 15;
```

## Troubleshooting

### Duplicate Migration Numbers

If you see duplicate migration warnings:

1. Run `node scripts/migrate.js validate`
2. Identify conflicting files
3. Renumber the newer migration to the next available number

### Failed Migration

If a migration fails:

1. Check the error message
2. Fix the SQL syntax/logic
3. Run `node scripts/migrate.js down` to remove the failed record (if partially applied)
4. Correct the migration file
5. Run `node scripts/migrate.js up` again

### Manual Migration

If you need to run migrations manually:

```bash
mysql -u root -p skynet < Database/migrations/001_initial_schema.sql
```

Then record it:

```sql
INSERT INTO migrations (version, name) VALUES (1, 'initial_schema');
```

## Current Migrations

- `001` - Initial schema
- `002` - Server subscription support
- `003` - Economy and vote rewards
- `005` - Vote rewards table
- `006` - Premium extensions
- `007` - Tickets system
- `008` - Server tickets
- `009` - User notes
- `010` - Role panels and temp roles
- `011` - Temp roles table
- `012` - Code snippets
- `013` - Gallery slugs
- `014` - User profile and game columns
- `015` - Config migration
- `016` - Creator status
- `017` - Missing columns fix
- `018` - Server analytics
- `019` - Invite tracking
- `020` - Traffic table updates
- `021` - Sentiment filter
- `022` - Language support
- `023` - Email settings
- `024` - Feedback/votes schema fix
- `025` - Votes table recreation

## Best Practices Summary

✅ **DO:**
- Test migrations on a development database first
- Use `IF NOT EXISTS` and `IF EXISTS` clauses
- Add descriptive comments
- Keep migrations focused (one feature per migration)
- Run `validate` before committing

❌ **DON'T:**
- Modify existing migration files after they're applied
- Skip version numbers
- Forget to test rollback procedures
- Mix schema and data migrations without clear separation
