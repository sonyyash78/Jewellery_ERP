from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.crm import Supplier

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
def create_supplier(db_session):
    """Create a test supplier with unique mobile number."""
    mobile = f"98765432{int(time.time() * 1000) % 100:02d}"
    supplier = Supplier(
        name="Test Supplier",
        contact_person="John Doe",
        mobile=mobile,
        email=f"supplier{int(time.time() * 1000) % 10000}@example.com",
        address="123 Main St",
        city="Mumbai",
        state="Maharashtra",
        pincode="400001",
        gst_number="GST123456789",
        outstanding_balance=Decimal("5000.00"),
        is_active=True
    )
    db_session.add(supplier)
    db_session.commit()
    db_session.refresh(supplier)
    return supplier

def test_get_suppliers(client):
    """Test get all suppliers."""
    response = client.get("/api/v1/suppliers/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_create_supplier(client):
    """Test create new supplier."""
    mobile = f"98765432{(int(time.time() * 1000) + 1) % 100:02d}"
    supplier_data = {
        "name": "New Supplier",
        "contact_person": "Jane Doe",
        "mobile": mobile,
        "email": f"newsupplier{int(time.time() * 1000) % 10000}@example.com",
        "address": "456 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "gst_number": "GST987654321",
        "outstanding_balance": 3000.00,
        "is_active": True
    }
    response = client.post("/api/v1/suppliers/", json=supplier_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Supplier"
    assert data["mobile"] == mobile

def test_create_duplicate_supplier(client, create_supplier):
    """Test duplicate mobile number rejection."""
    supplier_data = {
        "name": "Dup Supplier",
        "contact_person": "Jane Doe",
        "mobile": create_supplier.mobile,
        "email": "dup@example.com",
        "address": "456 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "gst_number": "GST987654321",
        "outstanding_balance": 3000.00,
        "is_active": True
    }
    response = client.post("/api/v1/suppliers/", json=supplier_data)
    assert response.status_code == 400

def test_get_supplier(client, create_supplier):
    """Test get single supplier."""
    response = client.get(f"/api/v1/suppliers/{create_supplier.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Supplier"

def test_get_nonexistent_supplier(client):
    """Test get non-existent supplier."""
    response = client.get("/api/v1/suppliers/99999")
    assert response.status_code == 404

def test_update_supplier(client, create_supplier):
    """Test update supplier."""
    update_data = {
        "name": "Updated Supplier",
        "email": "updated@example.com",
        "outstanding_balance": 8000.00
    }
    response = client.put(f"/api/v1/suppliers/{create_supplier.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Supplier"
    assert data["email"] == "updated@example.com"

def test_update_nonexistent_supplier(client):
    """Test update non-existent supplier."""
    update_data = {"name": "Updated"}
    response = client.put("/api/v1/suppliers/99999", json=update_data)
    assert response.status_code == 404

def test_delete_supplier(client, create_supplier):
    """Test delete supplier."""
    response = client.delete(f"/api/v1/suppliers/{create_supplier.id}")
    assert response.status_code == 200
    assert response.json()["ok"] == True

def test_delete_nonexistent_supplier(client):
    """Test delete non-existent supplier."""
    response = client.delete("/api/v1/suppliers/99999")
    assert response.status_code == 404

def test_supplier_mobile_validation(client):
    """Test mobile number validation."""
    supplier_data = {
        "name": "Invalid Supplier",
        "contact_person": "Jane Doe",
        "mobile": "123",
        "email": "invalid@example.com",
        "address": "456 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "gst_number": "GST987654321",
        "outstanding_balance": 3000.00,
        "is_active": True
    }
    response = client.post("/api/v1/suppliers/", json=supplier_data)
    assert response.status_code == 422

def test_supplier_outstanding_balance(client, create_supplier):
    """Test supplier data in response."""
    response = client.get(f"/api/v1/suppliers/{create_supplier.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["outstanding_balance"] is not None
    assert data["outstanding_balance"] == "5000.00"