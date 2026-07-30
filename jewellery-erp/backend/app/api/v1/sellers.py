from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.seller import Seller
from app.schemas.seller import SellerCreate, SellerUpdate, SellerResponse

router = APIRouter()

@router.post("/", response_model=SellerResponse)
def create_seller(seller_in: SellerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_seller = Seller(**seller_in.model_dump())
    db.add(db_seller)
    db.commit()
    db.refresh(db_seller)
    return db_seller

@router.get("/", response_model=Dict[str, Any])
def list_sellers(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1), search: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Seller).filter(Seller.is_active == True)
    if search:
        query = query.filter(Seller.name.ilike(f"%{search}%") | Seller.mobile.ilike(f"%{search}%"))
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    total_outstanding = sum(s.outstanding_balance for s in db.query(Seller).all())
    
    # Convert items to SellerResponse
    items_data = [SellerResponse.model_validate(item) for item in items]
    return {"total": total, "items": items_data, "total_outstanding": total_outstanding}

@router.get("/{seller_id}", response_model=SellerResponse)
def get_seller(seller_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    seller = db.query(Seller).filter(Seller.id == seller_id, Seller.is_active == True).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return seller

@router.put("/{seller_id}", response_model=SellerResponse)
def update_seller(seller_id: int, seller_in: SellerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    seller = db.query(Seller).filter(Seller.id == seller_id, Seller.is_active == True).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = seller_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(seller, key, value)
        
    db.commit()
    db.refresh(seller)
    return seller

@router.get("/{seller_id}/ledger")
def get_supplier_ledger(seller_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.supplier_ledger import SupplierLedger
    entries = db.query(SupplierLedger).filter(SupplierLedger.seller_id == seller_id).order_by(SupplierLedger.date.desc(), SupplierLedger.id.desc()).all()
    return entries

from fastapi import HTTPException

@router.post("/{seller_id}/ledger")
def add_supplier_ledger_entry(
    seller_id: int, 
    entry: Dict[str, Any], 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    from app.models.supplier_ledger import SupplierLedger
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    debit = float(entry.get('debit', 0)) # We pay them
    credit = float(entry.get('credit', 0)) # We buy from them
    
    # Update balance: Outstanding = Old Outstanding + Credit (Purchase) - Debit (Payment)
    seller.outstanding_balance = float(seller.outstanding_balance or 0) + credit - debit
    
    ledger = SupplierLedger(
        seller_id=seller_id,
        voucher_type=entry.get('voucher_type', 'Manual'),
        voucher_number=entry.get('voucher_number'),
        description=entry.get('description'),
        debit=debit,
        credit=credit,
        balance=seller.outstanding_balance
    )
    
    db.add(ledger)
    db.commit()
    db.refresh(ledger)
    db.refresh(seller)
    
    return {"ledger": ledger, "new_balance": seller.outstanding_balance}
