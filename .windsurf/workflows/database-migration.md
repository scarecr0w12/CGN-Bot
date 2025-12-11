---
description: Create and run database migrations for MariaDB
---

# Database Migration

## Overview
The project supports both MongoDB and MariaDB. Migrations are SQL files in `Database/migrations/`.

## Steps

1. Check existing migrations:
// turbo
```bash
ls -la /root/bot/Database/migrations/
```

2. View the migration naming convention:
// turbo
```bash
head -20 /root/bot/Database/migrations/001_initial_schema.sql
```

3. Create a new migration file with incremented number:
```bash
# Format: XXX_description.sql
touch /root/bot/Database/migrations/002_add_new_table.sql
```

4. Write migration SQL (example structure):
```sql
-- Migration: 002_add_new_table
-- Description: Add table for new feature
-- Date: YYYY-MM-DD

CREATE TABLE IF NOT EXISTS new_feature (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    server_id VARCHAR(32) NOT NULL,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_server (server_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

5. Run migration manually via phpMyAdmin or MySQL client:
```bash
# Connect to MariaDB
mysql -u root -p skynetbot < /root/bot/Database/migrations/002_add_new_table.sql
```

6. Update the corresponding Schema file in `Database/Schemas/`:
// turbo
```bash
ls /root/bot/Database/Schemas/
```

7. Create or update the Model in `Database/`:
// turbo
```bash
ls /root/bot/Database/*.js | head -10
```

8. Verify migration applied:
```bash
mysql -u root -p -e "DESCRIBE skynetbot.new_feature;"
```

## Schema Best Practices

- Use `BIGINT UNSIGNED` for Discord IDs (they exceed INT range)
- Add indexes on frequently queried columns
- Use JSON columns for flexible document-like storage
- Include `created_at` and `updated_at` timestamps
- Use `utf8mb4` charset for emoji support
