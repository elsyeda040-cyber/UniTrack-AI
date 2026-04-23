
import sqlite3

db_path = r"d:\Unit Tiack AI\backend\unitrack.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Checking for ID mismatches (Trailing Spaces) ---")
cursor.execute("SELECT id FROM users WHERE id LIKE '% ' OR id LIKE ' %'")
mismatched_users = cursor.fetchall()
print(f"Users with spaces in ID: {len(mismatched_users)}")

cursor.execute("SELECT student_id FROM team_students WHERE student_id LIKE '% ' OR student_id LIKE ' %'")
mismatched_links = cursor.fetchall()
print(f"Links with spaces in StudentID: {len(mismatched_links)}")

print("\n--- Checking for Students in users NOT in team_students ---")
cursor.execute("""
    SELECT COUNT(*) FROM users 
    WHERE role = 'student' 
    AND id NOT IN (SELECT student_id FROM team_students)
""")
missing_count = cursor.fetchone()[0]
print(f"Students missing from team_students: {missing_count}")

if missing_count > 0:
    cursor.execute("""
        SELECT id, name FROM users 
        WHERE role = 'student' 
        AND id NOT IN (SELECT student_id FROM team_students)
        LIMIT 5
    """)
    for id, name in cursor.fetchall():
        print(f"Missing: {id} ({name})")

conn.close()
