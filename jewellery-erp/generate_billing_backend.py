import os

backend_dir = "C:/Users/yashs/Documents/One Drive/OneDrive/Desktop/Saideep/jewellery-erp/backend/app"

def write_file(path, content):
    full_path = os.path.join(backend_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

c_schema_invoice = """
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.invoice import InvoiceStatus
from app.models.invoice_item import ItemType

class GoldCalcCreate(BaseModel):
    metal_rate_id: int
    gross_weight: float
    stone_weight: float = 0.0
    net_weight: float
    making_charges_amount: float = 0.0
    hallmark_charges: float = 0.0
    total_gold_value: float

class SilverCalcCreate(BaseModel):
    metal_rate_id: int
    gross_weight: float
    net_weight: float
    making_charges_amount: float = 0.0
    total_silver_value: float

class InvoiceItemCreate(BaseModel):
    inventory_item_id: Optional[int] = None
    item_name: str
    item_type: ItemType
    final_price: float
    gold_calculation: Optional[GoldCalcCreate] = None
    silver_calculation: Optional[SilverCalcCreate] = None

class InvoiceCreate(BaseModel):
    customer_id: int
    subtotal: float
    tax_amount: float
    discount_amount: float = 0.0
    grand_total: float
    status: InvoiceStatus = InvoiceStatus.DRAFT
    items: List[InvoiceItemCreate]

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: int
    invoice_date: datetime
    grand_total: float
    status: InvoiceStatus
    class Config:
        from_attributes = True
"""

c_api_invoice = """
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_item import InvoiceItem
from app.models.gold_calculation import GoldCalculation
from app.models.silver_calculation import SilverCalculation
from app.schemas.invoice import InvoiceCreate, InvoiceResponse

router = APIRouter()

def generate_invoice_number(db: Session) -> str:
    # A simple generator for the prototype. In prod, we'd use a sequence table.
    count = db.query(Invoice).count()
    return f"INV-{1000 + count + 1}"

@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # 1. Create Invoice
        db_invoice = Invoice(
            customer_id=invoice_in.customer_id,
            invoice_number=generate_invoice_number(db),
            subtotal=invoice_in.subtotal,
            tax_amount=invoice_in.tax_amount,
            discount_amount=invoice_in.discount_amount,
            grand_total=invoice_in.grand_total,
            status=invoice_in.status,
            created_by=current_user.id
        )
        db.add(db_invoice)
        db.flush() # Get ID
        
        # 2. Create Items
        for item_in in invoice_in.items:
            db_item = InvoiceItem(
                invoice_id=db_invoice.id,
                inventory_item_id=item_in.inventory_item_id,
                item_name=item_in.item_name,
                item_type=item_in.item_type,
                final_price=item_in.final_price
            )
            db.add(db_item)
            db.flush()
            
            # 3. Create Specific Calculations
            if item_in.gold_calculation:
                calc = item_in.gold_calculation
                db_gold = GoldCalculation(
                    invoice_item_id=db_item.id,
                    metal_rate_id=calc.metal_rate_id,
                    gross_weight=calc.gross_weight,
                    stone_weight=calc.stone_weight,
                    net_weight=calc.net_weight,
                    making_charges_amount=calc.making_charges_amount,
                    hallmark_charges=calc.hallmark_charges,
                    total_gold_value=calc.total_gold_value
                )
                db.add(db_gold)
                
            elif item_in.silver_calculation:
                calc = item_in.silver_calculation
                db_silver = SilverCalculation(
                    invoice_item_id=db_item.id,
                    metal_rate_id=calc.metal_rate_id,
                    gross_weight=calc.gross_weight,
                    net_weight=calc.net_weight,
                    making_charges_amount=calc.making_charges_amount,
                    total_silver_value=calc.total_silver_value
                )
                db.add(db_silver)
                
        db.commit()
        db.refresh(db_invoice)
        return db_invoice
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[InvoiceResponse])
def list_invoices(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoices = db.query(Invoice).order_by(Invoice.id.desc()).offset(skip).limit(limit).all()
    return invoices
"""

write_file("schemas/invoice.py", c_schema_invoice)
write_file("api/v1/invoices.py", c_api_invoice)
print("Backend Invoice API created.")
