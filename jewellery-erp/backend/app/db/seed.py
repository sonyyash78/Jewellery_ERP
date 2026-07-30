import sys
import os

# Add the project root to the sys path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.user import User, Role
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        # Create Admin Role
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        if not admin_role:
            admin_role = Role(name="Admin", description="Super Administrator")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            print("Created Admin Role")
            
        # Create Admin User
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            hashed_password = get_password_hash("admin123")
            admin_user = User(
                username="admin",
                email="admin@jewelleryerp.com",
                full_name="Super Admin",
                hashed_password=hashed_password,
                role_id=admin_role.id,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Created Default Admin User (admin / admin123)")
        else:
            print("Admin user already exists")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
