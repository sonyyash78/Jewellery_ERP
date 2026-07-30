from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_item import InvoiceItem
from app.models.gold_calculation import GoldCalculation
from app.models.silver_calculation import SilverCalculation
from app.schemas.invoice import InvoiceCreate, InvoiceResponse

router = APIRouter()

def generate_invoice_number(db: Session) -> str:
    # A simple generator for the prototype. In prod, we would use a sequence table.
    count = db.query(Invoice).count()
    return f"INV-{1000 + count + 1}"

@router.post("/", response_model=InvoiceResponse)
def create_sale(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a sale (invoice)."""
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
                # Schema sends net_weight; model stores tanch_percentage + pure_weight
                pure_weight = calc.net_weight
                tanch_percentage = (
                    (pure_weight / calc.gross_weight * 100.0) if calc.gross_weight else 0.0
                )
                db_silver = SilverCalculation(
                    invoice_item_id=db_item.id,
                    metal_rate_id=calc.metal_rate_id,
                    gross_weight=calc.gross_weight,
                    tanch_percentage=tanch_percentage,
                    pure_weight=pure_weight,
                    making_charges_amount=calc.making_charges_amount,
                    total_silver_value=calc.total_silver_value
                )
                db.add(db_silver)
            
            # 4. Mark StockItem as Sold if this was a scanned item
            if hasattr(item_in, "stock_item_id") and item_in.stock_item_id:
                from app.models.stock_item import StockItem
                stock_item = db.query(StockItem).filter(StockItem.id == item_in.stock_item_id).first()
                if stock_item:
                    stock_item.status = "Sold"
                
        db.commit()
        db.refresh(db_invoice)
        return db_invoice
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[InvoiceResponse])
def list_sales(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all sales (invoices)."""
    invoices = db.query(Invoice).order_by(Invoice.id.desc()).offset(skip).limit(limit).all()
    return invoices

@router.get("/{id}", response_model=InvoiceResponse)
def get_sale(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific sale (invoice)."""
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Sale not found")
    return invoice