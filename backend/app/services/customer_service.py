from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate


def create_customer(db: Session, user: User, payload: CustomerCreate) -> Customer:
    existing = db.query(Customer).filter(Customer.user_id == user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer profile already exists for this user")

    if db.query(Customer).filter(Customer.pan == payload.pan).first():
        raise HTTPException(status_code=400, detail="PAN already registered")
    if db.query(Customer).filter(Customer.aadhaar == payload.aadhaar).first():
        raise HTTPException(status_code=400, detail="Aadhaar already registered")

    customer = Customer(user_id=user.id, **payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_customer_by_id(db: Session, customer_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def get_customer_by_user(db: Session, user_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.user_id == user_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return customer


def list_customers(db: Session, search: str | None = None, skip: int = 0, limit: int = 50):
    query = db.query(Customer)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Customer.full_name.ilike(like))
            | (Customer.phone.ilike(like))
            | (Customer.pan.ilike(like))
        )
    return query.offset(skip).limit(limit).all()


def update_customer(db: Session, customer: Customer, payload: CustomerUpdate) -> Customer:
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer