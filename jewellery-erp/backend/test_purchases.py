from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.crm import Supplier
from app.models.purchases import GoldPurchase, SilverPurchase

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

def test_get_gold_purchases(client):
    """Test get all gold purchases."""
    response = client.get("/api/v1/purchases/gold")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_create_gold_purchase(client, create_supplier):
    """Test create new gold purchase."""
    invoice = f"GOLD-{int(time.time() * 1000) % 1000000}"
    purchase_data = {
        "supplier_id": create_supplier.id,
        "invoice_number": invoice,
        "gross_weight": "10.500",
        "stone_weight": "0.500",
        "net_weight": "10.000",
        "touch": "91.5",
        "purity": "22K",
        "todays_rate": "6500.00",
        "purchase_rate": "6000.00",
        "amount": "60000.00",
        "gst_amount": "1080.00",
        "total_amount": "61080.00"
    }
    response = client.post("/api/v1/purchases/gold", json=purchase_data)
    assert response.status_code == 200
    data = response.json()
    assert data["invoice_number"] == invoice
    assert data["gross_weight"] == "10.500"

def test_create_duplicate_gold_purchase(client, create_supplier):
    """Test duplicate invoice rejection."""
    invoice = f"GOLD-{int(time.time() * 1000) % 1000000}"
    purchase_data = {
        "supplier_id": create_supplier.id,
        "invoice_number": invoice,
        "gross_weight": "10.500",
        "stone_weight": "0.500",
        "net_weight": "10.000",
        "touch": "91.5",
        "purity": "22K",
        "todays_rate": "6500.00",
        "purchase_rate": "6000.00",
        "amount": "60000.00",
        "gst_amount": "1080.00",
        "total_amount": "61080.00"
    }
    client.post("/api/v1/purchases/gold", json=purchase_data)
    
    response = client.post("/api/v1/purchases/gold", json=purchase_data)
    assert response.status_code == 400

def test_get_gold_purchase_by_id(client, create_supplier):
    """Test get single gold purchase."""
    invoice = f"GOLD-{int(time.time() * 1000) % 1000000}"
    purchase_data = {
        "supplier_id": create_supplier.id,
        "invoice_number": invoice,
        "gross_weight": "10.500",
        "stone_weight": "0.500",
        "net_weight": "10.000",
        "touch": "91.5",
        "purity": "22K",
        "todays_rate": "6500.00",
        "purchase_rate": "6000.00",
        "amount": "60000.00",
        "gst_amount": "1080.00",
        "total_amount": "61080.00"
    }
    create_response = client.post("/api/v1/purchases/gold", json=purchase_data)
    purchase_id = create_response.json()["id"]
    
    response = client.get(f"/api/v1/purchases/gold/{purchase_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["invoice_number"] == invoice

def test_get_nonexistent_gold_purchase(client):
    """Test get non-existent gold purchase."""
    response = client.get("/api/v1/purchases/gold/99999")
    assert response.status_code == 404

def test_get_silver_purchases(client):
    """Test get all silver purchases."""
    response = client.get("/api/v1/purchases/silver")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_create_silver_purchase(client, create_supplier):
    """Test create new silver purchase."""
    invoice = f"SILV-{int(time.time() * 1000) % 1000000}"
    purchase_data = {
        "supplier_id": create_supplier.id,
        "invoice_number": invoice,
        "weight": "100.000",
        "tanch": "85.5",
        "wastage": "2.0",
        "final_tanch": "87.5",
        "recovered_silver": "87.500",
        "todays_rate": "750.00",
        "silver_value": "65625.00",
        "amount": "65625.00",
        "gst_amount": "1181.25",
        "total_amount": "66806.25"
    }
    response = client.post("/api/v1/purchases/silver", json=purchase_data)
    assert response.status_code == 200
    data = response.json()
    assert data["invoice_number"] == invoice
    assert data["weight"] == "100.000"

def test_create_duplicate_silver_purchase(client, create_supplier):
    """Test duplicate silver invoice rejection."""
    invoice = f"SILV-{int(time.time() * 1000) % 1000000}"
    purchase_data = {
        "supplier_id": create_supplier.id,
        "invoice_number": invoice,
        "weight": "100.000",
        "tanch": "85.5",
        "wastage": "2.0",
        "final_tanch": "87.5",
        "recovered_silver": "87.500",
        "todays_rate": "750.00",
        "silver_value": "65625.00",
        "amount": "65625.00",
        "gst_amount": "1181.25",
        "total_amount": "66806.25"
    }
    client.post("/api/v1/purchases/silver", json=purchase_data)
    
    response = client.post("/api/v1/purchases/silver", json=purchase_data)
    assert response.status_code == 400

def test_purchase_validation_weight(client, create_supplier):
    """Test weight validation for gold purchase."""
    purchase_data = {
        "supplier_id": create_supplier.id,
        "invoice_number": f"GOLD-{int(time.time() * 1000) % 1000000}",
        "gross_weight": "-10.000",
        "stone_weight": "0.500",
        "net_weight": "10.000",
        "touch": "91.5",
        "purity": "22K",
        "todays_rate": "6500.00",
        "purchase_rate": "6000.00",
        "amount": "60000.00",
        "gst_amount": "1080.00",
        "total_amount": "61080.00"
    }
    response = client.post("/api/v1/purchases/gold", json=purchase_data)
    assert response.status_code == 422

def test_purchase_supplier_linkage(client, create_supplier):
    """Test supplier linkage in purchase."""
    invoice = f"GOLD-{int(time.time() * 1000) % 1000000}"
    purchase_data = {
        "supplier_id": create_supplier.id,
        "invoice_number": invoice,
        "gross_weight": "10.500",
        "stone_weight": "0.500",
        "net_weight": "10.000",
        "touch": "91.5",
        "purity": "22K",
        "todays_rate": "6500.00",
        "purchase_rate": "6000.00",
        "amount": "60000.00",
        "gst_amount": "1080.00",
        "total_amount": "61080.00"
    }
    response = client.post("/api/v1/purchases/gold", json=purchase_data)
    assert response.status_code == 200
    data = response.json()
    assert data["supplier_id"] == create_supplier.id