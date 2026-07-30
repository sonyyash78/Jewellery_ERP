from sqlalchemy import Integer, String, DECIMAL, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from app.db.base_class import Base
from datetime import datetime
import enum

class PurchaseStatus(str, enum.Enum):
    COMPLETED = 'Completed'
    DRAFT = 'Draft'
    CANCELLED = 'Cancelled'

class Purchase(Base):
    __tablename__ = 'purchases'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    purchase_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    seller_id: Mapped[int] = mapped_column(Integer, ForeignKey('sellers.id'))
    created_by_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    total_taxable: Mapped[float] = mapped_column(DECIMAL(12, 2))
    cgst: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0)
    sgst: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0)
    igst: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0)
    grand_total: Mapped[float] = mapped_column(DECIMAL(12, 2))
    status: Mapped[PurchaseStatus] = mapped_column(Enum(PurchaseStatus), default=PurchaseStatus.COMPLETED)
    
    seller: Mapped['Seller'] = relationship('Seller', back_populates='purchases')
    created_by: Mapped['User'] = relationship('User')
    items: Mapped[List['PurchaseItem']] = relationship('PurchaseItem', back_populates='purchase', cascade='all, delete-orphan')
