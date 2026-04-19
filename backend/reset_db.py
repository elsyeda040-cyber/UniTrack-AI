import os
from app.database import engine, Base
from app import models

print("Starting Zero Slate Database Reset...")

try:
    # Drop all existing tables
    print("1. Dropping existing tables and wiping old mock data...")
    Base.metadata.drop_all(bind=engine)
    
    # Recreate empty tables
    print("2. Recreating clean database structure...")
    Base.metadata.create_all(bind=engine)
    
    print("\n✅ SUCCESS! The database is now 100% EMPTY (Zero Slate).")
    print("👉 Next Step: Restart your uvicorn server so it creates the Admin user automatically.")
except Exception as e:
    print(f"❌ Error: {e}")
