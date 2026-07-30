import os

backend_dir = "C:/Users/yashs/Documents/One Drive/OneDrive/Desktop/Saideep/jewellery-erp/backend/app"

def write_file(path, content):
    full_path = os.path.join(backend_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

c_dashboard_api = '''
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.models.expense import Expense
from app.models.inventory_item import InventoryItem

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    
    # SQLite datetime func.date() works, for MySQL it's func.date()
    invoices_today = db.query(Invoice).filter(func.date(Invoice.invoice_date) == today).all()
    today_sales = sum([float(i.grand_total) for i in invoices_today])
    today_bills = len(invoices_today)
    
    expenses_today = db.query(Expense).filter(func.date(Expense.expense_date) == today).all()
    today_purchases = sum([float(e.amount) for e in expenses_today])
    
    today_profit = today_sales - today_purchases
    
    total_customers = db.query(Customer).filter(Customer.is_deleted == False).count()
    
    inventory_items = db.query(InventoryItem).filter(InventoryItem.status == 'Available').all()
    inventory_value = sum([float(i.gross_weight) * 5000 for i in inventory_items]) # Assuming avg 5000/g

    low_stock = 0

    return {
        "today_sales": today_sales,
        "today_bills": today_bills,
        "today_purchases": today_purchases,
        "today_profit": today_profit,
        "total_customers": total_customers,
        "inventory_value": inventory_value,
        "low_stock_count": low_stock
    }

@router.get("/recent-activity")
def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recent_bills = db.query(Invoice).order_by(Invoice.invoice_date.desc()).limit(5).all()
    recent_purchases = db.query(Expense).order_by(Expense.expense_date.desc()).limit(5).all()
    
    bills = [{"id": b.id, "invoice_number": b.invoice_number, "date": b.invoice_date, "amount": float(b.grand_total)} for b in recent_bills]
    purchases = [{"id": p.id, "description": p.description or "Purchase", "date": p.expense_date, "amount": float(p.amount)} for p in recent_purchases]
    
    return {
        "recent_bills": bills,
        "recent_purchases": purchases
    }
'''

write_file("api/v1/dashboard.py", c_dashboard_api)
print("Dashboard backend created.")
