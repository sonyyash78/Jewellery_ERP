import os

base_dir = "C:/Users/yashs/Documents/One Drive/OneDrive/Desktop/Saideep/jewellery-erp/backend/app"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

c_design = '''
from typing import List, Optional
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Design(Base):
    __tablename__ = "designs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    design_code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)

    products: Mapped[List["Product"]] = relationship("Product", back_populates="design")
'''

c_stone = '''
from typing import List, Optional
from sqlalchemy import Integer, String, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Stone(Base):
    __tablename__ = "stones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    stone_type: Mapped[str] = mapped_column(String(100))
    default_rate_per_carat: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2))

    variant_stones: Mapped[List["ProductVariantStone"]] = relationship("ProductVariantStone", back_populates="stone")
'''

c_product_image = '''
from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    image_url: Mapped[str] = mapped_column(String(500))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    product: Mapped["Product"] = relationship("Product", back_populates="images")
'''

c_product_variant_stone = '''
from sqlalchemy import Integer, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class ProductVariantStone(Base):
    __tablename__ = "product_variant_stones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    variant_id: Mapped[int] = mapped_column(Integer, ForeignKey("product_variants.id", ondelete="CASCADE"))
    stone_id: Mapped[int] = mapped_column(Integer, ForeignKey("stones.id", ondelete="RESTRICT"))
    weight_carat: Mapped[float] = mapped_column(DECIMAL(10, 3))
    pieces: Mapped[int] = mapped_column(Integer, default=1)

    variant: Mapped["ProductVariant"] = relationship("ProductVariant", back_populates="stones")
    stone: Mapped["Stone"] = relationship("Stone", back_populates="variant_stones")
'''

c_product_modified = '''
from typing import List, Optional
from sqlalchemy import Integer, String, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    design_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("designs.id", ondelete="SET NULL"))
    metal_type_id: Mapped[int] = mapped_column(Integer, ForeignKey("metal_types.id", ondelete="RESTRICT"))
    name: Mapped[str] = mapped_column(String(255))
    sku_prefix: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="products")
    design: Mapped[Optional["Design"]] = relationship("Design", back_populates="products")
    metal_type: Mapped["MetalType"] = relationship("MetalType", back_populates="products")
    variants: Mapped[List["ProductVariant"]] = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    images: Mapped[List["ProductImage"]] = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
'''

c_product_variant_modified = '''
from typing import List, Optional
from sqlalchemy import Integer, String, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="CASCADE"))
    purity_id: Mapped[int] = mapped_column(Integer, ForeignKey("purities.id", ondelete="RESTRICT"))
    standard_weight: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 3))
    size: Mapped[Optional[str]] = mapped_column(String(50))
    making_charge_type: Mapped[Optional[str]] = mapped_column(String(50))

    product: Mapped["Product"] = relationship("Product", back_populates="variants")
    purity: Mapped["Purity"] = relationship("Purity", back_populates="product_variants")
    inventory_items: Mapped[List["InventoryItem"]] = relationship("InventoryItem", back_populates="variant")
    stones: Mapped[List["ProductVariantStone"]] = relationship("ProductVariantStone", back_populates="variant", cascade="all, delete-orphan")
'''

c_schema_product = '''
from pydantic import BaseModel
from typing import List, Optional

# Sub-Schemas
class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[int] = None

class CategoryResponse(CategoryBase):
    id: int
    class Config: from_attributes = True

class DesignBase(BaseModel):
    name: str
    design_code: str
    description: Optional[str] = None

class DesignResponse(DesignBase):
    id: int
    class Config: from_attributes = True

class StoneBase(BaseModel):
    name: str
    stone_type: str
    default_rate_per_carat: Optional[float] = None

class StoneResponse(StoneBase):
    id: int
    class Config: from_attributes = True

class ImageCreate(BaseModel):
    image_url: str
    is_primary: bool = False

class ImageResponse(ImageCreate):
    id: int
    class Config: from_attributes = True

class VariantStoneCreate(BaseModel):
    stone_id: int
    weight_carat: float
    pieces: int = 1

class VariantStoneResponse(VariantStoneCreate):
    id: int
    stone: StoneResponse
    class Config: from_attributes = True

class VariantCreate(BaseModel):
    purity_id: int
    standard_weight: Optional[float] = None
    size: Optional[str] = None
    making_charge_type: Optional[str] = None
    stones: List[VariantStoneCreate] = []

class VariantResponse(BaseModel):
    id: int
    purity_id: int
    standard_weight: Optional[float]
    size: Optional[str]
    making_charge_type: Optional[str]
    stones: List[VariantStoneResponse] = []
    class Config: from_attributes = True

# Main Product Schema
class ProductCreate(BaseModel):
    category_id: Optional[int] = None
    design_id: Optional[int] = None
    metal_type_id: int
    name: str
    sku_prefix: str
    description: Optional[str] = None
    images: List[ImageCreate] = []
    variants: List[VariantCreate] = []

class ProductResponse(BaseModel):
    id: int
    category_id: Optional[int]
    design_id: Optional[int]
    metal_type_id: int
    name: str
    sku_prefix: str
    description: Optional[str]
    images: List[ImageResponse] = []
    variants: List[VariantResponse] = []
    class Config: from_attributes = True

class ProductListResponse(BaseModel):
    total: int
    items: List[ProductResponse]
'''

c_service_product = '''
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_variant import ProductVariant
from app.models.product_variant_stone import ProductVariantStone
from app.models.audit_log import AuditLog
from app.schemas.product import ProductCreate
from fastapi import HTTPException

def log_action(db: Session, user_id: int, entity_name: str, entity_id: str, action: str):
    log = AuditLog(
        user_id=user_id,
        entity_name=entity_name,
        entity_id=entity_id,
        action=action,
        changes=None
    )
    db.add(log)

def get_products(db: Session, skip: int = 0, limit: int = 10, search: str = None):
    query = db.query(Product).filter(Product.is_deleted == False)
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku_prefix.ilike(f"%{search}%")
            )
        )
    total = query.count()
    items = query.order_by(desc(Product.id)).offset(skip).limit(limit).all()
    return total, items

def get_product(db: Session, product_id: int):
    product = db.query(Product).filter(Product.id == product_id, Product.is_deleted == False).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

def create_product(db: Session, product_in: ProductCreate, user_id: int):
    db_product = Product(
        category_id=product_in.category_id,
        design_id=product_in.design_id,
        metal_type_id=product_in.metal_type_id,
        name=product_in.name,
        sku_prefix=product_in.sku_prefix,
        description=product_in.description
    )
    db.add(db_product)
    db.flush()

    for img in product_in.images:
        db_img = ProductImage(product_id=db_product.id, **img.model_dump())
        db.add(db_img)

    for var in product_in.variants:
        db_var = ProductVariant(
            product_id=db_product.id,
            purity_id=var.purity_id,
            standard_weight=var.standard_weight,
            size=var.size,
            making_charge_type=var.making_charge_type
        )
        db.add(db_var)
        db.flush()
        
        for st in var.stones:
            db_stone = ProductVariantStone(
                variant_id=db_var.id,
                **st.model_dump()
            )
            db.add(db_stone)
            
    db.commit()
    db.refresh(db_product)
    log_action(db, user_id, "Product", str(db_product.id), "CREATE")
    return db_product

def delete_product(db: Session, product_id: int, user_id: int):
    product = get_product(db, product_id)
    product.is_deleted = True
    db.commit()
    log_action(db, user_id, "Product", str(product.id), "DELETE")
'''

c_api_product = '''
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, ProductListResponse
from app.services import product_service

router = APIRouter()

@router.post("/", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new Product, including its Variants, Stones, and Images."""
    return product_service.create_product(db, product_in, current_user.id)

@router.get("/", response_model=ProductListResponse)
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List products with pagination and search."""
    total, items = product_service.get_products(db, skip, limit, search)
    return {"total": total, "items": items}

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific product tree by ID."""
    return product_service.get_product(db, product_id)

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete a product."""
    product_service.delete_product(db, product_id, current_user.id)
    return {"message": "Product soft deleted"}
'''

write_file("models/design.py", c_design)
write_file("models/stone.py", c_stone)
write_file("models/product_image.py", c_product_image)
write_file("models/product_variant_stone.py", c_product_variant_stone)
write_file("models/product.py", c_product_modified)
write_file("models/product_variant.py", c_product_variant_modified)
write_file("schemas/product.py", c_schema_product)
write_file("services/product_service.py", c_service_product)
write_file("api/v1/products.py", c_api_product)

init_file = os.path.join(base_dir, "models/__init__.py")
with open(init_file, "r") as f:
    content = f.read()

new_imports = """from .design import Design
from .stone import Stone
from .product_image import ProductImage
from .product_variant_stone import ProductVariantStone
"""
if "from .design" not in content:
    with open(init_file, "a") as f:
        f.write(new_imports)

print("Product Module Generated Successfully")
