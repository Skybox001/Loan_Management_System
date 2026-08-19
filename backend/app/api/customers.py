from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut
from app.services import customer_service

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.post("/", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_my_customer_profile(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return customer_service.create_customer(db, current_user, payload)


@router.get("/me", response_model=CustomerOut)
def get_my_customer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return customer_service.get_customer_by_user(db, current_user.id)


@router.put("/me", response_model=CustomerOut)
def update_my_customer_profile(
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.get_customer_by_user(db, current_user.id)
    return customer_service.update_customer(db, customer, payload)


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LOAN_OFFICER, UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    return customer_service.get_customer_by_id(db, customer_id)


@router.get("/", response_model=list[CustomerOut])
def list_all_customers(
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LOAN_OFFICER, UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    return customer_service.list_customers(db, search, skip, limit)