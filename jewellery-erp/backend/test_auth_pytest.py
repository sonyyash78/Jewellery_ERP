from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db, Base, engine
from app.api.dependencies import get_current_user
from app.models.user import User, Role
from app.core import security

import pytest

@pytest.fixture
def db_session():
    """Create a database session for each test with rollback."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    TEST_DATABASE_URL = "mysql+pymysql://root:root1234%40@localhost:3306/jewellery_erp"
    test_engine = create_engine(TEST_DATABASE_URL)
    
    connection = test_engine.connect()
    transaction = connection.begin()
    
    # Start a savepoint for rollback
    savepoint = connection.begin_nested()
    
    Session = sessionmaker(bind=connection)
    session = Session()
    
    # Override the get_db dependency
    def override_get_db():
        try:
            yield session
        finally:
            pass
    
    # Override the get_current_user dependency
    def override_get_current_user():
        return User(
            id=1, 
            username="testuser", 
            is_active=True,
            created_at=datetime.now()
        )
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    yield session
    
    # Rollback the transaction
    session.close()
    savepoint.rollback()
    transaction.rollback()
    connection.close()
    
    # Clean up dependency override
    app.dependency_overrides.clear()

@pytest.fixture
def client(db_session):
    """Create a test client with test database."""
    return TestClient(app)

@pytest.fixture
def create_test_role(db_session):
    """Create test roles and return their IDs."""
    # Check if Admin role already exists (from seed)
    admin_role = db_session.query(Role).filter(Role.name == "Admin").first()
    if not admin_role:
        admin_role = Role(name="Admin", description="Administrator role")
        db_session.add(admin_role)
        db_session.commit()
        db_session.refresh(admin_role)
    else:
        db_session.refresh(admin_role)
    
    user_role = db_session.query(Role).filter(Role.name == "User").first()
    if not user_role:
        user_role = Role(name="User", description="Regular user role")
        db_session.add(user_role)
        db_session.commit()
        db_session.refresh(user_role)
    else:
        db_session.refresh(user_role)
    
    return {"admin": admin_role.id, "user": user_role.id}

@pytest.fixture
def create_test_users(db_session, create_test_role):
    """Create test users and return their details."""
    test_admin = User(
        username="testadmin",
        email="testadmin@example.com",
        full_name="Test Admin",
        hashed_password=security.get_password_hash("testpass123"),
        role_id=create_test_role["admin"],
        is_active=True
    )
    test_user = User(
        username="testuser",
        email="testuser@example.com",
        full_name="Test User",
        hashed_password=security.get_password_hash("testpass123"),
        role_id=create_test_role["user"],
        is_active=True
    )
    inactive_user = User(
        username="inactive_user",
        email="inactive@example.com",
        full_name="Inactive User",
        hashed_password=security.get_password_hash("testpass123"),
        role_id=create_test_role["user"],
        is_active=False
    )
    db_session.add_all([test_admin, test_user, inactive_user])
    db_session.commit()
    
    return {
        "admin": {"username": "testadmin", "password": "testpass123"},
        "user": {"username": "testuser", "password": "testpass123"},
        "inactive": {"username": "inactive_user", "password": "testpass123"}
    }

# Test Functions
def test_login_success(client, create_test_users):
    """Test successful login."""
    login_data = {"username": "testadmin", "password": "testpass123"}
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200

def test_login_wrong_password(client, create_test_users):
    """Test login with wrong password."""
    login_data = {"username": "testadmin", "password": "wrongpassword"}
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 400

def test_login_inactive_user(client, create_test_users):
    """Test login with inactive user."""
    login_data = {"username": "inactive_user", "password": "testpass123"}
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 400

def test_login_missing_credentials(client, create_test_users):
    """Test login with missing credentials."""
    login_data = {"username": "testadmin"}
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 422

def test_protected_route_no_token():
    """Test protected route without token."""
    # Create a fresh app and client without dependency overrides
    from fastapi.testclient import TestClient
    from app.main import app
    
    test_client = TestClient(app)
    
    response = test_client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_protected_route_with_token(client, create_test_users):
    """Test protected route with valid token."""
    login_data = {"username": "testadmin", "password": "testpass123"}
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200

def test_protected_route_invalid_token():
    """Test protected route with invalid token."""
    from fastapi.testclient import TestClient
    from app.main import app
    
    test_client = TestClient(app)
    
    headers = {"Authorization": "Bearer invalidtoken123"}
    response = test_client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401

def test_oauth2_form_login(client, create_test_users):
    """Test OAuth2 form login."""
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "testadmin", "password": "testpass123"}
    )
    assert response.status_code == 200

def test_password_hashing(db_session, create_test_users):
    """Test that passwords are hashed."""
    user = db_session.query(User).filter(User.username == "testadmin").first()
    assert user.hashed_password != "testpass123"

def test_password_verification(db_session, create_test_users):
    """Test password verification."""
    user = db_session.query(User).filter(User.username == "testadmin").first()
    is_valid = security.verify_password("testpass123", user.hashed_password)
    assert is_valid

def test_register_user(client, create_test_role):
    """Test user registration with valid role."""
    user_data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "full_name": "New User",
        "password": "newpass123",
        "role_id": create_test_role["user"]
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200

def test_register_user_invalid_role(client, create_test_role):
    """Test user registration with invalid role_id."""
    user_data = {
        "username": "newuser2",
        "email": "newuser2@example.com",
        "full_name": "New User 2",
        "password": "newpass123",
        "role_id": 99999
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]

def test_duplicate_username(client, create_test_users):
    """Test registration with duplicate username."""
    user_data = {
        "username": "testadmin",
        "email": "new@example.com",
        "full_name": "New User",
        "password": "newpass123",
        "role_id": 11
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]
