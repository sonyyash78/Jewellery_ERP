from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class ExchangeItemCreate(BaseModel):
    item_name: str
    metal: str
    purity: str
    touch: float
    gross_weight: float
    stone_weight: float = 0
    net_weight: float
    rate_applied: float
    calculated_value: float

class ExchangeNewItemCreate(BaseModel):
    stock_item_id: int
    item_name: str
    metal: str
    net_weight: float
    final_price: float

class ExchangeCreate(BaseModel):
    customer_id: int
    amount_paid: Optional[float] = None
    total_old_value: float
    total_new_value: float
    gst_amount: float
    grand_total: float
    difference_amount: float
    
    old_items: List[ExchangeItemCreate]
    new_items: List[ExchangeNewItemCreate]

class ExchangeItemResponse(ExchangeItemCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ExchangeNewItemResponse(ExchangeNewItemCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ExchangeResponse(BaseModel):
    id: int
    customer_id: int
    exchange_date: datetime
    total_old_value: float
    total_new_value: float
    gst_amount: float
    grand_total: float
    difference_amount: float
    
    old_items: List[ExchangeItemResponse]
    new_items: List[ExchangeNewItemResponse]
    
    model_config = ConfigDict(from_attributes=True)
