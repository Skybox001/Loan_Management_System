from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole, LoanStatus
from app.schemas.loan_application import (
    LoanApplicationCreate,
    LoanApplicationUpdate,
    LoanApplicationOut,
    LoanStatusUpdate,
)
from app.services import loan_application_service, customer_service

router = APIRouter(prefix="/api/loan-applications", tags=["Loan Applications"])


@router.post("/", response_model=LoanApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: LoanApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CUSTOMER)),
):
    customer = customer_service.get_customer_by_user(db, current_user.id)
    return loan_application_service.create_application(db, customer, payload)


@router.get("/mine", response_model=list[LoanApplicationOut])
def list_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CUSTOMER)),
):
    customer = customer_service.get_customer_by_user(db, current_user.id)
    return loan_application_service.list_applications_for_customer(db, customer.id)


@router.get("/", response_model=list[LoanApplicationOut])
def list_applications(
    status_filter: LoanStatus | None = None,
    customer_name: str | None = None,
    min_amount: Decimal | None = None,
    max_amount: Decimal | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LOAN_OFFICER, UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    return loan_application_service.list_all_applications(
        db, status_filter, customer_name, min_amount, max_amount, skip, limit
    )


@router.get("/{application_id}", response_model=LoanApplicationOut)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = loan_application_service.get_application(db, application_id)

    if current_user.role == UserRole.CUSTOMER:
        customer = customer_service.get_customer_by_user(db, current_user.id)
        if application.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="Not your application")

    return application


@router.put("/{application_id}", response_model=LoanApplicationOut)
def update_application(
    application_id: int,
    payload: LoanApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CUSTOMER)),
):
    application = loan_application_service.get_application(db, application_id)
    customer = customer_service.get_customer_by_user(db, current_user.id)
    if application.customer_id != customer.id:
        raise HTTPException(status_code=403, detail="Not your application")
    return loan_application_service.update_application(db, application, payload)


@router.post("/{application_id}/submit", response_model=LoanApplicationOut)
def submit_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CUSTOMER)),
):
    application = loan_application_service.get_application(db, application_id)
    customer = customer_service.get_customer_by_user(db, current_user.id)
    if application.customer_id != customer.id:
        raise HTTPException(status_code=403, detail="Not your application")
    return loan_application_service.submit_application(db, application)


@router.patch("/{application_id}/status", response_model=LoanApplicationOut)
def change_status(
    application_id: int,
    payload: LoanStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LOAN_OFFICER, UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    application = loan_application_service.get_application(db, application_id)
    return loan_application_service.change_status(
        db, application, payload.status, current_user, payload.rejection_reason
    )