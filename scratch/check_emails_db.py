import sqlite3
conn = sqlite3.connect('backend/unitrack.db')
cursor = conn.cursor()
cursor.execute("SELECT email FROM users WHERE role='student' LIMIT 5")
print("Students:", cursor.fetchall())
cursor.execute("SELECT email FROM users WHERE role='professor' LIMIT 5")
print("Professors:", cursor.fetchall())
conn.close()
