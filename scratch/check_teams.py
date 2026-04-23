
import sqlite3
import sys

# Set encoding for output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

db_path = r"d:\Unit Tiack AI\backend\unitrack.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Teams with missing Professor ---")
cursor.execute("SELECT COUNT(*) FROM teams WHERE professor_id IS NULL OR professor_id = ''")
missing_prof = cursor.fetchone()[0]
print(f"Teams without professor: {missing_prof}")

print("\n--- Teams with missing Assistant ---")
cursor.execute("SELECT COUNT(*) FROM teams WHERE assistant_id IS NULL OR assistant_id = ''")
missing_asst = cursor.fetchone()[0]
print(f"Teams without assistant: {missing_asst}")

print("\n--- Average Students per Team ---")
cursor.execute("SELECT CAST(COUNT(*) AS FLOAT) / (SELECT COUNT(*) FROM teams) FROM team_students")
avg = cursor.fetchone()[0]
print(f"Average students per team: {avg:.2f}")

conn.close()
