
import sqlite3

db_path = r"d:\Unit Tiack AI\backend\unitrack.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Checking for Ghost Professors in Teams ---")
cursor.execute("""
    SELECT DISTINCT professor_id FROM teams 
    WHERE professor_id IS NOT NULL 
    AND professor_id NOT IN (SELECT id FROM users)
""")
ghosts = cursor.fetchall()
print(f"Ghost Professors: {len(ghosts)}")
for g in ghosts:
    print(g)

print("\n--- Checking for Real Professors in Users ---")
cursor.execute("SELECT id, name FROM users WHERE role = 'professor'")
real_profs = cursor.fetchall()
print(f"Real Professors in Users: {len(real_profs)}")

conn.close()
