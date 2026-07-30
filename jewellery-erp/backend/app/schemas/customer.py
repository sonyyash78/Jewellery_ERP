from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re

class CustomerBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    pan_card: Optional[str] = None
    aadhar_card: Optional[str] = None
    gst_number: Optional[str] = None
    credit_limit: float = 0
    outstanding_balance: float = 0

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v):
        if not re.match(r'^\+?1?\d{9,15}$', v):
            raise ValueError("Invalid phone number format")
        return v
        
    @field_validator('pan_card')
    @classmethod
    def validate_pan(cls, v):
        if v and not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', v.upper()):
            raise ValueError("Invalid PAN format")
        return v.upper() if v else v

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    pan_card: Optional[str] = None
    aadhar_card: Optional[str] = None
    gst_number: Optional[str] = None
    credit_limit: Optional[float] = None
    outstanding_balance: Optional[float] = None

class CustomerResponse(CustomerBase):
    id: int
    is_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerList(BaseModel):
    total: int
    items: list[CustomerResponse]
