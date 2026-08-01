from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from decimal import Decimal

from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.repositories.crm_repo import customer_repo
from app.schemas.crm import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse
from app.models.crm import Customer
from app.models.customer_ledger import CustomerLedger

router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/", response_model=CustomerListResponse)
def get_customers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
) -> Any:
    query = db.query(Customer)
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Customer.first_name.ilike(like),
                Customer.last_name.ilike(like),
                Customer.phone_number.ilike(like),
                Customer.city.ilike(like),
            )
        )
    total = query.count()
    items = query.order_by(Customer.id.desc()).offset(skip).limit(limit).all()
    total_outstanding = db.query(Customer).with_entities(
        Customer.outstanding_balance
    ).all()
    outstanding_sum = sum((row[0] or Decimal("0")) for row in total_outstanding)
    return {
        "total": total,
        "total_outstanding": outstanding_sum,
        "items": items,
    }


@router.post("/", response_model=CustomerResponse)
def create_customer(
    *,
    db: Session = Depends(get_db),
    customer_in: CustomerCreate
) -> Any:
    customer = customer_repo.get_by_phone(db, phone=customer_in.phone_number)
    if customer:
        raise HTTPException(
            status_code=400,
            detail="A customer with this mobile number already exists.",
        )
    return customer_repo.create(db=db, obj_in=customer_in)


@router.get("/{id}", response_model=CustomerResponse)
def get_customer(
    id: int,
    db: Session = Depends(get_db)
) -> Any:
    customer = customer_repo.get(db=db, id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{id}", response_model=CustomerResponse)
def update_customer(
    *,
    db: Session = Depends(get_db),
    id: int,
    customer_in: CustomerUpdate
) -> Any:
    customer = customer_repo.get(db=db, id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer_repo.update(db=db, db_obj=customer, obj_in=customer_in)


@router.delete("/{id}")
def delete_customer(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    customer = customer_repo.get(db=db, id=id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer_repo.remove(db=db, id=id)
    return {"ok": True}


@router.get("/{id}/ledger")
def get_customer_ledger(
    id: int, 
    db: Session = Depends(get_db)
):
    entries = db.query(CustomerLedger).filter(CustomerLedger.customer_id == id).order_by(CustomerLedger.date.desc(), CustomerLedger.id.desc()).all()
    return entries


@router.post("/{id}/ledger")
def add_customer_ledger_entry(
    id: int, 
    entry: Dict[str, Any], 
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    debit = float(entry.get('debit') or 0) # Customer owes us (e.g. Bill)
    credit = float(entry.get('credit') or 0) # Customer paid us (e.g. Cash received)
    
    # Update balance: Outstanding = Old Outstanding + Debit (Bill) - Credit (Payment)
    # Wait, if they owe us, outstanding increases. If they pay us, outstanding decreases.
    customer.outstanding_balance = float(customer.outstanding_balance or 0) + debit - credit
    
    ledger = CustomerLedger(
        customer_id=id,
        voucher_type=entry.get('voucher_type', 'Manual'),
        voucher_number=entry.get('voucher_number'),
        description=entry.get('description'),
        debit=debit,
        credit=credit,
        balance=customer.outstanding_balance
    )
    
    db.add(ledger)
    db.commit()
    db.refresh(ledger)
    db.refresh(customer)
    
    return {"ledger": ledger, "new_balance": customer.outstanding_balance}
