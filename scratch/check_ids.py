
import sqlite3
import sys

# Set encoding for output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

db_path = r"d:\Unit Tiack AI\backend\unitrack.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- User IDs Sample ---")
cursor.execute("SELECT id, name, email FROM users WHERE role = 'student' LIMIT 5")
users = cursor.fetchall()
for id, name, email in users:
    print(f"ID: {id} | Name: {name} | Email: {email}")

print("\n--- Team IDs Sample ---")
cursor.execute("SELECT id, name FROM teams LIMIT 5")
teams = cursor.fetchall()
for id, name in teams:
    print(f"ID: {id} | Name: {name}")

print("\n--- team_students Table Sample ---")
cursor.execute("SELECT * FROM team_students LIMIT 5")
links = cursor.fetchall()
for team_id, student_id in links:
    print(f"TeamID: {team_id} | StudentID: {student_id}")

conn.close()
