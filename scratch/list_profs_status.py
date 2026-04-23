import sqlite3
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

conn = sqlite3.connect('backend/unitrack.db')
cursor = conn.cursor()

cursor.execute("SELECT id, name, email FROM users WHERE role='professor'")
profs = cursor.fetchall()

print(f"{'Name':<30} | {'Email':<30} | {'Teams':<5} | {'Students'}")
print("-" * 80)

for p_id, name, email in profs:
    cursor.execute("SELECT id FROM teams WHERE professor_id = ?", (p_id,))
    teams = cursor.fetchall()
    total_students = 0
    for t in teams:
        cursor.execute("SELECT COUNT(*) FROM team_students WHERE team_id = ?", (t[0],))
        total_students += cursor.fetchone()[0]
    
    print(f"{name:<30} | {email:<30} | {len(teams):<5} | {total_students}")

conn.close()
