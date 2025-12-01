# Database Migration Guide

## Adding Patient Status Column

If you're updating an existing database that doesn't have the `status` column in the `patients` table, run this migration:

```bash
cd backend
python3 migrate_add_patient_status.py
```

This will:
1. Check if the `status` column exists
2. Add it with default value 'active' if it doesn't exist
3. Set all existing patients to 'active' status

## Note

For new databases, the column will be created automatically when the application starts (via `Base.metadata.create_all()`). This migration is only needed for existing databases.

