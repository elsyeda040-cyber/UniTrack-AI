from app.database import engine
from app import models
from sqlalchemy import text

def migrate():
    print("Starting Database Migration v3.0...")
    
    # 1. Create all new tables (including PresentationReview)
    models.Base.metadata.create_all(bind=engine)
    
    # 2. Re-check columns for users (just in case)
    with engine.connect() as conn:
        for col, col_type in [("credits", "INTEGER DEFAULT 100"), ("skills", "TEXT")]:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                print(f"Added '{col}' column to users table.")
            except Exception:
                pass # Already exists
        conn.commit()
    
    print("Migration Complete!")

if __name__ == "__main__":
    migrate()
