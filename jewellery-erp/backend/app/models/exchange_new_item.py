from sqlalchemy import Integer, DECIMAL, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class ExchangeNewItem(Base):
    __tablename__ = "exchange_new_items" # Represents New Items sold to customer

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exchange_id: Mapped[int] = mapped_column(Integer, ForeignKey("exchanges.id", ondelete="CASCADE"))
    stock_item_id: Mapped[int] = mapped_column(Integer, ForeignKey("stock_items.id", ondelete="RESTRICT"))
    
    item_name: Mapped[str] = mapped_column(String(100))
    metal: Mapped[str] = mapped_column(String(50))
    net_weight: Mapped[float] = mapped_column(DECIMAL(10, 3))
    
    final_price: Mapped[float] = mapped_column(DECIMAL(12, 2))

    exchange: Mapped["Exchange"] = relationship("Exchange", back_populates="new_items")
    stock_item: Mapped["StockItem"] = relationship("StockItem")
