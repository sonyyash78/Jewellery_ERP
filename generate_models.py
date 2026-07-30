import os

models_dir = "jewellery-erp/backend/app/models"
os.makedirs(models_dir, exist_ok=True)

# Helper to write files
def write_model(filename, content):
    with open(os.path.join(models_dir, filename), "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# db base
db_dir = "jewellery-erp/backend/app/db"
os.makedirs(db_dir, exist_ok=True)
with open(os.path.join(db_dir, "base_class.py"), "w", encoding="utf-8") as f:
    f.write('''from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
''')

m_user = '''
from typing import List, Optional
from datetime import datetime
from sqlalchemy import BigInteger, String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    roles: Mapped[List["Role"]] = relationship("Role", secondary="user_roles", back_populates="users")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="creator")
    inventory_transactions: Mapped[List["InventoryTransaction"]] = relationship("InventoryTransaction", back_populates="user")
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="recorder")
    reports: Mapped[List["GeneratedReport"]] = relationship("GeneratedReport", back_populates="generator")
'''

m_role = '''
from typing import List
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)

    users: Mapped[List["User"]] = relationship("User", secondary="user_roles", back_populates="roles")
'''

m_user_role = '''
from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class UserRole(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
'''

m_customer = '''
from typing import List, Optional
from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[Optional[str]] = mapped_column(String(100))
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255))
    pan_card: Mapped[Optional[str]] = mapped_column(String(20), unique=True)
    aadhar_card: Mapped[Optional[str]] = mapped_column(String(20), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    addresses: Mapped[List["CustomerAddress"]] = relationship("CustomerAddress", back_populates="customer", cascade="all, delete-orphan")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="customer")
    exchanges: Mapped[List["Exchange"]] = relationship("Exchange", back_populates="customer")
'''

m_customer_address = '''
from typing import Optional
from sqlalchemy import BigInteger, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class CustomerAddress(Base):
    __tablename__ = "customer_addresses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("customers.id", ondelete="CASCADE"), index=True)
    address_line1: Mapped[str] = mapped_column(Text)
    address_line2: Mapped[Optional[str]] = mapped_column(Text)
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    zip_code: Mapped[str] = mapped_column(String(20))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="addresses")
'''

m_category = '''
from typing import List, Optional
from sqlalchemy import BigInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    parent_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("categories.id", ondelete="SET NULL"))

    subcategories: Mapped[List["Category"]] = relationship("Category", back_populates="parent")
    parent: Mapped[Optional["Category"]] = relationship("Category", back_populates="subcategories", remote_side=[id])
    products: Mapped[List["Product"]] = relationship("Product", back_populates="category")
'''

m_metal_type = '''
from typing import List
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class MetalType(Base):
    __tablename__ = "metal_types"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)

    purities: Mapped[List["Purity"]] = relationship("Purity", back_populates="metal_type", cascade="all, delete-orphan")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="metal_type")
    exchange_items: Mapped[List["ExchangeItem"]] = relationship("ExchangeItem", back_populates="metal_type")
'''

m_purity = '''
from typing import List
from sqlalchemy import BigInteger, String, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Purity(Base):
    __tablename__ = "purities"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    metal_type_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("metal_types.id", ondelete="CASCADE"))
    karat_name: Mapped[str] = mapped_column(String(50))
    percentage: Mapped[float] = mapped_column(DECIMAL(5, 2))

    metal_type: Mapped["MetalType"] = relationship("MetalType", back_populates="purities")
    product_variants: Mapped[List["ProductVariant"]] = relationship("ProductVariant", back_populates="purity")
    gold_rates: Mapped[List["GoldRate"]] = relationship("GoldRate", back_populates="purity")
    silver_rates: Mapped[List["SilverRate"]] = relationship("SilverRate", back_populates="purity")
'''

m_product = '''
from typing import List, Optional
from sqlalchemy import BigInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    category_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("categories.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(255))
    sku_prefix: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    metal_type_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("metal_types.id", ondelete="RESTRICT"))

    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="products")
    metal_type: Mapped["MetalType"] = relationship("MetalType", back_populates="products")
    variants: Mapped[List["ProductVariant"]] = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
'''

m_product_variant = '''
from typing import List, Optional
from sqlalchemy import BigInteger, String, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"))
    purity_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("purities.id", ondelete="RESTRICT"))
    standard_weight: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 3))
    size: Mapped[Optional[str]] = mapped_column(String(50))
    making_charge_type: Mapped[Optional[str]] = mapped_column(String(50))

    product: Mapped["Product"] = relationship("Product", back_populates="variants")
    purity: Mapped["Purity"] = relationship("Purity", back_populates="product_variants")
    inventory_items: Mapped[List["InventoryItem"]] = relationship("InventoryItem", back_populates="variant")
'''

m_warehouse = '''
from typing import List, Optional
from sqlalchemy import BigInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    location_address: Mapped[Optional[str]] = mapped_column(Text)

    inventory_items: Mapped[List["InventoryItem"]] = relationship("InventoryItem", back_populates="warehouse")
'''

m_inventory_item = '''
from typing import List
from sqlalchemy import BigInteger, String, DECIMAL, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
import enum

class InventoryStatus(str, enum.Enum):
    AVAILABLE = "Available"
    SOLD = "Sold"
    RESERVED = "Reserved"

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_variant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("product_variants.id", ondelete="RESTRICT"))
    warehouse_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("warehouses.id", ondelete="RESTRICT"))
    barcode: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    gross_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    net_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    status: Mapped[InventoryStatus] = mapped_column(Enum(InventoryStatus), default=InventoryStatus.AVAILABLE, index=True)

    variant: Mapped["ProductVariant"] = relationship("ProductVariant", back_populates="inventory_items")
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="inventory_items")
    transactions: Mapped[List["InventoryTransaction"]] = relationship("InventoryTransaction", back_populates="inventory_item", cascade="all, delete-orphan")
    invoice_items: Mapped[List["InvoiceItem"]] = relationship("InvoiceItem", back_populates="inventory_item")
'''

m_inventory_transaction = '''
from datetime import datetime
from sqlalchemy import BigInteger, Integer, ForeignKey, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
import enum

class TransactionType(str, enum.Enum):
    IN = "In"
    OUT = "Out"
    TRANSFER = "Transfer"
    ADJUSTMENT = "Adjustment"

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    inventory_item_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("inventory_items.id", ondelete="CASCADE"))
    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="RESTRICT"))

    inventory_item: Mapped["InventoryItem"] = relationship("InventoryItem", back_populates="transactions")
    user: Mapped["User"] = relationship("User", back_populates="inventory_transactions")
'''

m_gold_rate = '''
from datetime import datetime
from sqlalchemy import BigInteger, DECIMAL, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class GoldRate(Base):
    __tablename__ = "gold_rates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    purity_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("purities.id", ondelete="RESTRICT"))
    rate_per_gram: Mapped[float] = mapped_column(DECIMAL(10, 2))
    effective_datetime: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    purity: Mapped["Purity"] = relationship("Purity", back_populates="gold_rates")
    gold_calculations: Mapped[list["GoldCalculation"]] = relationship("GoldCalculation", back_populates="metal_rate")
'''

m_silver_rate = '''
from datetime import datetime
from sqlalchemy import BigInteger, DECIMAL, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class SilverRate(Base):
    __tablename__ = "silver_rates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    purity_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("purities.id", ondelete="RESTRICT"))
    rate_per_gram: Mapped[float] = mapped_column(DECIMAL(10, 2))
    effective_datetime: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    purity: Mapped["Purity"] = relationship("Purity", back_populates="silver_rates")
    silver_calculations: Mapped[list["SilverCalculation"]] = relationship("SilverCalculation", back_populates="metal_rate")
'''

m_invoice = '''
from typing import List, Optional
from datetime import datetime
from sqlalchemy import BigInteger, String, DECIMAL, ForeignKey, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
import enum

class InvoiceStatus(str, enum.Enum):
    DRAFT = "Draft"
    PAID = "Paid"
    CANCELLED = "Cancelled"

class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("customers.id", ondelete="RESTRICT"))
    invoice_number: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    invoice_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    subtotal: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)
    tax_amount: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)
    discount_amount: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)
    grand_total: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)
    status: Mapped[InvoiceStatus] = mapped_column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT, index=True)
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="RESTRICT"))

    customer: Mapped["Customer"] = relationship("Customer", back_populates="invoices")
    creator: Mapped["User"] = relationship("User", back_populates="invoices")
    items: Mapped[List["InvoiceItem"]] = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
    exchanges: Mapped[List["Exchange"]] = relationship("Exchange", back_populates="invoice")
'''

m_invoice_item = '''
from typing import Optional
from sqlalchemy import BigInteger, DECIMAL, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
import enum

class ItemType(str, enum.Enum):
    GOLD = "Gold"
    SILVER = "Silver"
    DIAMOND = "Diamond"

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    invoice_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("invoices.id", ondelete="CASCADE"))
    inventory_item_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("inventory_items.id", ondelete="RESTRICT"))
    item_type: Mapped[ItemType] = mapped_column(Enum(ItemType))
    final_price: Mapped[float] = mapped_column(DECIMAL(12, 2))

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")
    inventory_item: Mapped["InventoryItem"] = relationship("InventoryItem", back_populates="invoice_items")
    
    gold_calculation: Mapped[Optional["GoldCalculation"]] = relationship("GoldCalculation", back_populates="invoice_item", uselist=False, cascade="all, delete-orphan")
    silver_calculation: Mapped[Optional["SilverCalculation"]] = relationship("SilverCalculation", back_populates="invoice_item", uselist=False, cascade="all, delete-orphan")
'''

m_gold_calculation = '''
from sqlalchemy import BigInteger, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class GoldCalculation(Base):
    __tablename__ = "gold_calculations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    invoice_item_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("invoice_items.id", ondelete="CASCADE"), unique=True)
    metal_rate_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("gold_rates.id", ondelete="RESTRICT"))
    gross_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    stone_weight: Mapped[float] = mapped_column(DECIMAL(10, 3), default=0.0)
    net_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    making_charges_amount: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0.0)
    hallmark_charges: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0.0)
    total_gold_value: Mapped[float] = mapped_column(DECIMAL(12, 2))

    invoice_item: Mapped["InvoiceItem"] = relationship("InvoiceItem", back_populates="gold_calculation")
    metal_rate: Mapped["GoldRate"] = relationship("GoldRate", back_populates="gold_calculations")
'''

m_silver_calculation = '''
from sqlalchemy import BigInteger, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class SilverCalculation(Base):
    __tablename__ = "silver_calculations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    invoice_item_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("invoice_items.id", ondelete="CASCADE"), unique=True)
    metal_rate_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("silver_rates.id", ondelete="RESTRICT"))
    gross_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    tanch_percentage: Mapped[float] = mapped_column(DECIMAL(5, 2))
    pure_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    making_charges_amount: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0.0)
    total_silver_value: Mapped[float] = mapped_column(DECIMAL(12, 2))

    invoice_item: Mapped["InvoiceItem"] = relationship("InvoiceItem", back_populates="silver_calculation")
    metal_rate: Mapped["SilverRate"] = relationship("SilverRate", back_populates="silver_calculations")
'''

m_payment_method = '''
from typing import List
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)

    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="payment_method")
'''

m_payment = '''
from typing import Optional
from datetime import datetime
from sqlalchemy import BigInteger, String, DECIMAL, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    invoice_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("invoices.id", ondelete="CASCADE"), index=True)
    payment_method_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("payment_methods.id", ondelete="RESTRICT"))
    amount: Mapped[float] = mapped_column(DECIMAL(12, 2))
    payment_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    transaction_reference: Mapped[Optional[str]] = mapped_column(String(255))

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")
    payment_method: Mapped["PaymentMethod"] = relationship("PaymentMethod", back_populates="payments")
'''

m_exchange = '''
from typing import List, Optional
from datetime import datetime
from sqlalchemy import BigInteger, DECIMAL, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Exchange(Base):
    __tablename__ = "exchanges"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("customers.id", ondelete="RESTRICT"), index=True)
    invoice_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("invoices.id", ondelete="SET NULL"))
    exchange_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    total_exchange_value: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="exchanges")
    invoice: Mapped[Optional["Invoice"]] = relationship("Invoice", back_populates="exchanges")
    items: Mapped[List["ExchangeItem"]] = relationship("ExchangeItem", back_populates="exchange", cascade="all, delete-orphan")
'''

m_exchange_item = '''
from sqlalchemy import BigInteger, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class ExchangeItem(Base):
    __tablename__ = "exchange_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    exchange_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("exchanges.id", ondelete="CASCADE"))
    metal_type_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("metal_types.id", ondelete="RESTRICT"))
    gross_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    purity_assessed: Mapped[float] = mapped_column(DECIMAL(5, 2))
    net_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    rate_applied: Mapped[float] = mapped_column(DECIMAL(10, 2))
    calculated_value: Mapped[float] = mapped_column(DECIMAL(12, 2))

    exchange: Mapped["Exchange"] = relationship("Exchange", back_populates="items")
    metal_type: Mapped["MetalType"] = relationship("MetalType", back_populates="exchange_items")
'''

m_expense_category = '''
from typing import List
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True)

    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="category")
'''

m_expense = '''
from typing import Optional
from datetime import datetime
from sqlalchemy import BigInteger, DECIMAL, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    expense_category_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("expense_categories.id", ondelete="RESTRICT"))
    amount: Mapped[float] = mapped_column(DECIMAL(12, 2))
    expense_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    recorded_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="RESTRICT"))

    category: Mapped["ExpenseCategory"] = relationship("ExpenseCategory", back_populates="expenses")
    recorder: Mapped["User"] = relationship("User", back_populates="expenses")
'''

m_generated_report = '''
from typing import Optional
from datetime import datetime
from sqlalchemy import BigInteger, String, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    report_name: Mapped[str] = mapped_column(String(255))
    report_type: Mapped[str] = mapped_column(String(100), index=True)
    generated_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="RESTRICT"))
    generated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    s3_file_url: Mapped[Optional[str]] = mapped_column(Text)

    generator: Mapped["User"] = relationship("User", back_populates="reports")
'''

m_system_setting = '''
from typing import Optional
from sqlalchemy import BigInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    setting_key: Mapped[str] = mapped_column(String(100), unique=True)
    setting_value: Mapped[str] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(String(255))
'''

m_tax_configuration = '''
from sqlalchemy import BigInteger, String, DECIMAL, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class TaxConfiguration(Base):
    __tablename__ = "tax_configurations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    tax_name: Mapped[str] = mapped_column(String(100), unique=True)
    percentage: Mapped[float] = mapped_column(DECIMAL(5, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
'''

m_number_sequence = '''
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class NumberSequence(Base):
    __tablename__ = "number_sequences"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    entity: Mapped[str] = mapped_column(String(100), unique=True)
    prefix: Mapped[str] = mapped_column(String(50))
    next_number: Mapped[int] = mapped_column(BigInteger, default=1)
'''

init_file = """
from .user import User
from .role import Role
from .user_role import UserRole
from .customer import Customer
from .customer_address import CustomerAddress
from .category import Category
from .metal_type import MetalType
from .purity import Purity
from .product import Product
from .product_variant import ProductVariant
from .warehouse import Warehouse
from .inventory_item import InventoryItem
from .inventory_transaction import InventoryTransaction
from .gold_rate import GoldRate
from .silver_rate import SilverRate
from .invoice import Invoice
from .invoice_item import InvoiceItem
from .gold_calculation import GoldCalculation
from .silver_calculation import SilverCalculation
from .payment_method import PaymentMethod
from .payment import Payment
from .exchange import Exchange
from .exchange_item import ExchangeItem
from .expense_category import ExpenseCategory
from .expense import Expense
from .generated_report import GeneratedReport
from .system_setting import SystemSetting
from .tax_configuration import TaxConfiguration
from .number_sequence import NumberSequence
"""

write_model("user.py", m_user)
write_model("role.py", m_role)
write_model("user_role.py", m_user_role)
write_model("customer.py", m_customer)
write_model("customer_address.py", m_customer_address)
write_model("category.py", m_category)
write_model("metal_type.py", m_metal_type)
write_model("purity.py", m_purity)
write_model("product.py", m_product)
write_model("product_variant.py", m_product_variant)
write_model("warehouse.py", m_warehouse)
write_model("inventory_item.py", m_inventory_item)
write_model("inventory_transaction.py", m_inventory_transaction)
write_model("gold_rate.py", m_gold_rate)
write_model("silver_rate.py", m_silver_rate)
write_model("invoice.py", m_invoice)
write_model("invoice_item.py", m_invoice_item)
write_model("gold_calculation.py", m_gold_calculation)
write_model("silver_calculation.py", m_silver_calculation)
write_model("payment_method.py", m_payment_method)
write_model("payment.py", m_payment)
write_model("exchange.py", m_exchange)
write_model("exchange_item.py", m_exchange_item)
write_model("expense_category.py", m_expense_category)
write_model("expense.py", m_expense)
write_model("generated_report.py", m_generated_report)
write_model("system_setting.py", m_system_setting)
write_model("tax_configuration.py", m_tax_configuration)
write_model("number_sequence.py", m_number_sequence)
write_model("__init__.py", init_file)

print("All SQLAlchemy models generated successfully.")
