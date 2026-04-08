from app.database import engine
from app import models

from sqlalchemy import text

def migrate():
    print("Starting Database Migration v2.0...")
    
    # 1. Create all new tables
    models.Base.metadata.create_all(bind=engine)
    
    # 2. Add columns to existing tables (SQLite limitation: create_all doesn't add columns)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0"))
            print("Added 'credits' column to users table.")
        except Exception as e:
            print(f"Column 'credits' might already exist: {e}")
            
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN skills TEXT"))
            print("Added 'skills' column to users table.")
        except Exception as e:
            print(f"Column 'skills' might already exist: {e}")
            
        conn.commit()
    
    print("Migration Complete!")

if __name__ == "__main__":
    migrate()
