from fastapi.testclient import TestClient
from app.main import app
from app.db.base_class import Base
from app.api.dependencies import engine
from app.models.user import User
from app.models.role import Role
from app.api.dependencies import get_current_user

client = TestClient(app)

def override_get_current_user():
    user = User(id=1, username="test_admin", is_active=True)
    user.roles = [Role(name="Admin")]
    return user

app.dependency_overrides[get_current_user] = override_get_current_user

def run_tests():
    print("Testing Create Product...")
    
    # Normally, we'd have a Metal Type and Purity ID from the DB. 
    # For a fresh DB, Metal Type 1 (Gold) and Purity 1 (24K) should exist if seed was run.
    # But since this is just testing the nested product creation logic, we will mock or create them if needed.
    
    # First, let's create a seed metal type manually via session to ensure foreign keys work
    from sqlalchemy.orm import Session
    from app.models.metal_type import MetalType
    from app.models.purity import Purity
    from app.models.stone import Stone
    from app.models.design import Design
    from app.models.category import Category
    
    db = Session(engine)
    try:
        mt = db.query(MetalType).filter_by(id=1).first()
        if not mt:
            mt = MetalType(id=1, name="Gold")
            db.add(mt)
            db.commit()
            
        pt = db.query(Purity).filter_by(id=1).first()
        if not pt:
            pt = Purity(id=1, metal_type_id=1, karat_name="24K", percentage=99.9)
            db.add(pt)
            db.commit()
            
        # Create Category, Design, Stone directly for testing
        cat = Category(id=1, name="Rings")
        db.add(cat)
        des = Design(id=1, name="Lotus Collection", design_code="LTS01")
        db.add(des)
        st = Stone(id=1, name="Round Cut Diamond", stone_type="Diamond", default_rate_per_carat=50000.0)
        db.add(st)
        db.commit()
    except Exception as e:
        print(f"Seed DB setup error (might be duplicate, ignoring): {e}")
        db.rollback()
    finally:
        db.close()

    product_data = {
        "category_id": 1,
        "design_id": 1,
        "metal_type_id": 1,
        "name": "Lotus Gold Ring",
        "sku_prefix": "RNG-LTS-001",
        "description": "A beautiful lotus design ring",
        "images": [
            {"image_url": "http://example.com/ring1.jpg", "is_primary": True}
        ],
        "variants": [
            {
                "purity_id": 1,
                "standard_weight": 5.5,
                "size": "7",
                "making_charge_type": "PerGram",
                "stones": [
                    {
                        "stone_id": 1,
                        "weight_carat": 0.5,
                        "pieces": 1
                    }
                ]
            }
        ]
    }
    
    response = client.post("/api/v1/products/", json=product_data)
    assert response.status_code == 200, f"Create product failed: {response.text}"
    product_id = response.json()["id"]
    print("✓ Create Product (with Variants, Stones, Images) successful")

    print("Testing Get Product...")
    response = client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Lotus Gold Ring"
    assert len(data["images"]) == 1
    assert len(data["variants"]) == 1
    assert len(data["variants"][0]["stones"]) == 1
    print("✓ Get Product successful")

    print("Testing List Products...")
    response = client.get("/api/v1/products/")
    assert response.status_code == 200
    assert response.json()["total"] >= 1
    print("✓ List Products successful")

    print("Testing Soft Delete Product...")
    response = client.delete(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    
    response = client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 404, "Product should not be found after soft delete"
    print("✓ Soft Delete Product successful")
    
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    # Create all tables explicitly again to ensure newly added models exist
    Base.metadata.create_all(bind=engine)
    run_tests()
