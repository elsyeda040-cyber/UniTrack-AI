import sqlite3
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

conn = sqlite3.connect('backend/unitrack.db')
cursor = conn.cursor()

prof_email = 'asma_abdalbast@unitrack.eduu'
cursor.execute("SELECT id FROM users WHERE email = ?", (prof_email,))
p_id = cursor.fetchone()[0]

cursor.execute("SELECT id, name FROM teams WHERE professor_id = ?", (p_id,))
teams = cursor.fetchall()

for t_id, name in teams:
    cursor.execute("SELECT student_id FROM team_students WHERE team_id = ?", (t_id,))
    stds = cursor.fetchall()
    print(f"Team {name} (ID {t_id}) has {len(stds)} student links.")
    if stds:
        # Check if the students actually exist in users table
        sample_std_id = stds[0][0]
        cursor.execute("SELECT id, name FROM users WHERE id = ?", (sample_std_id,))
        user = cursor.fetchone()
        print(f"  Sample student: {user}")

conn.close()
