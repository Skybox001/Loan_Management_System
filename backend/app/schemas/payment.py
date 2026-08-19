from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

from app.models.enums import PaymentMode, PaymentStatus


class PaymentCreate(BaseModel):
    emi_id: int
    amount: Decimal
    payment_mode: PaymentMode
    transaction_id: str


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    emi_id: int
    payment_date: date
    amount: Decimal
    payment_mode: PaymentMode
    transaction_id: str
    status: PaymentStatus
    created_at: datetime