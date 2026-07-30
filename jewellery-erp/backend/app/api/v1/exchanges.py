from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.exchange import Exchange
from app.models.exchange_item import ExchangeItem
from app.models.exchange_new_item import ExchangeNewItem
from app.models.stock_item import StockItem
from app.models.customer import Customer
from app.models.customer_ledger import CustomerLedger
from app.schemas.exchange import ExchangeCreate, ExchangeResponse
import logging

router = APIRouter()

@router.post("/", response_model=ExchangeResponse)
def create_exchange(
    exchange_in: ExchangeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify customer
    customer = db.query(Customer).filter(Customer.id == exchange_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Verify all stock items
    stock_ids = [item.stock_item_id for item in exchange_in.new_items]
    stock_items = db.query(StockItem).filter(StockItem.id.in_(stock_ids)).all()
    if len(stock_items) != len(stock_ids):
        raise HTTPException(status_code=400, detail="One or more stock items not found")
        
    for item in stock_items:
        if item.status.lower() == 'sold':
            raise HTTPException(status_code=400, detail=f"Stock item {item.item_code} is already sold")

    # Create Exchange
    exchange = Exchange(
        customer_id=exchange_in.customer_id,
        total_old_value=exchange_in.total_old_value,
        total_new_value=exchange_in.total_new_value,
        gst_amount=exchange_in.gst_amount,
        grand_total=exchange_in.grand_total,
        difference_amount=exchange_in.difference_amount
    )
    db.add(exchange)
    db.flush() # get ID

    # Add old items
    for old_item_in in exchange_in.old_items:
        db_old_item = ExchangeItem(
            exchange_id=exchange.id,
            **old_item_in.model_dump()
        )
        db.add(db_old_item)

    # Add new items & update stock status
    for new_item_in in exchange_in.new_items:
        db_new_item = ExchangeNewItem(
            exchange_id=exchange.id,
            **new_item_in.model_dump()
        )
        db.add(db_new_item)
        
        # Mark as sold
        stock = next(s for s in stock_items if s.id == new_item_in.stock_item_id)
        stock.status = "Sold"

    # Update Customer Ledger for the difference
    if exchange.difference_amount != 0:
        debit = exchange.difference_amount if exchange.difference_amount > 0 else 0
        credit = abs(exchange.difference_amount) if exchange.difference_amount < 0 else 0
        
        customer.outstanding_balance = float(customer.outstanding_balance or 0) + debit - credit
        
        ledger = CustomerLedger(
            customer_id=customer.id,
            voucher_type="Exchange",
            voucher_number=f"EXC-{exchange.id}",
            description="Exchange Difference Settlement",
            debit=debit,
            credit=credit,
            balance=customer.outstanding_balance
        )
        db.add(ledger)

    db.commit()
    db.refresh(exchange)
    return exchange

@router.get("/", response_model=Dict[str, Any])
def list_exchanges(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Exchange)
    total = query.count()
    items = query.order_by(Exchange.id.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "items": items}
