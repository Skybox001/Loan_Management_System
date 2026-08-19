from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.loan_application import LoanApplication
from app.models.loan_product import LoanProduct
from app.models.customer import Customer
from app.models.user import User
from app.models.enums import LoanStatus, UserRole
from app.schemas.loan_application import LoanApplicationCreate, LoanApplicationUpdate
from app.services import audit_service, notification_service

TRANSITIONS = {
    LoanStatus.SUBMITTED: {
        LoanStatus.UNDER_REVIEW: {UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN},
        LoanStatus.REJECTED: {UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN},
    },
    LoanStatus.UNDER_REVIEW: {
        LoanStatus.DOCUMENT_VERIFICATION: {UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN},
        LoanStatus.REJECTED: {UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN},
    },
    LoanStatus.DOCUMENT_VERIFICATION: {
        LoanStatus.APPROVED: {UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN},
        LoanStatus.REJECTED: {UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN},
    },
    LoanStatus.APPROVED: {
        LoanStatus.DISBURSED: {UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN},
    },
    LoanStatus.DISBURSED: {
        LoanStatus.CLOSED: {UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN},
    },
}


def create_application(db: Session, customer: Customer, payload: LoanApplicationCreate) -> LoanApplication:
    product = db.query(LoanProduct).filter(LoanProduct.id == payload.loan_product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Loan product not found")

    if payload.amount < product.min_amount or payload.amount > product.max_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Amount must be between {product.min_amount} and {product.max_amount}",
        )
    if payload.tenure > product.max_tenure:
        raise HTTPException(status_code=400, detail=f"Tenure cannot exceed {product.max_tenure} months")

    application = LoanApplication(
        customer_id=customer.id,
        loan_product_id=product.id,
        amount=payload.amount,
        interest_rate=product.interest_rate,
        tenure=payload.tenure,
        purpose=payload.purpose,
        monthly_income=payload.monthly_income,
        existing_emis=payload.existing_emis,
        status=LoanStatus.DRAFT,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def get_application(db: Session, application_id: int) -> LoanApplication:
    application = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Loan application not found")
    return application


def list_applications_for_customer(db: Session, customer_id: int):
    return db.query(LoanApplication).filter(LoanApplication.customer_id == customer_id).all()


def list_all_applications(
    db: Session,
    status_filter: LoanStatus | None = None,
    customer_name: str | None = None,
    min_amount: Decimal | None = None,
    max_amount: Decimal | None = None,
    skip: int = 0,
    limit: int = 50,
):
    query = db.query(LoanApplication)

    if status_filter:
        query = query.filter(LoanApplication.status == status_filter)
    if min_amount is not None:
        query = query.filter(LoanApplication.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(LoanApplication.amount <= max_amount)
    if customer_name:
        query = query.join(Customer, LoanApplication.customer_id == Customer.id).filter(
            Customer.full_name.ilike(f"%{customer_name}%")
        )

    return query.offset(skip).limit(limit).all()


def update_application(db: Session, application: LoanApplication, payload: LoanApplicationUpdate) -> LoanApplication:
    if application.status != LoanStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft applications can be edited")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
    db.commit()
    db.refresh(application)
    return application


def submit_application(db: Session, application: LoanApplication) -> LoanApplication:
    if application.status != LoanStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft applications can be submitted")
    application.status = LoanStatus.SUBMITTED
    db.commit()
    db.refresh(application)
    return application


def change_status(db: Session, application: LoanApplication, new_status: LoanStatus, user: User, rejection_reason: str | None = None) -> LoanApplication:
    current = application.status
    allowed = TRANSITIONS.get(current, {})

    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move application from {current.value} to {new_status.value}",
        )

    if user.role not in allowed[new_status] and user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail=f"Role {user.role.value} cannot perform this transition")

    application.status = new_status

    if new_status == LoanStatus.UNDER_REVIEW:
        application.reviewed_by = user.id
    if new_status in (LoanStatus.APPROVED, LoanStatus.REJECTED) and current == LoanStatus.DOCUMENT_VERIFICATION:
        application.approved_by = user.id
    if new_status == LoanStatus.REJECTED:
        application.rejection_reason = rejection_reason

    db.commit()
    db.refresh(application)

    if new_status == LoanStatus.APPROVED:
        from app.services import emi_service
        emi_service.generate_emi_schedule(db, application)

    audit_service.log_action(
        db,
        action=f"LOAN_STATUS_CHANGED_TO_{new_status.value.upper()}",
        entity="LoanApplication",
        entity_id=application.id,
        user_id=user.id,
        remarks=rejection_reason if new_status == LoanStatus.REJECTED else None,
    )

    notification_service.create_notification(
        db,
        user_id=application.customer.user_id,
        title="Loan Application Update",
        message=f"Your loan application #{application.id} status changed to {new_status.value.replace('_', ' ').title()}.",
    )

    return application