import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'unitrack.db')

conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    cur.execute("""
        INSERT OR REPLACE INTO users (id, name, email, role, hashed_password) 
        VALUES (?, ?, ?, ?, ?)
    """, ('admin-dhic', 'System Admin', 'admin@dhic.edu.eg', 'admin', 'admin88'))
    conn.commit()
    print("Admin user 'admin@dhic.edu.eg' added/updated successfully.")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
