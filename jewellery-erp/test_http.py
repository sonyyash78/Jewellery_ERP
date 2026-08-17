import requests

import sys
import os
from dotenv import load_dotenv

backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, '.env'))

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import create_access_token

db = SessionLocal()
user = db.query(User).first()
if user:
    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test /exchanges/ with extra query params
    res2 = requests.get("http://localhost:8000/api/v1/exchanges/?skip=0&limit=10&search=test&status=Paid", headers=headers)
    print("Exchanges status with params:", res2.status_code)
    if res2.status_code != 200:
        print("Exchanges error:", res2.text)
else:
    print("No users found.")
db.close()
