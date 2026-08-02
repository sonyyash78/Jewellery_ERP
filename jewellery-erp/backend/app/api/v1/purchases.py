from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from decimal import Decimal
from app.db.database import get_db
from app.repositories.transaction_repo import gold_purchase_repo, silver_purchase_repo
from app.schemas.purchases import GoldPurchaseCreate, GoldPurchaseResponse, SilverPurchaseCreate, SilverPurchaseResponse, UnifiedPurchaseCreate, PurchaseItemInput
from app.services.calculation_service import CalculationService
from app.models.purchase import Purchase, PurchaseStatus
from app.models.purchase_item import PurchaseItem
from app.models.seller import Seller
from app.models.user import User
from app.models.gold_rate import GoldRate
from app.models.silver_rate import SilverRate
from datetime import datetime
from app.api.dependencies import get_current_user

router = APIRouter()

def get_or_create_seller(db: Session, seller_info: 'SellerInfo'):
    """Get existing seller by mobile or create a new one."""
    existing = db.query(Seller).filter(Seller.mobile == seller_info.mobile).first()
    if existing:
        return existing
    seller = Seller(
        name=seller_info.name,
        mobile=seller_info.mobile,
        address=seller_info.address,
        city=seller_info.address.split(',')[0] if seller_info.address else None,
        gst_number=seller_info.aadhaar_pan,
        outstanding_balance=0,
        is_active=True
    )
    db.add(seller)
    db.flush()
    return seller

@router.post("/", response_model=dict)
def create_unified_purchase(
    purchase_in: UnifiedPurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a unified purchase with seller info and items array. Backend recalculates all totals."""
    
    # Get or create seller
    if purchase_in.seller_id:
        seller = db.query(Seller).filter(Seller.id == purchase_in.seller_id).first()
        if not seller:
            raise HTTPException(status_code=404, detail="Seller not found")
    elif purchase_in.seller:
        seller = get_or_create_seller(db, purchase_in.seller)
    else:
        raise HTTPException(status_code=400, detail="Seller information is required")
    
    # Recalculate all totals from items using CalculationService
    purchase_taxable = Decimal('0')
    purchase_cgst = Decimal('0')
    purchase_sgst = Decimal('0')
    purchase_igst = Decimal('0')
    
    # Determine state for GST
    is_same_state = True  # TODO: Get from settings or seller
    gst_rate = Decimal('3')  # Default GST for jewellery
    
    # Create purchase record first
    db_purchase = Purchase(
        purchase_number=f"PUR-{int(datetime.now().timestamp() * 1000) % 1000000}",
        seller_id=seller.id,
        created_by_id=current_user.id,
        total_taxable=0,  # Will update after items
        cgst=0,
        sgst=0,
        igst=0,
        grand_total=0,
        status=PurchaseStatus[purchase_in.status] if purchase_in.status in ['COMPLETED', 'DRAFT', 'CANCELLED'] else PurchaseStatus.COMPLETED
    )
    db.add(db_purchase)
    db.flush()
    
    # Process each item and recalculate
    for item_in in purchase_in.items:
        # Use the metal rate provided by the frontend (negotiated rate)
        metal_rate = Decimal(str(item_in.metal_rate))
        
        # Use CalculationService for purchase calculation
        calc_result = CalculationService.calculate_purchase(
            gross_weight=Decimal(str(item_in.gross_weight)),
            stone_weight=Decimal(str(item_in.stone_weight)),
            purity=Decimal(str(item_in.touch_purity)),
            metal_rate=metal_rate,
            labour=Decimal(str(item_in.labour_charge)),
            making=Decimal('0'),
            hallmark=Decimal(str(item_in.hallmark_charge)),
            testing=Decimal(str(item_in.testing_melting_charge)),
            other=Decimal(str(item_in.other_charges)),
            discount=Decimal(str(item_in.discount)),
            gst_rate=gst_rate,
            is_same_state=is_same_state
        )
        
        # Create item with calculated values
        db_item = PurchaseItem(
            purchase_id=db_purchase.id,
            metal_type=item_in.metal_type,
            item_name=item_in.item_name,
            category=item_in.category,
            gross_weight=item_in.gross_weight,
            stone_weight=item_in.stone_weight,
            net_weight=float(calc_result['net_weight']),
            touch_purity=item_in.touch_purity,
            wastage=item_in.wastage,
            fine_weight=float(calc_result['fine_weight']),
            metal_rate=float(metal_rate),
            metal_value=float(calc_result['metal_value']),
            labour_charge=item_in.labour_charge,
            testing_melting_charge=item_in.testing_melting_charge,
            hallmark_charge=item_in.hallmark_charge,
            other_charges=item_in.other_charges,
            discount=item_in.discount,
            taxable_amount=float(calc_result['taxable'])
        )
        db.add(db_item)
        
        # Accumulate totals
        purchase_taxable += calc_result['taxable']
        purchase_cgst += calc_result['cgst']
        purchase_sgst += calc_result['sgst']
        purchase_igst += calc_result['igst']
    
    # Update purchase totals
    purchase_grand_total = purchase_taxable + purchase_cgst + purchase_sgst + purchase_igst
    db_purchase.total_taxable = float(purchase_taxable)
    db_purchase.cgst = float(purchase_cgst)
    db_purchase.sgst = float(purchase_sgst)
    db_purchase.igst = float(purchase_igst)
    db_purchase.grand_total = float(purchase_grand_total)
    
    # Update seller outstanding balance (We owe them)
    seller.outstanding_balance = float(seller.outstanding_balance or 0) + float(purchase_grand_total)
    
    # Create supplier ledger entry for the purchase
    from app.models.supplier_ledger import SupplierLedger
    ledger_entry = SupplierLedger(
        seller_id=seller.id,
        voucher_type='Purchase',
        voucher_number=db_purchase.purchase_number,
        description=f"Purchase {db_purchase.purchase_number}",
        debit=0,
        credit=float(purchase_grand_total),
        balance=seller.outstanding_balance
    )
    db.add(ledger_entry)
    
    # Process payment if any amount was paid
    amount_paid = float(purchase_in.amount_paid or 0)
    if amount_paid > 0:
        seller.outstanding_balance -= amount_paid
        payment_entry = SupplierLedger(
            seller_id=seller.id,
            voucher_type='Payment',
            voucher_number=f"PAY-{db_purchase.purchase_number}",
            description=f"Payment for Purchase {db_purchase.purchase_number}",
            debit=amount_paid,
            credit=0,
            balance=seller.outstanding_balance
        )
        db.add(payment_entry)
    
    db.commit()
    db.refresh(db_purchase)
    
    return {"message": "Purchase saved", "purchase_number": db_purchase.purchase_number}

@router.get("/", response_model=List[GoldPurchaseResponse])
def get_purchases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get all gold purchases (legacy endpoint). Auth required."""
    return gold_purchase_repo.get_multi(db, skip=skip, limit=limit)

@router.get("/history")
def get_unified_purchases_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all unified purchases."""
    query = db.query(Purchase)
    total = query.count()
    items = query.order_by(Purchase.id.desc()).offset(skip).limit(limit).all()
    
    # We need to construct a basic dictionary response that matches the invoice history structure somewhat
    results = []
    for p in items:
        results.append({
            "id": p.id,
            "invoice_number": p.purchase_number,
            "invoice_date": p.created_at,
            "grand_total": p.grand_total,
            "status": p.status,
            "customer": {
                "first_name": p.seller.name if p.seller else 'Unknown',
                "last_name": '',
                "phone_number": p.seller.mobile if p.seller else ''
            }
        })
    return {"total": total, "items": results}

@router.get("/{id}/pdf-data")
def get_purchase_pdf_data(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get purchase data formatted for PDF generation."""
    try:
        from app.services.invoice_pdf_service import InvoicePDFService
        return InvoicePDFService.get_purchase_pdf_data(id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{id}")
def get_unified_purchase(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single unified purchase formatted for the Invoice View Modal."""
    purchase = db.query(Purchase).filter(Purchase.id == id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    return {
        "id": purchase.id,
        "invoice_number": purchase.purchase_number,
        "customer": {
            "first_name": purchase.seller.name if purchase.seller else "Unknown",
            "last_name": "",
            "phone_number": purchase.seller.mobile if purchase.seller else ""
        },
        "items": [
            {
                "item_name": item.item_name,
                "item_type": item.metal_type,
                "final_price": item.metal_value + item.labour_charge + item.testing_melting_charge + item.hallmark_charge + item.other_charges - item.discount
            }
            for item in purchase.items
        ],
        "subtotal": purchase.total_taxable,
        "tax_amount": purchase.cgst + purchase.sgst + purchase.igst,
        "discount_amount": sum(i.discount for i in purchase.items),
        "grand_total": purchase.grand_total
    }


@router.delete("/{id}")
def delete_unified_purchase(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete (cancel) a unified purchase."""
    purchase = db.query(Purchase).filter(Purchase.id == id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    purchase.status = PurchaseStatus.CANCELLED
    db.commit()
    return {"message": "Purchase cancelled successfully"}

@router.get("/gold", response_model=List[GoldPurchaseResponse])
def get_gold_purchases(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return gold_purchase_repo.get_multi(db, skip=skip, limit=limit)

@router.get("/gold/{id}", response_model=GoldPurchaseResponse)
def get_gold_purchase(
    id: int,
    db: Session = Depends(get_db)
) -> Any:
    purchase = gold_purchase_repo.get(db=db, id=id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Gold purchase not found")
    return purchase

@router.post("/gold", response_model=GoldPurchaseResponse)
def create_gold_purchase(
    *,
    db: Session = Depends(get_db),
    purchase_in: GoldPurchaseCreate
) -> Any:
    # Check for duplicate invoice number
    existing = gold_purchase_repo.get_by_invoice(db, invoice_number=purchase_in.invoice_number)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A gold purchase with this invoice number already exists.",
        )
    return gold_purchase_repo.create(db=db, obj_in=purchase_in)

@router.get("/silver", response_model=List[SilverPurchaseResponse])
def get_silver_purchases(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return silver_purchase_repo.get_multi(db, skip=skip, limit=limit)

@router.get("/silver/{id}", response_model=SilverPurchaseResponse)
def get_silver_purchase(
    id: int,
    db: Session = Depends(get_db)
) -> Any:
    purchase = silver_purchase_repo.get(db=db, id=id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Silver purchase not found")
    return purchase

@router.post("/silver", response_model=SilverPurchaseResponse)
def create_silver_purchase(
    *,
    db: Session = Depends(get_db),
    purchase_in: SilverPurchaseCreate
) -> Any:
    # Check for duplicate invoice number
    existing = silver_purchase_repo.get_by_invoice(db, invoice_number=purchase_in.invoice_number)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A silver purchase with this invoice number already exists.",
        )
    
    # Validate using CalculationService (no longer using old PurchaseService)
    # The calculation is already done by frontend, we just validate
    net_weight = Decimal(str(purchase_in.weight)) * (Decimal(str(purchase_in.final_tanch)) / Decimal('100'))
    expected_recovered = CalculationService._round_final(net_weight, CalculationService.WEIGHT_PLACES)
    
    if abs(Decimal(str(purchase_in.recovered_silver)) - expected_recovered) > Decimal('0.01'):
        raise HTTPException(status_code=400, detail="Invalid silver calculation")
        
    return silver_purchase_repo.create(db=db, obj_in=purchase_in)
