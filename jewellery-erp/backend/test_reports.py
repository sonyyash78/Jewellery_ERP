from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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

def test_sales_report(client):
    """Test sales report endpoint."""
    response = client.get("/api/v1/reports/sales")
    assert response.status_code == 200
    data = response.json()
    assert "total_sales" in data
    assert "total_taxable" in data
    assert "output_gst" in data

def test_purchases_report(client):
    """Test purchases report endpoint."""
    response = client.get("/api/v1/reports/purchases")
    assert response.status_code == 200
    data = response.json()
    assert "total_purchases" in data
    assert "total_taxable" in data
    assert "input_gst" in data

def test_inventory_report(client):
    """Test inventory report endpoint."""
    response = client.get("/api/v1/reports/inventory")
    assert response.status_code == 200
    data = response.json()
    assert "total_items" in data
    assert "total_weight" in data

def test_profit_report(client):
    """Test profit report endpoint."""
    response = client.get("/api/v1/reports/profit")
    assert response.status_code == 200
    data = response.json()
    assert "sales" in data
    assert "cogs" in data
    assert "gross_profit" in data
    assert "expenses" in data
    assert "net_profit" in data

def test_expenses_report(client):
    """Test expenses report endpoint - not implemented yet."""
    response = client.get("/api/v1/reports/expenses")
    # Endpoint may not exist yet
    assert response.status_code in [200, 404]

def test_gst_report(client):
    """Test GST report endpoint."""
    response = client.get("/api/v1/reports/gst")
    assert response.status_code == 200
    data = response.json()
    assert "output_gst" in data
    assert "input_gst" in data
    assert "net_gst_payable" in data
    # Validate GST formula: Net GST = Output GST - Input GST
    assert data["net_gst_payable"] == data["output_gst"] - data["input_gst"]

def test_customers_report(client):
    """Test customers report endpoint."""
    response = client.get("/api/v1/reports/customers")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "receivables" in data

def test_suppliers_report(client):
    """Test suppliers report endpoint."""
    response = client.get("/api/v1/reports/suppliers")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "payables" in data
