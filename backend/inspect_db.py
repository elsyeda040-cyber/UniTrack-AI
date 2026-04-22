import sqlite3
import os
import sys

# Ensure UTF-8 output for console
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

db_paths = [
    os.path.join(os.getcwd(), "unitrack.db"),
    os.path.join(os.path.dirname(os.getcwd()), "unitrack.db")
]

for db_path in db_paths:
    print(f"Checking {db_path}...")
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
            continue
            
        cur.execute("SELECT count(*) FROM users;")
        count = cur.fetchone()[0]
        print(f"Total users: {count}")
        
        cur.execute("SELECT id, name, email, role FROM users LIMIT 10;")
        users = cur.fetchall()
        for user in users:
            print(user)
            
        conn.close()
    except Exception as e:
        print(f"Error checking {db_path}: {e}")
    print("-" * 20)
