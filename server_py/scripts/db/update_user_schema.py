from server_py.core.database import DATABASE_URL
import sqlite3
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))


# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))


def add_column_if_not_exists(cursor, table, column, definition):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"Added column {column} to {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"Column {column} already exists in {table}")
        else:
            print(f"Error adding {column}: {e}")


def update_schema():
    if "sqlite" not in DATABASE_URL:
        print("This script is optimized for SQLite. For other DBs, use migration tools.")
        return

    db_path = DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    print(f"Updating schema for database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Add profile columns to users table
    columns = [
        ("full_name", "TEXT"),
        ("bio", "TEXT"),
        ("location", "TEXT"),
        ("occupation", "TEXT"),
        ("specialty", "TEXT"),
        ("phone", "TEXT"),
        ("website", "TEXT"),
        ("avatar_url", "TEXT"),
        ("preferences", "JSON DEFAULT '{}'")
    ]

    for col_name, col_type in columns:
        add_column_if_not_exists(cursor, "users", col_name, col_type)

    conn.commit()
    conn.close()
    print("Schema update complete.")


if __name__ == "__main__":
    update_schema()
