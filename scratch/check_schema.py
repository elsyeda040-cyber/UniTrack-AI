
import sqlite3

db_path = r"d:\Unit Tiack AI\backend\unitrack.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT sql FROM sqlite_master WHERE name = 'team_students'")
print(cursor.fetchone()[0])

conn.close()
