import sqlite3
try:
    conn = sqlite3.connect('backend/unitrack.db')
    conn.execute('ALTER TABLE users ADD COLUMN status TEXT DEFAULT "active"')
    conn.commit()
    print("Column 'status' added successfully.")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
