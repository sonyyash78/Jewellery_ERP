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

def test_list_invoices(client):
    """Test list all invoices."""
    response = client.get("/api/v1/invoices/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_nonexistent_invoice(client):
    """Test get non-existent invoice."""
    response = client.get("/api/v1/invoices/99999")
    assert response.status_code == 404

def test_link_customer_to_nonexistent_invoice(client):
    """Test linking customer to non-existent invoice."""
    response = client.patch("/api/v1/invoices/99999/customer", json={"customer_id": 1})
    assert response.status_code == 404