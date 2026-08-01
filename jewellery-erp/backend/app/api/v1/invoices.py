from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from datetime import date, datetime

from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_item import InvoiceItem
from app.models.gold_calculation import GoldCalculation
from app.models.silver_calculation import SilverCalculation
from app.models.gold_rate import GoldRate
from app.models.silver_rate import SilverRate
from app.models.customer import Customer
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, GoldCalcCreate, SilverCalcCreate
from app.services.calculation_service import CalculationService
from app.services.invoice_pdf_service import InvoicePDFService

router = APIRouter()

def generate_invoice_number(db: Session) -> str:
    """
    Generate unique invoice number.
    Format: INV-YYYYMMDD-XXXX
    """
    today = datetime.now().strftime('%Y%m%d')
    
    # Count invoices created today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    count = db.query(Invoice).filter(Invoice.invoice_date >= today_start).count()
    
    return f"INV-{today}-{str(count + 1).zfill(4)}"

@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Validate customer exists if provided
    if invoice_in.customer_id is not None:
        customer = db.query(Customer).filter(Customer.id == invoice_in.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=404,
                detail=f"Customer with id {invoice_in.customer_id} not found"
            )
    
    # 2. Validate tax calculation
    calculated_subtotal = sum(item.final_price for item in invoice_in.items)
    calculated_grand_total = calculated_subtotal + invoice_in.tax_amount - invoice_in.discount_amount
    
    # Allow small floating point differences (< 0.01)
    if abs(calculated_subtotal - invoice_in.subtotal) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid subtotal: expected {calculated_subtotal:.2f}, got {invoice_in.subtotal:.2f}"
        )
    
    # Allow up to 1.0 difference for round off
    if abs(calculated_grand_total - invoice_in.grand_total) > 1.0:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid grand_total: expected {calculated_grand_total:.2f}, got {invoice_in.grand_total:.2f}"
        )
    
    try:
        # 3. Create Invoice
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
        
        # 4. Create Items
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
            
            # 5. Create Specific Calculations using CalculationService
            if item_in.gold_calculation:
                calc_in = item_in.gold_calculation
                
                # Validate gold calculation fields
                if calc_in.gross_weight < 0:
                    raise HTTPException(
                        status_code=400,
                        detail="Gross weight cannot be negative"
                    )
                if calc_in.net_weight < 0:
                    raise HTTPException(
                        status_code=400,
                        detail="Net weight cannot be negative"
                    )
                if calc_in.net_weight > calc_in.gross_weight:
                    raise HTTPException(
                        status_code=400,
                        detail="Net weight cannot exceed gross weight"
                    )
                if calc_in.stone_weight < 0:
                    calc_in.stone_weight = 0.0
                
                # Use calculation service for selling calculation
                calc_result = CalculationService.calculate_selling(
                    net_weight=Decimal(str(calc_in.net_weight)),
                    metal_rate=Decimal(str(calc_in.applied_rate)),
                    making_rate=Decimal(str(calc_in.making_charges_amount)),
                    making_type='FIXED',
                    hallmark=Decimal(str(calc_in.hallmark_charges)),
                    other=Decimal('0'),
                    discount=Decimal('0'),
                    gst_rate=Decimal('3')
                )
                
                db_gold = GoldCalculation(
                    invoice_item_id=db_item.id,
                    metal_rate_id=calc_in.metal_rate_id,
                    applied_rate=calc_in.applied_rate,
                    gross_weight=calc_in.gross_weight,
                    stone_weight=calc_in.stone_weight,
                    net_weight=calc_in.net_weight,
                    making_charges_amount=float(calc_result['making_charge']),
                    hallmark_charges=calc_in.hallmark_charges,
                    total_gold_value=float(calc_result['metal_value'])
                )
                db.add(db_gold)
                
            elif item_in.silver_calculation:
                calc_in = item_in.silver_calculation
                
                # Validate silver calculation fields
                if calc_in.gross_weight < 0:
                    raise HTTPException(
                        status_code=400,
                        detail="Gross weight cannot be negative"
                    )
                if calc_in.net_weight < 0:
                    raise HTTPException(
                        status_code=400,
                        detail="Net weight cannot be negative"
                    )
                if calc_in.net_weight > calc_in.gross_weight:
                    raise HTTPException(
                        status_code=400,
                        detail="Net weight cannot exceed gross weight"
                    )
                
                # Use calculation service
                calc_result = CalculationService.calculate_selling(
                    net_weight=Decimal(str(calc_in.net_weight)),
                    metal_rate=Decimal(str(calc_in.applied_rate)),
                    making_rate=Decimal(str(calc_in.making_charges_amount)),
                    making_type='FIXED',
                    hallmark=Decimal('0'),
                    other=Decimal('0'),
                    discount=Decimal('0'),
                    gst_rate=Decimal('3')
                )
                
                # Calculate tanch percentage
                pure_weight = calc_in.net_weight
                tanch_percentage = (
                    (pure_weight / calc_in.gross_weight * 100.0) if calc_in.gross_weight else 0.0
                )
                
                db_silver = SilverCalculation(
                    invoice_item_id=db_item.id,
                    metal_rate_id=calc_in.metal_rate_id,
                    applied_rate=calc_in.applied_rate,
                    gross_weight=calc_in.gross_weight,
                    tanch_percentage=tanch_percentage,
                    pure_weight=pure_weight,
                    making_charges_amount=float(calc_result['making_charge']),
                    total_silver_value=float(calc_result['metal_value'])
                )
                db.add(db_silver)
            
            # 6. Mark StockItem as Sold if this was a scanned item
            if hasattr(item_in, 'stock_item_id') and item_in.stock_item_id:
                from app.models.stock_item import StockItem
                stock_item = db.query(StockItem).filter(StockItem.id == item_in.stock_item_id).first()
                if stock_item:
                    stock_item.status = "Sold"
                
        db.commit()
        db.refresh(db_invoice)
        return db_invoice
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/", response_model=List[InvoiceResponse])
def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    customer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List invoices with search, filter, and pagination.
    
    - search: Search by invoice number or customer name
    - status: Filter by status (Draft, Paid, Cancelled)
    - start_date: Filter from date
    - end_date: Filter to date
    - customer_id: Filter by customer
    """
    query = db.query(Invoice)
    
    # Search filter
    if search:
        query = query.join(Customer).filter(
            (Invoice.invoice_number.ilike(f"%{search}%")) |
            (Customer.name.ilike(f"%{search}%"))
        )
    
    # Status filter
    if status:
        query = query.filter(Invoice.status == status)
    
    # Date range filter
    if start_date:
        query = query.filter(Invoice.invoice_date >= start_date)
    if end_date:
        query = query.filter(Invoice.invoice_date <= end_date)
    
    # Customer filter
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and order
    invoices = query.order_by(Invoice.invoice_date.desc()).offset(skip).limit(limit).all()
    
    return invoices

@router.get("/{id}", response_model=InvoiceResponse)
def get_invoice(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single invoice by ID with all details."""
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.delete("/{id}")
def delete_invoice(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete invoice (soft delete - mark as cancelled)."""
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Soft delete - change status to Cancelled
    invoice.status = InvoiceStatus.CANCELLED
    db.commit()
    
    return {"message": "Invoice cancelled successfully"}

from pydantic import BaseModel
class LinkCustomerRequest(BaseModel):
    customer_id: int

@router.patch("/{id}/customer", response_model=InvoiceResponse)
def link_customer_to_invoice(
    id: int,
    req: LinkCustomerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Link an existing invoice to a customer."""
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer with id {req.customer_id} not found")
        
    invoice.customer_id = req.customer_id
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/stats/summary")
def get_invoice_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoice statistics for dashboard."""
    from sqlalchemy import func
    
    total_invoices = db.query(Invoice).count()
    total_paid = db.query(Invoice).filter(Invoice.status == InvoiceStatus.PAID).count()
    total_draft = db.query(Invoice).filter(Invoice.status == InvoiceStatus.DRAFT).count()
    
    total_revenue = db.query(func.sum(Invoice.grand_total)).filter(
        Invoice.status == InvoiceStatus.PAID
    ).scalar() or 0
    
    return {
        "total_invoices": total_invoices,
        "total_paid": total_paid,
        "total_draft": total_draft,
        "total_revenue": float(total_revenue)
    }

@router.get("/{id}/pdf-data")
def get_invoice_pdf_data(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoice data formatted for PDF generation."""
    try:
        return InvoicePDFService.get_invoice_pdf_data(id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
