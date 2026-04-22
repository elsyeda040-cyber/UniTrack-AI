import sqlite3
import os

db_paths = [
    r"d:\Unit Tiack AI\backend\unitrack.db",
    r"d:\Unit Tiack AI\unitrack.db"
]

for db_path in db_paths:
    print(f"Processing {db_path}...")
    if not os.path.exists(db_path):
        print(f"File {db_path} does not exist.")
        continue
    
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Check if users table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        if not cur.fetchone():
            print("Table 'users' does not exist.")
            conn.close()
            continue
            
        # Delete users with specific roles
        cur.execute("DELETE FROM users WHERE role IN ('student', 'professor', 'assistant')")
        deleted_count = cur.rowcount
        conn.commit()
        print(f"Successfully deleted {deleted_count} users.")
        
        conn.close()
    except Exception as e:
        print(f"Error processing {db_path}: {e}")
    print("-" * 20)
