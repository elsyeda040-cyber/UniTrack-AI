import sqlite3
import os
import sys

# Ensure UTF-8 output for console
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

db_path = os.path.join(os.getcwd(), 'unitrack.db')

def cleanup():
    if not os.path.exists(db_path):
        print(f"❌ Error: Database file not found at {db_path}")
        return

    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        print("🚀 جاري التنظيف السريع والقضاء على التقل...")

        # 1. مسح أي سجلات مكررة في الجداول اللي بترفع ملفات
        print("⏳ جاري مسح السجلات المكررة في resources...")
        cur.execute("DELETE FROM resources WHERE rowid NOT IN (SELECT MIN(rowid) FROM resources GROUP BY team_id, title, url)")
        deleted_resources = cur.rowcount
        print(f"✅ تم مسح {deleted_resources} سجل مكرر.")

        # 2. مسح الإشعارات القديمة أو المسودات
        print("⏳ جاري مسح المسودات القديمة في scratchpads...")
        cur.execute("DELETE FROM scratchpads WHERE last_updated < datetime('now', '-1 hour')")
        deleted_scratchpads = cur.rowcount
        print(f"✅ تم مسح {deleted_scratchpads} مسودة قديمة.")

        conn.commit()

        # 3. الأهم: إنهاء أي عملية معلقة وضغط الملف
        print("⏳ جاري ضغط الملف (VACUUM)... لحظات ويخلص.")
        conn.execute("VACUUM")
        
        print("✅ مبروك! الملف اتنظف في ثواني والتقل راح.")
        
        conn.close()
    except Exception as e:
        print(f"❌ حصل مشكلة: {str(e)}")

if __name__ == "__main__":
    cleanup()
