from app.database import SessionLocal
from app import models

def reset_for_launch():
    db = SessionLocal()
    try:
        print("Cleaning up database for launch...")
        
        # Delete all tasks
        deleted_tasks = db.query(models.Task).delete()
        print(f"Deleted {deleted_tasks} tasks.")
        
        # Delete all reviews
        deleted_reviews = db.query(models.Review).delete()
        print(f"Deleted {deleted_reviews} reviews.")
        
        # Delete all messages (chat history)
        deleted_msgs = db.query(models.Message).delete()
        print(f"Deleted {deleted_msgs} messages.")
        
        # Delete all notifications
        deleted_notifs = db.query(models.Notification).delete()
        print(f"Deleted {deleted_notifs} notifications.")

        # Reset user scores (credits)
        updated_users = db.query(models.User).update({models.User.credits: 0})
        print(f"Reset credits for {updated_users} users.")

        db.commit()
        print("Platform reset successfully! Ready for launch.")
    except Exception as e:
        db.rollback()
        print(f"Error resetting platform: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_for_launch()
