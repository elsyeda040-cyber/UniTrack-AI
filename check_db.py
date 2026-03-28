import sqlite3
import os

# Correct absolute path for Windows
db_path = r"D:\Unit Tiack AI\backend\unitrack.db"
if not os.path.exists(db_path):
    print(f"Error: DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("--- RECENT NOTIFICATIONS ---")
try:
    cur.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 10")
    cols = [description[0] for description in cur.description]
    print(cols)
    for row in cur.fetchall():
        print(row)
except Exception as e:
    print(f"Error reading notifications: {e}")

print("\n--- TEAMS ---")
try:
    cur.execute("SELECT id, name, professor_id, assistant_id FROM teams")
    for row in cur.fetchall():
        print(row)
except Exception as e:
    print(f"Error reading teams: {e}")

print("\n--- TEAM STUDENTS ---")
try:
    cur.execute("SELECT * FROM team_students")
    for row in cur.fetchall():
        print(row)
except Exception as e:
    print(f"Error reading team_students: {e}")

conn.close()
