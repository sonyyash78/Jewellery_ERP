from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from decimal import Decimal

from app.db.database import get_db
from app.repositories.crm_repo import customer_repo
from app.schemas.crm import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse
from app.models.crm import Customer

router = APIRouter()


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
