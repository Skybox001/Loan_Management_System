from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator


class LoanProductBase(BaseModel):
    name: str
    min_amount: Decimal
    max_amount: Decimal
    interest_rate: Decimal
    max_tenure: int
    processing_fee: Decimal = Decimal("0")

    @model_validator(mode="after")
    def validate_amount_range(self):
        if self.min_amount >= self.max_amount:
            raise ValueError("min_amount must be less than max_amount")
        if self.max_tenure <= 0:
            raise ValueError("max_tenure must be positive")
        if self.interest_rate < 0:
            raise ValueError("interest_rate cannot be negative")
        return self


class LoanProductCreate(LoanProductBase):
    pass


class LoanProductUpdate(BaseModel):
    name: Optional[str] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    interest_rate: Optional[Decimal] = None
    max_tenure: Optional[int] = None
    processing_fee: Optional[Decimal] = None


class LoanProductOut(LoanProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime