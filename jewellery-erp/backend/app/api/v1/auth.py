from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.core import security
from app.core.config import settings
from app.repositories.user_repo import user_repo
from app.schemas.user import Token, UserResponse, UserCreate
from app.models.user import User, Role

router = APIRouter()


def _issue_token(user: User) -> dict:
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


def _authenticate(db: Session, username: str, password: str) -> User:
    user = user_repo.get_by_username(db, username=username)
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


@router.post("/login", response_model=Token)
async def login(request: Request, db: Session = Depends(get_db)) -> Any:
    """Accept JSON {username, password} or OAuth2 form-urlencoded."""
    content_type = (request.headers.get("content-type") or "").lower()
    username = password = None

    if "application/json" in content_type:
        body = await request.json()
        username = body.get("username")
        password = body.get("password")
    else:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")

    if not username or not password:
        raise HTTPException(status_code=422, detail="username and password required")

    user = _authenticate(db, str(username), str(password))
    return _issue_token(user)


@router.post("/token", response_model=Token)
def login_oauth2_form(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """OAuth2 password flow for Swagger Authorize."""
    user = _authenticate(db, form_data.username, form_data.password)
    return _issue_token(user)


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> Any:
    return current_user


@router.post("/register", response_model=UserResponse)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate
) -> Any:
    """Register new user."""
    user = user_repo.get_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )

    # Validate role_id exists
    if user_in.role_id is not None:
        role = db.query(Role).filter(Role.id == user_in.role_id).first()
        if not role:
            raise HTTPException(
                status_code=400,
                detail=f"Role with id {user_in.role_id} does not exist.",
            )

    hashed_password = security.get_password_hash(user_in.password)
    db_obj = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        role_id=user_in.role_id,
        is_active=True
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
