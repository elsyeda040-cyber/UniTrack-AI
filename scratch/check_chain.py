
import sqlite3

db_path = r"d:\Unit Tiack AI\backend\unitrack.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Checking Professor prof_1 ---")
cursor.execute("SELECT id, name, role FROM users WHERE id = 'prof_1'")
print(cursor.fetchone())

print("\n--- Checking Teams for Professor prof_1 ---")
cursor.execute("SELECT id, name, professor_id FROM teams WHERE professor_id = 'prof_1'")
teams = cursor.fetchall()
for t in teams:
    print(t)

print("\n--- Checking Students for Team team_001 ---")
cursor.execute("""
    SELECT u.id, u.name 
    FROM users u 
    JOIN team_students ts ON u.id = ts.student_id 
    WHERE ts.team_id = 'team_001'
""")
students = cursor.fetchall()
print(f"Count: {len(students)}")
for s in students[:5]:
    print(s)

conn.close()
