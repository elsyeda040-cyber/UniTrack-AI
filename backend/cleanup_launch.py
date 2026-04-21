from app.database import SessionLocal
from app import models
import logging

def cleanup_for_launch():
    db = SessionLocal()
    try:
        print("Starting cleanup for launch...")
        
        # Tables to wipe completely
        tables_to_wipe = [
            models.Message,
            models.Task,
            models.Event,
            models.Review,
            models.UserBadge,
            models.Notification,
            models.Scratchpad,
            models.Resource,
            models.Meeting,
            models.ProjectDoc,
            models.HelpRequest,
            models.WhiteboardData,
            models.PresentationReview
        ]
        
        for model in tables_to_wipe:
            count = db.query(model).count()
            if count > 0:
                print(f"Wiping {count} records from {model.__tablename__}...")
                db.query(model).delete(synchronize_session=False)
            else:
                print(f"Table {model.__tablename__} is already empty.")
        
        # Reset team progress to 0
        db.query(models.Team).update({models.Team.progress: 0})
        
        db.commit()
        print("Cleanup completed successfully. Users and Teams have been preserved.")
        
        # Verification counts
        user_count = db.query(models.User).count()
        team_count = db.query(models.Team).count()
        print(f"Final Count: {user_count} Users, {team_count} Teams preserved.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_for_launch()
