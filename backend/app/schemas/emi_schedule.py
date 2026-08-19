from datetime import date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

from app.models.enums import EMIStatus


class EMIScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loan_application_id: int
    emi_number: int
    due_date: date
    principal: Decimal
    interest: Decimal
    emi_amount: Decimal
    outstanding_balance: Decimal
    status: EMIStatus