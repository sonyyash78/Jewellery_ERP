from pydantic import BaseModel, ConfigDict
from typing import Optional

class SellerBase(BaseModel):
    name: str
    mobile: str
    aadhaar_pan: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    gst_number: Optional[str] = None
    outstanding_balance: float = 0
    fine_gold_balance: float = 0
    fine_silver_balance: float = 0
    is_active: bool = True

class SellerCreate(SellerBase):
    pass

class SellerUpdate(SellerBase):
    pass

class SellerResponse(SellerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
