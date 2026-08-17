import sys
import os
from dotenv import load_dotenv

# Add the backend path so we can import app modules
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, '.env'))

from app.db.database import SessionLocal
from app.api.v1.invoices import list_invoices
from app.api.v1.exchanges import list_exchanges

db = SessionLocal()
try:
    print("Testing list_invoices...")
    invoices = list_invoices(skip=0, limit=10, search=None, status=None, start_date=None, end_date=None, customer_id=None, db=db, current_user=None)
    print(f"Found {len(invoices)} invoices")
except Exception as e:
    import traceback
    print("Error in list_invoices:")
    traceback.print_exc()

try:
    print("Testing list_exchanges...")
    exchanges = list_exchanges(skip=0, limit=10, db=db, current_user=None)
    print(f"Found {len(exchanges.get('items', []))} exchanges")
except Exception as e:
    import traceback
    print("Error in list_exchanges:")
    traceback.print_exc()

db.close()
