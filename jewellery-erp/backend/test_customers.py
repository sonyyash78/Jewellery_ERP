from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.crm import Customer

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from decimal import Decimal
import time

TEST_DATABASE_URL = "mysql+pymysql://root:root1234%40@localhost:3306/jewellery_erp"

@pytest.fixture
def db_session():
    test_engine = create_engine(TEST_DATABASE_URL)
    connection = test_engine.connect()
    transaction = connection.begin()
    savepoint = connection.begin_nested()
    
    Session = sessionmaker(bind=connection)
    session = Session()
    
    def override_get_db():
        try:
            yield session
        finally:
            pass
    
    def override_get_current_user():
        return User(id=1, username="testuser", is_active=True, created_at=datetime.now())
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    yield session
    
    session.close()
    savepoint.rollback()
    transaction.rollback()
    connection.close()
    app.dependency_overrides.clear()

@pytest.fixture
def client(db_session):
    return TestClient(app)

@pytest.fixture
def create_customer(db_session):
    """Create a test customer with unique phone number."""
    phone = f"98765432{int(time.time() * 1000) % 100:02d}"
    customer = Customer(
        first_name="Test",
        last_name="Customer",
        phone_number=phone,
        email=f"test{int(time.time() * 1000) % 10000}@example.com",
        city="Mumbai",
        state="Maharashtra",
        pincode="400001",
        credit_limit=10000.00,
        outstanding_balance=Decimal("5000.00"),
        is_active=True
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer

def test_get_customers(client):
    """Test get all customers."""
    response = client.get("/api/v1/customers/")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "total_outstanding" in data
    assert "items" in data

def test_get_customers_with_search(client, create_customer):
    """Test search customers."""
    response = client.get("/api/v1/customers/?search=Test")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 0

def test_create_customer(client, create_customer):
    """Test create new customer."""
    phone = f"98765432{(int(time.time() * 1000) + 1) % 100:02d}"
    customer_data = {
        "first_name": "New",
        "last_name": "Customer",
        "phone_number": phone,
        "email": f"new{int(time.time() * 1000) % 10000}@example.com",
        "address": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "credit_limit": 5000.00,
        "is_active": True
    }
    response = client.post("/api/v1/customers/", json=customer_data)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "New"
    assert data["phone_number"] == phone

def test_create_duplicate_customer(client, create_customer):
    """Test duplicate phone number rejection."""
    customer_data = {
        "first_name": "Dup",
        "last_name": "Customer",
        "phone_number": create_customer.phone_number,
        "email": "dup@example.com",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "credit_limit": 5000.00,
        "is_active": True
    }
    response = client.post("/api/v1/customers/", json=customer_data)
    assert response.status_code == 400

def test_get_customer(client, create_customer):
    """Test get single customer."""
    response = client.get(f"/api/v1/customers/{create_customer.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Test"

def test_get_nonexistent_customer(client):
    """Test get non-existent customer."""
    response = client.get("/api/v1/customers/99999")
    assert response.status_code == 404

def test_update_customer(client, create_customer):
    """Test update customer."""
    update_data = {
        "first_name": "Updated",
        "email": "updated@example.com",
        "credit_limit": 15000.00
    }
    response = client.put(f"/api/v1/customers/{create_customer.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["email"] == "updated@example.com"

def test_update_nonexistent_customer(client):
    """Test update non-existent customer."""
    update_data = {"first_name": "Updated"}
    response = client.put("/api/v1/customers/99999", json=update_data)
    assert response.status_code == 404

def test_delete_customer(client, create_customer):
    """Test delete customer."""
    response = client.delete(f"/api/v1/customers/{create_customer.id}")
    assert response.status_code == 200
    assert response.json()["ok"] == True

def test_delete_nonexistent_customer(client):
    """Test delete non-existent customer."""
    response = client.delete("/api/v1/customers/99999")
    assert response.status_code == 404

def test_customer_phone_validation(client):
    """Test phone number validation."""
    customer_data = {
        "first_name": "Invalid",
        "last_name": "Phone",
        "phone_number": "123",
        "email": "invalid@example.com",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "credit_limit": 5000.00,
        "is_active": True
    }
    response = client.post("/api/v1/customers/", json=customer_data)
    assert response.status_code == 422

def test_customer_outstanding_balance(client):
    """Test outstanding balance in list response."""
    response = client.get("/api/v1/customers/")
    assert response.status_code == 200
    data = response.json()
    outstanding = data["total_outstanding"]
    assert outstanding is not None
    assert outstanding != ""