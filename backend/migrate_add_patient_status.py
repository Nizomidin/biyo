#!/usr/bin/env python3
"""
Migration script to add status column to patients table.
Run this once to update existing database schema.
"""
from __future__ import annotations

import os
import sys
from sqlalchemy import create_engine, text
from database import _build_database_url

def migrate():
    """Add status column to patients table if it doesn't exist."""
    database_url = _build_database_url()
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, connect_args=connect_args)
    
    with engine.connect() as conn:
        # Check if column already exists
        if database_url.startswith("sqlite"):
            result = conn.execute(text("PRAGMA table_info(patients)"))
            columns = [row[1] for row in result.fetchall()]
            
            if "status" not in columns:
                print("Adding 'status' column to patients table...")
                # SQLite allows adding a column with DEFAULT value
                conn.execute(text("ALTER TABLE patients ADD COLUMN status VARCHAR(50) DEFAULT 'active'"))
                conn.commit()
                print("✓ Successfully added 'status' column to patients table")
                print("  (Set default value 'active' for all existing patients)")
            else:
                print("✓ 'status' column already exists in patients table")
        else:
            # For PostgreSQL or other databases, use different syntax
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='patients' AND column_name='status'
            """))
            if result.fetchone() is None:
                print("Adding 'status' column to patients table...")
                conn.execute(text("ALTER TABLE patients ADD COLUMN status VARCHAR(50) DEFAULT 'active' NOT NULL"))
                conn.commit()
                print("✓ Successfully added 'status' column to patients table")
            else:
                print("✓ 'status' column already exists in patients table")
    
    print("Migration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Error during migration: {e}", file=sys.stderr)
        sys.exit(1)

