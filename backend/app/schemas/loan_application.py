from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator

from app.models.enums import LoanStatus


class LoanApplicationCreate(BaseModel):
    loan_product_id: int
    amount: Decimal
    tenure: int
    purpose: Optional[str] = None
    monthly_income: Decimal
    existing_emis: Decimal = Decimal("0")


class LoanApplicationUpdate(BaseModel):
    amount: Optional[Decimal] = None
    tenure: Optional[int] = None
    purpose: Optional[str] = None
    monthly_income: Optional[Decimal] = None
    existing_emis: Optional[Decimal] = None


class LoanStatusUpdate(BaseModel):
    status: LoanStatus
    rejection_reason: Optional[str] = None

    @model_validator(mode="after")
    def require_reason_on_reject(self):
        if self.status == LoanStatus.REJECTED and not self.rejection_reason:
            raise ValueError("rejection_reason is required when rejecting")
        return self


class LoanApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    loan_product_id: int
    amount: Decimal
    interest_rate: Decimal
    tenure: int
    purpose: Optional[str]
    monthly_income: Decimal
    existing_emis: Decimal
    status: LoanStatus
    reviewed_by: Optional[int]
    approved_by: Optional[int]
    rejection_reason: Optional[str]
    created_at: datetime
    updated_at: datetime