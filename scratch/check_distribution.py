
import sqlite3
import sys

# Set encoding for output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

db_path = r"d:\Unit Tiack AI\backend\unitrack.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Students per Team ---")
cursor.execute("""
    SELECT team_id, COUNT(*) as count 
    FROM team_students 
    GROUP BY team_id 
    ORDER BY count DESC
    LIMIT 10
""")
dist = cursor.fetchall()
for team_id, count in dist:
    cursor.execute("SELECT name FROM teams WHERE id = ?", (team_id,))
    team_name = cursor.fetchone()[0]
    print(f"Team {team_id} ({team_name}): {count} students")

print("\n--- Teams with 0 students ---")
cursor.execute("""
    SELECT id, name FROM teams 
    WHERE id NOT IN (SELECT team_id FROM team_students)
""")
empty_teams = cursor.fetchall()
print(f"Count of empty teams: {len(empty_teams)}")
for id, name in empty_teams:
    print(f"Empty Team: {id} ({name})")

conn.close()
