from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import EmploymentType


class CustomerBase(BaseModel):
    full_name: str
    phone: str
    dob: Optional[date] = None
    pan: str
    aadhaar: str
    address: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    employer_name: Optional[str] = None
    monthly_income: Optional[Decimal] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None

    @field_validator("pan")
    @classmethod
    def validate_pan(cls, v: str) -> str:
        v = v.upper().strip()
        if len(v) != 10:
            raise ValueError("PAN must be 10 characters")
        return v

    @field_validator("aadhaar")
    @classmethod
    def validate_aadhaar(cls, v: str) -> str:
        v = v.strip()
        if len(v) != 12 or not v.isdigit():
            raise ValueError("Aadhaar must be 12 digits")
        return v


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[date] = None
    address: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    employer_name: Optional[str] = None
    monthly_income: Optional[Decimal] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime