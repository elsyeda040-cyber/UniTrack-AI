import sqlite3
import os
import sys

# Set stdout to UTF-8
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

db_path = 'backend/unitrack.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

prof_name = 'أسماء عبد الباسط'
cursor.execute("SELECT id, name, email FROM users WHERE name LIKE ?", (f"%{prof_name}%",))
prof = cursor.fetchone()

if not prof:
    print(f"Professor '{prof_name}' not found.")
    exit(1)

print(f"Professor: {prof[1]} ({prof[2]}) ID: {prof[0]}")

cursor.execute("SELECT id, name, project_title FROM teams WHERE professor_id = ?", (prof[0],))
teams = cursor.fetchall()

if not teams:
    print("No teams found for this professor.")
else:
    for t in teams:
        cursor.execute("SELECT COUNT(*) FROM team_students WHERE team_id = ?", (t[0],))
        count = cursor.fetchone()[0]
        print(f"Team: {t[1]} | Title: {t[2]} | ID: {t[0]} | Student Count: {count}")
        
        if count == 0:
            # Check if there are ANY students in team_students
            cursor.execute("SELECT COUNT(*) FROM team_students")
            total_links = cursor.fetchone()[0]
            print(f"DEBUG: Total student-team links in DB: {total_links}")

conn.close()
