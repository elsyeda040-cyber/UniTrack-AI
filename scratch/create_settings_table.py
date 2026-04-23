import sqlite3
try:
    conn = sqlite3.connect('backend/unitrack.db')
    conn.execute('''CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )''')
    # Seed default settings
    defaults = {
        "notifications": "True",
        "allowGuestAccess": "False",
        "maintenanceMode": "False",
        "customTheme": "False",
        "darkModeForAll": "False",
        "compactLayout": "False",
        "aiAssistant": "True",
        "peerReview": "True",
        "leaderboard": "True",
        "chatFeature": "True",
        "fileUploads": "True",
        "autoBackup": "True",
        "twoFactorAuth": "False",
        "sessionTimeout": "True"
    }
    for k, v in defaults.items():
        conn.execute("INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)", (k, v))
    conn.commit()
    print("Settings table created and seeded successfully.")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
