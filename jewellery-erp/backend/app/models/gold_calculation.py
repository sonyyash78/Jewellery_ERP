from sqlalchemy import Integer, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class GoldCalculation(Base):
    __tablename__ = "gold_calculations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    invoice_item_id: Mapped[int] = mapped_column(Integer, ForeignKey("invoice_items.id", ondelete="CASCADE"), unique=True)
    metal_rate_id: Mapped[int] = mapped_column(Integer, ForeignKey("gold_rates.id", ondelete="RESTRICT"))
    gross_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    stone_weight: Mapped[float] = mapped_column(DECIMAL(10, 3), default=0.0)
    net_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    making_charges_amount: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0.0)
    hallmark_charges: Mapped[float] = mapped_column(DECIMAL(10, 2), default=0.0)
    total_gold_value: Mapped[float] = mapped_column(DECIMAL(12, 2))

    invoice_item: Mapped["InvoiceItem"] = relationship("InvoiceItem", back_populates="gold_calculation")
    metal_rate: Mapped["GoldRate"] = relationship("GoldRate", back_populates="gold_calculations")
