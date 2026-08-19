from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from dateutil.relativedelta import relativedelta

from sqlalchemy.orm import Session

from app.models.emi_schedule import EMISchedule
from app.models.loan_application import LoanApplication
from app.models.enums import EMIStatus

TWO_PLACES = Decimal("0.01")


def _round(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def calculate_emi_amount(principal: Decimal, annual_rate: Decimal, tenure_months: int) -> Decimal:
    """Standard reducing-balance EMI formula: E = P * r * (1+r)^n / ((1+r)^n - 1)"""
    monthly_rate = annual_rate / Decimal("100") / Decimal("12")

    if monthly_rate == 0:
        return _round(principal / tenure_months)

    factor = (1 + monthly_rate) ** tenure_months
    emi = principal * monthly_rate * factor / (factor - 1)
    return _round(emi)


def generate_emi_schedule(db: Session, application: LoanApplication) -> list[EMISchedule]:
    # Clear any existing schedule for idempotency (e.g. re-approval edge case)
    db.query(EMISchedule).filter(EMISchedule.loan_application_id == application.id).delete()

    principal = Decimal(application.amount)
    annual_rate = Decimal(application.interest_rate)
    tenure = application.tenure

    emi_amount = calculate_emi_amount(principal, annual_rate, tenure)
    monthly_rate = annual_rate / Decimal("100") / Decimal("12")

    balance = principal
    schedule = []
    start_date = date.today()

    for month in range(1, tenure + 1):
        interest_component = _round(balance * monthly_rate)

        if month == tenure:
            # Last installment absorbs any rounding residue so balance hits exactly 0.
            principal_component = balance
            installment = principal_component + interest_component
        else:
            principal_component = _round(emi_amount - interest_component)
            installment = emi_amount

        balance = _round(balance - principal_component)
        due_date = start_date + relativedelta(months=month)

        entry = EMISchedule(
            loan_application_id=application.id,
            emi_number=month,
            due_date=due_date,
            principal=principal_component,
            interest=interest_component,
            emi_amount=_round(installment),
            outstanding_balance=max(balance, Decimal("0")),
            status=EMIStatus.UPCOMING,
        )
        db.add(entry)
        schedule.append(entry)

    db.commit()
    for entry in schedule:
        db.refresh(entry)
    return schedule


def get_schedule_for_application(db: Session, application_id: int):
    return (
        db.query(EMISchedule)
        .filter(EMISchedule.loan_application_id == application_id)
        .order_by(EMISchedule.emi_number)
        .all()
    )