from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.inventory import Category, MetalType, QRInventory

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

@pytest.fixture
def create_category(db_session):
    category = Category(
        name="Gold Chain",
        description="Gold chain category",
        metal_type=MetalType.GOLD
    )
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category

def test_create_category(client):
    category_data = {"name": "Test Category", "description": "Test", "metal_type": "Gold"}
    response = client.post("/api/v1/inventory/categories", json=category_data)
    assert response.status_code == 200

def test_create_duplicate_category(client, create_category):
    category_data = {"name": "Gold Chain", "description": "Dup", "metal_type": "Gold"}
    response = client.post("/api/v1/inventory/categories", json=category_data)
    assert response.status_code == 400

def test_create_item_with_qr(client, create_category):
    """Test QR code generation on item creation."""
    item_data = {"item_name": "Test Item", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": "10.500", "net_weight": "9.800"}
    response = client.post("/api/v1/inventory/items", json=item_data)
    assert response.status_code == 200
    data = response.json()
    # Check qr_code_id is generated
    assert "qr_code_id" in data
    assert data["qr_code_id"] is not None

def test_qr_code_uniqueness(client, create_category):
    """Test that each item gets a unique QR code."""
    item_data = {"item_name": "QR Item 1", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": "5.000", "net_weight": "4.500"}
    response1 = client.post("/api/v1/inventory/items", json=item_data)
    item1 = response1.json()
    
    item_data2 = {"item_name": "QR Item 2", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": "5.000", "net_weight": "4.500"}
    response2 = client.post("/api/v1/inventory/items", json=item_data2)
    item2 = response2.json()
    
    # Both should have different qr_code_id values
    assert item1["qr_code_id"] != item2["qr_code_id"]

def test_get_items(client, create_category):
    item_data = {"item_name": "Get Test", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": "5.000", "net_weight": "4.500"}
    client.post("/api/v1/inventory/items", json=item_data)
    response = client.get("/api/v1/inventory/items")
    assert response.status_code == 200

def test_update_item(client, create_category):
    item_data = {"item_name": "Original", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": "5.000", "net_weight": "4.500"}
    create_response = client.post("/api/v1/inventory/items", json=item_data)
    item_id = create_response.json()["id"]
    update_data = {"item_name": "Updated", "gross_weight": "6.000"}
    response = client.put(f"/api/v1/inventory/items/{item_id}", json=update_data)
    assert response.status_code == 200

def test_update_nonexistent_item(client):
    update_data = {"item_name": "Updated"}
    response = client.put("/api/v1/inventory/items/99999", json=update_data)
    assert response.status_code == 404

def test_delete_item(client, create_category):
    item_data = {"item_name": "To Delete", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": "5.000", "net_weight": "4.500"}
    create_response = client.post("/api/v1/inventory/items", json=item_data)
    item_id = create_response.json()["id"]
    response = client.delete(f"/api/v1/inventory/items/{item_id}")
    assert response.status_code == 200

def test_delete_nonexistent_item(client):
    response = client.delete("/api/v1/inventory/items/99999")
    assert response.status_code == 404

def test_search_items(client, create_category):
    for i in range(3):
        client.post("/api/v1/inventory/items", json={"item_name": f"Search Item {i}", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": "5.000", "net_weight": "4.500"})
    response = client.get("/api/v1/inventory/items")
    assert response.status_code == 200

def test_item_validation_gross_weight(client, create_category):
    item_data = {"item_name": "Test", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": 0, "net_weight": 4.5}
    response = client.post("/api/v1/inventory/items", json=item_data)
    assert response.status_code == 422

def test_item_validation_net_weight(client, create_category):
    item_data = {"item_name": "Test", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": 5.0, "net_weight": 0}
    response = client.post("/api/v1/inventory/items", json=item_data)
    assert response.status_code == 422

def test_item_duplicate_name(client, create_category):
    item_data = {"item_name": "Duplicate Test", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": "5.000", "net_weight": "4.500"}
    response1 = client.post("/api/v1/inventory/items", json=item_data)
    response2 = client.post("/api/v1/inventory/items", json=item_data)
    assert response1.status_code == 200 and response2.status_code == 200

def test_category_list(client):
    response = client.get("/api/v1/inventory/categories")
    assert response.status_code == 200

def test_item_status_update(client, create_category):
    item_data = {"item_name": "Status Test", "category_id": create_category.id, "metal_type": "Gold", "gross_weight": "5.000", "net_weight": "4.500", "status": "Available"}
    create_response = client.post("/api/v1/inventory/items", json=item_data)
    item_id = create_response.json()["id"]
    update_data = {"status": "Sold"}
    response = client.put(f"/api/v1/inventory/items/{item_id}", json=update_data)
    assert response.status_code == 200

def test_invalid_metal_type(client, create_category):
    item_data = {"item_name": "Invalid", "category_id": create_category.id, "metal_type": "InvalidType", "gross_weight": "5.000", "net_weight": "4.500"}
    response = client.post("/api/v1/inventory/items", json=item_data)
    assert response.status_code == 422
