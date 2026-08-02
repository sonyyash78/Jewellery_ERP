from typing import List, Optional
from datetime import datetime
from sqlalchemy import Integer, String, DECIMAL, ForeignKey, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base
import enum

class InvoiceStatus(str, enum.Enum):
    DRAFT = "Draft"
    PARTIAL = "Partial"
    PAID = "Paid"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    invoice_number: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    invoice_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    subtotal: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)
    tax_amount: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)
    discount_amount: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)
    grand_total: Mapped[float] = mapped_column(DECIMAL(12, 2), default=0.0)
    status: Mapped[InvoiceStatus] = mapped_column(Enum(InvoiceStatus, values_callable=lambda obj: [e.value for e in obj]), default=InvoiceStatus.DRAFT, index=True)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"))

    customer: Mapped["Customer"] = relationship("Customer", back_populates="invoices", foreign_keys=[customer_id])
    creator: Mapped["User"] = relationship("User", back_populates="invoices", foreign_keys=[created_by])
    items: Mapped[List["InvoiceItem"]] = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    # payments relationship optional — Payment model may use a different invoice FK stack
