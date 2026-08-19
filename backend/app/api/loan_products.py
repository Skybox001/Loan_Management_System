from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.loan_product import LoanProductCreate, LoanProductUpdate, LoanProductOut
from app.services import loan_product_service

router = APIRouter(prefix="/api/loan-products", tags=["Loan Products"])


@router.post("/", response_model=LoanProductOut, status_code=status.HTTP_201_CREATED)
def create_loan_product(
    payload: LoanProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    return loan_product_service.create_loan_product(db, payload)


@router.get("/", response_model=list[LoanProductOut])
def list_loan_products(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return loan_product_service.list_loan_products(db, skip, limit)


@router.get("/{product_id}", response_model=LoanProductOut)
def get_loan_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return loan_product_service.get_loan_product(db, product_id)


@router.put("/{product_id}", response_model=LoanProductOut)
def update_loan_product(
    product_id: int,
    payload: LoanProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    product = loan_product_service.get_loan_product(db, product_id)
    return loan_product_service.update_loan_product(db, product, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_loan_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    product = loan_product_service.get_loan_product(db, product_id)
    loan_product_service.delete_loan_product(db, product)