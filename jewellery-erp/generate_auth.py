import os

base_dir = "C:/Users/yashs/Documents/One Drive/OneDrive/Desktop/Saideep/jewellery-erp/backend/app"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

c_config = '''
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Jewellery ERP API"
    SECRET_KEY: str = "super_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
'''

c_security = '''
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any
from passlib.context import CryptContext
import jwt
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
'''

c_schemas_auth = '''
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

class RoleResponse(BaseModel):
    name: str
    
    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    roles: List[RoleResponse] = []
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
'''

c_deps = '''
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
import os

from app.core.config import settings
from app.models.user import User
from app.schemas.auth import TokenPayload

# Use SQLite for local rapid dev, swap with MySQL in production
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./test.db")
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

from sqlalchemy.orm import sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

security = HTTPBearer()

def get_current_user(
    db: Session = Depends(get_db), token: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    try:
        payload = jwt.decode(
            token.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        
        if token_data.type != "access":
            raise HTTPException(status_code=403, detail="Not an access token")
            
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.query(User).filter(User.id == int(token_data.sub)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        user_roles = [role.name for role in user.roles]
        if not any(role in self.allowed_roles for role in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this role"
            )
        return user
'''

c_auth_router = '''
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import jwt

from app.api.dependencies import get_db, get_current_user, RoleChecker
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import Token, LoginRequest, RefreshTokenRequest, TokenPayload
from app.schemas.user import UserResponse

router = APIRouter()

@router.post("/login", response_model=Token, summary="Login User", description="Authenticates a user and returns an Access JWT and a Refresh JWT.")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token, summary="Refresh Token", description="Uses a valid Refresh JWT to generate a new Access JWT.")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(
            request.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        
        if token_data.type != "refresh":
            raise HTTPException(status_code=403, detail="Not a refresh token")
            
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
        
    user = db.query(User).filter(User.id == int(token_data.sub)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active or found")

    access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout", summary="Logout User", description="Acknowledges client-side logout. Since JWTs are stateless, the client should delete the tokens upon success.")
def logout():
    return {"message": "Successfully logged out. Please remove tokens on client side."}

@router.get("/me", response_model=UserResponse, summary="Get Current User", description="Returns the currently authenticated user's profile.")
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/admin-only", summary="Admin Only Route", description="Demonstrates Role-Based Access Control. Only users with the 'Admin' role can access this.")
def admin_only_route(current_user: User = Depends(RoleChecker(["Admin"]))):
    return {"message": f"Welcome Admin {current_user.username}!"}
'''

c_main = '''
from fastapi import FastAPI
from app.api.v1.auth import router as auth_router
from app.db.base_class import Base
from app.api.dependencies import engine
from app.models import *  # Loads all models so metadata.create_all works

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Jewellery ERP API",
    description="Backend API for Jewellery ERP System",
    version="1.0.0"
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])

@app.get("/")
def root():
    return {"message": "Welcome to Jewellery ERP API. Visit /docs for the Swagger UI."}
'''

write_file("core/config.py", c_config)
write_file("core/security.py", c_security)
write_file("schemas/auth.py", c_schemas_auth)
write_file("schemas/user.py", c_schemas_user)
write_file("api/dependencies.py", c_deps)
write_file("api/v1/auth.py", c_auth_router)
write_file("main.py", c_main)

print("Auth module created.")
