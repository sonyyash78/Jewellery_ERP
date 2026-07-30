from fastapi.testclient import TestClient
from app.main import app
from app.db.base_class import Base
from app.api.dependencies import engine
from app.models.user import User
from app.api.dependencies import SessionLocal

client = TestClient(app)

# Helper to bypass auth for testing (or we can just mock the dependency)
from app.api.dependencies import get_current_user
from app.models.role import Role

def override_get_current_user():
    user = User(id=1, username="test_admin", is_active=True)
    user.roles = [Role(name="Admin")]
    return user

app.dependency_overrides[get_current_user] = override_get_current_user

def run_tests():
    # 1. Test Metal Rates Seeding
    print("Testing Seed Metals...")
    response = client.post("/api/v1/metal-rates/seed")
    assert response.status_code == 200, f"Seed failed: {response.text}"
    print("✓ Seed successful")

    # 2. Test Get Latest Rates
    print("Testing Get Latest Rates...")
    response = client.get("/api/v1/metal-rates/latest")
    assert response.status_code == 200
    print("✓ Get Latest Rates successful")

    # 3. Test Add Rate
    print("Testing Add Rate...")
    rate_data = {
        "purity_id": 1, # Should be 24K Gold if seeded sequentially
        "rate_per_gram": 6500.50,
        "metal_type": "Gold"
    }
    response = client.post("/api/v1/metal-rates/", json=rate_data)
    assert response.status_code == 200, f"Add rate failed: {response.text}"
    print("✓ Add Rate successful")

    # 4. Test Create Customer
    print("Testing Create Customer...")
    customer_data = {
        "first_name": "Test",
        "last_name": "User",
        "phone_number": "9876543210",
        "email": "test@example.com",
        "pan_card": "ABCDE1234F"
    }
    response = client.post("/api/v1/customers/", json=customer_data)
    assert response.status_code == 200, f"Create customer failed: {response.text}"
    customer_id = response.json()["id"]
    print("✓ Create Customer successful")

    # 5. Test Get Customer
    print("Testing Get Customer...")
    response = client.get(f"/api/v1/customers/{customer_id}")
    assert response.status_code == 200
    assert response.json()["first_name"] == "Test"
    print("✓ Get Customer successful")

    # 6. Test Search Customers
    print("Testing Search Customers...")
    response = client.get("/api/v1/customers/?search=Test")
    assert response.status_code == 200
    assert response.json()["total"] >= 1
    print("✓ Search Customers successful")

    # 7. Test Update Customer
    print("Testing Update Customer...")
    update_data = {"last_name": "Updated"}
    response = client.patch(f"/api/v1/customers/{customer_id}", json=update_data)
    assert response.status_code == 200
    assert response.json()["last_name"] == "Updated"
    print("✓ Update Customer successful")

    # 8. Test Delete Customer (Soft Delete)
    print("Testing Delete Customer...")
    response = client.delete(f"/api/v1/customers/{customer_id}")
    assert response.status_code == 200
    
    # Verify it's not in normal get anymore
    response = client.get(f"/api/v1/customers/{customer_id}")
    assert response.status_code == 404
    print("✓ Delete Customer successful")

    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    run_tests()
