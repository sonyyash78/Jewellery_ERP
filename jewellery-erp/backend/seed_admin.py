import sys
import os

# Add backend dir to sys.path to allow importing app modules
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.db.base_class import Base
from app.api.dependencies import engine, SessionLocal
# Load every mapped model before querying.  User relationships reference
# Invoice and other models that are registered by this package import.
from app.models import *  # noqa: F401,F403
from app.models.user import User
from app.models.role import Role
from app.core.security import get_password_hash

def seed_admin():
    db = SessionLocal()
    
    # Check if admin role exists
    admin_role = db.query(Role).filter(Role.name == "Admin").first()
    if not admin_role:
        admin_role = Role(name="Admin")
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)

    # Check if admin user exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            is_active=True
        )
        admin_user.roles.append(admin_role)
        db.add(admin_user)
        db.commit()
        print("Admin user created successfully!")
    else:
        print("Admin user already exists.")
        
    db.close()

if __name__ == "__main__":
    seed_admin()
