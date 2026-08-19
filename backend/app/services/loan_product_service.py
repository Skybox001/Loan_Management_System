from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.loan_product import LoanProduct
from app.schemas.loan_product import LoanProductCreate, LoanProductUpdate


def create_loan_product(db: Session, payload: LoanProductCreate) -> LoanProduct:
    product = LoanProduct(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get_loan_product(db: Session, product_id: int) -> LoanProduct:
    product = db.query(LoanProduct).filter(LoanProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Loan product not found")
    return product


def list_loan_products(db: Session, skip: int = 0, limit: int = 50):
    return db.query(LoanProduct).offset(skip).limit(limit).all()


def update_loan_product(db: Session, product: LoanProduct, payload: LoanProductUpdate) -> LoanProduct:
    update_data = payload.model_dump(exclude_unset=True)
    merged = {
        "min_amount": product.min_amount,
        "max_amount": product.max_amount,
    }
    merged.update(update_data)
    if merged["min_amount"] >= merged["max_amount"]:
        raise HTTPException(status_code=400, detail="min_amount must be less than max_amount")

    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_loan_product(db: Session, product: LoanProduct):
    db.delete(product)
    db.commit()