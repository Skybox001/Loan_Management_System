from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.payment import PaymentCreate, PaymentOut
from app.services import payment_service

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/", response_model=PaymentOut, status_code=201)
def record_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LOAN_OFFICER, UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    return payment_service.create_payment(db, payload)


@router.get("/emi/{emi_id}", response_model=list[PaymentOut])
def get_payments_for_emi(
    emi_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LOAN_OFFICER, UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    return payment_service.list_payments_for_emi(db, emi_id)


@router.get("/application/{application_id}", response_model=list[PaymentOut])
def get_payments_for_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LOAN_OFFICER, UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    return payment_service.list_payments_for_application(db, application_id)