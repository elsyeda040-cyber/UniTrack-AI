
import sqlite3
import sys

# Set encoding for output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

db_path = r"d:\Unit Tiack AI\backend\unitrack.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Users Summary ---")
cursor.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
roles = cursor.fetchall()
for role, count in roles:
    print(f"{role}: {count}")

print("\n--- Teams Summary ---")
cursor.execute("SELECT COUNT(*) FROM teams")
teams_count = cursor.fetchone()[0]
print(f"Total Teams: {teams_count}")

print("\n--- Team-Students Assignments ---")
cursor.execute("SELECT COUNT(*) FROM team_students")
assignments_count = cursor.fetchone()[0]
print(f"Total Assignments: {assignments_count}")

print("\n--- Students with NO Team ---")
cursor.execute("""
    SELECT COUNT(*) FROM users 
    WHERE role = 'student' 
    AND id NOT IN (SELECT student_id FROM team_students)
""")
no_team_count = cursor.fetchone()[0]
print(f"Count of students without team: {no_team_count}")

if no_team_count > 0:
    print("\nSample students without team:")
    cursor.execute("""
        SELECT name, email FROM users 
        WHERE role = 'student' 
        AND id NOT IN (SELECT student_id FROM team_students)
        LIMIT 10
    """)
    no_team = cursor.fetchall()
    for name, email in no_team:
        print(f"No Team: {name} ({email})")

conn.close()
