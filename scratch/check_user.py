import sqlite3
import os

db_path = 'backend/unitrack.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

email = 'ahmd_abw@unitrack.ed'
cursor.execute("SELECT id, name, email, role FROM users WHERE email = ?", (email,))
user = cursor.fetchone()

if user:
    print(f"User found: {user}")
else:
    print(f"User NOT found: {email}")

# Also list some professors to see what we have
print("\nList of all professors:")
cursor.execute("SELECT name, email FROM users WHERE role = 'professor' LIMIT 5")
profs = cursor.fetchall()
for p in profs:
    print(p)

conn.close()
