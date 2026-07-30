import os

base_dir = "C:/Users/yashs/Documents/One Drive/OneDrive/Desktop/Saideep/jewellery-erp/backend/app"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

c_audit_log = '''
from typing import Optional
from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, ForeignKey, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    entity_name: Mapped[str] = mapped_column(String(100), index=True)
    entity_id: Mapped[str] = mapped_column(String(100), index=True)
    action: Mapped[str] = mapped_column(String(50))
    changes: Mapped[Optional[dict]] = mapped_column(JSON)
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    
    user = relationship("User")
'''

c_schema_customer = '''
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re

class CustomerBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    pan_card: Optional[str] = None
    aadhar_card: Optional[str] = None

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v):
        if not re.match(r'^\+?1?\d{9,15}$', v):
            raise ValueError("Invalid phone number format")
        return v
        
    @field_validator('pan_card')
    @classmethod
    def validate_pan(cls, v):
        if v and not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', v.upper()):
            raise ValueError("Invalid PAN format")
        return v.upper() if v else v

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    pan_card: Optional[str] = None
    aadhar_card: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    is_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerList(BaseModel):
    total: int
    items: list[CustomerResponse]
'''

c_service_customer = '''
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.models.customer import Customer
from app.models.audit_log import AuditLog
from app.schemas.customer import CustomerCreate, CustomerUpdate
from fastapi import HTTPException
import json

def log_action(db: Session, user_id: int, entity_name: str, entity_id: str, action: str, changes: dict = None):
    log = AuditLog(
        user_id=user_id,
        entity_name=entity_name,
        entity_id=entity_id,
        action=action,
        changes=changes
    )
    db.add(log)

def get_customers(db: Session, skip: int = 0, limit: int = 10, search: str = None):
    query = db.query(Customer).filter(Customer.is_deleted == False)
    if search:
        query = query.filter(
            or_(
                Customer.first_name.ilike(f"%{search}%"),
                Customer.last_name.ilike(f"%{search}%"),
                Customer.phone_number.ilike(f"%{search}%")
            )
        )
    total = query.count()
    items = query.order_by(desc(Customer.created_at)).offset(skip).limit(limit).all()
    return total, items

def get_customer(db: Session, customer_id: int):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.is_deleted == False).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

def create_customer(db: Session, customer_in: CustomerCreate, user_id: int):
    db_customer = Customer(**customer_in.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    log_action(db, user_id, "Customer", str(db_customer.id), "CREATE", customer_in.model_dump())
    db.commit()
    return db_customer

def update_customer(db: Session, customer_id: int, customer_in: CustomerUpdate, user_id: int):
    db_customer = get_customer(db, customer_id)
    update_data = customer_in.model_dump(exclude_unset=True)
    
    if not update_data:
        return db_customer

    for field, value in update_data.items():
        setattr(db_customer, field, value)

    db.commit()
    db.refresh(db_customer)
    
    log_action(db, user_id, "Customer", str(db_customer.id), "UPDATE", update_data)
    db.commit()
    return db_customer

def delete_customer(db: Session, customer_id: int, user_id: int):
    db_customer = get_customer(db, customer_id)
    db_customer.is_deleted = True
    db.commit()
    
    log_action(db, user_id, "Customer", str(db_customer.id), "DELETE", {"is_deleted": True})
    db.commit()
    return db_customer
'''

c_api_customer = '''
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerList
from app.services import customer_service

router = APIRouter()

@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new customer with validation and audit logging."""
    return customer_service.create_customer(db, customer_in, current_user.id)

@router.get("/", response_model=CustomerList)
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all active customers with search and pagination."""
    total, items = customer_service.get_customers(db, skip, limit, search)
    return {"total": total, "items": items}

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific customer by ID."""
    return customer_service.get_customer(db, customer_id)

@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a customer."""
    return customer_service.update_customer(db, customer_id, customer_in, current_user.id)

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete a customer."""
    customer_service.delete_customer(db, customer_id, current_user.id)
    return {"message": "Customer deleted successfully"}
'''

c_schema_metal_rate = '''
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RateCreate(BaseModel):
    purity_id: int
    rate_per_gram: float
    metal_type: str  # 'Gold' or 'Silver'

class PurityResponse(BaseModel):
    id: int
    karat_name: str
    percentage: float

    class Config:
        from_attributes = True

class MetalRateResponse(BaseModel):
    id: int
    purity_id: int
    rate_per_gram: float
    effective_datetime: datetime
    purity: Optional[PurityResponse] = None

    class Config:
        from_attributes = True

class RateHistoryResponse(BaseModel):
    purity: PurityResponse
    history: List[MetalRateResponse]
'''

c_service_metal_rate = '''
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.metal_type import MetalType
from app.models.purity import Purity
from app.models.gold_rate import GoldRate
from app.models.silver_rate import SilverRate
from app.schemas.metal_rate import RateCreate
from fastapi import HTTPException

def seed_default_metals(db: Session):
    gold = db.query(MetalType).filter(MetalType.name == "Gold").first()
    if not gold:
        gold = MetalType(name="Gold")
        db.add(gold)
        db.commit()
        db.refresh(gold)
        purities = [
            Purity(metal_type_id=gold.id, karat_name="24K", percentage=99.9),
            Purity(metal_type_id=gold.id, karat_name="22K", percentage=91.6),
            Purity(metal_type_id=gold.id, karat_name="20K", percentage=83.3),
            Purity(metal_type_id=gold.id, karat_name="18K", percentage=75.0),
        ]
        db.add_all(purities)

    silver = db.query(MetalType).filter(MetalType.name == "Silver").first()
    if not silver:
        silver = MetalType(name="Silver")
        db.add(silver)
        db.commit()
        db.refresh(silver)
        purities = [
            Purity(metal_type_id=silver.id, karat_name="999", percentage=99.9),
            Purity(metal_type_id=silver.id, karat_name="925", percentage=92.5),
            Purity(metal_type_id=silver.id, karat_name="Custom", percentage=100.0),
        ]
        db.add_all(purities)
    db.commit()
    return {"message": "Defaults seeded"}

def add_rate(db: Session, rate_in: RateCreate):
    purity = db.query(Purity).filter(Purity.id == rate_in.purity_id).first()
    if not purity:
        raise HTTPException(status_code=404, detail="Purity not found")
        
    if rate_in.metal_type.lower() == "gold":
        new_rate = GoldRate(purity_id=rate_in.purity_id, rate_per_gram=rate_in.rate_per_gram)
        db.add(new_rate)
    elif rate_in.metal_type.lower() == "silver":
        new_rate = SilverRate(purity_id=rate_in.purity_id, rate_per_gram=rate_in.rate_per_gram)
        db.add(new_rate)
    else:
        raise HTTPException(status_code=400, detail="metal_type must be Gold or Silver")
    
    db.commit()
    db.refresh(new_rate)
    return new_rate

def get_latest_rates(db: Session):
    gold_purities = db.query(Purity).join(MetalType).filter(MetalType.name == "Gold").all()
    silver_purities = db.query(Purity).join(MetalType).filter(MetalType.name == "Silver").all()
    
    latest_rates = []
    
    for p in gold_purities:
        rate = db.query(GoldRate).filter(GoldRate.purity_id == p.id).order_by(desc(GoldRate.effective_datetime)).first()
        if rate:
            rate.purity = p
            latest_rates.append(rate)
            
    for p in silver_purities:
        rate = db.query(SilverRate).filter(SilverRate.purity_id == p.id).order_by(desc(SilverRate.effective_datetime)).first()
        if rate:
            rate.purity = p
            latest_rates.append(rate)
            
    return latest_rates

def get_rate_history(db: Session, purity_id: int):
    purity = db.query(Purity).join(MetalType).filter(Purity.id == purity_id).first()
    if not purity:
        raise HTTPException(status_code=404, detail="Purity not found")
        
    if purity.metal_type.name == "Gold":
        history = db.query(GoldRate).filter(GoldRate.purity_id == purity_id).order_by(desc(GoldRate.effective_datetime)).all()
    else:
        history = db.query(SilverRate).filter(SilverRate.purity_id == purity_id).order_by(desc(SilverRate.effective_datetime)).all()
        
    return {"purity": purity, "history": history}
'''

c_api_metal_rate = '''
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_db, get_current_user, RoleChecker
from app.models.user import User
from app.schemas.metal_rate import RateCreate, MetalRateResponse, RateHistoryResponse
from app.services import metal_rate_service

router = APIRouter()

@router.post("/seed")
def seed_metals(db: Session = Depends(get_db)):
    """Seed initial Gold and Silver purities if they don't exist."""
    return metal_rate_service.seed_default_metals(db)

@router.post("/", response_model=MetalRateResponse)
def add_rate(
    rate_in: RateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Manager"]))
):
    """Add a new metal rate (implicitly stores history by inserting new row)."""
    return metal_rate_service.add_rate(db, rate_in)

@router.get("/latest", response_model=List[MetalRateResponse])
def get_latest_rates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the currently active rates for all purities."""
    return metal_rate_service.get_latest_rates(db)

@router.get("/{purity_id}/history", response_model=RateHistoryResponse)
def get_history(
    purity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get historical rates for a specific purity."""
    return metal_rate_service.get_rate_history(db, purity_id)
'''

write_file("models/audit_log.py", c_audit_log)
write_file("schemas/customer.py", c_schema_customer)
write_file("schemas/metal_rate.py", c_schema_metal_rate)
write_file("services/__init__.py", "")
write_file("services/customer_service.py", c_service_customer)
write_file("services/metal_rate_service.py", c_service_metal_rate)
write_file("api/v1/customers.py", c_api_customer)
write_file("api/v1/metal_rates.py", c_api_metal_rate)
print("Modules Generated Successfully")
