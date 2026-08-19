from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.emi_schedule import EMISchedule
from app.models.loan_application import LoanApplication
from app.models.enums import PaymentStatus, EMIStatus, LoanStatus
from app.schemas.payment import PaymentCreate
from app.services import audit_service, notification_service


def create_payment(db: Session, payload: PaymentCreate) -> Payment:
    emi = db.query(EMISchedule).filter(EMISchedule.id == payload.emi_id).first()
    if not emi:
        raise HTTPException(status_code=404, detail="EMI record not found")

    if emi.status == EMIStatus.PAID:
        raise HTTPException(status_code=400, detail="This EMI is already paid")

    application = db.query(LoanApplication).filter(LoanApplication.id == emi.loan_application_id).first()
    if application.status == LoanStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Loan is already closed")

    if payload.amount != emi.emi_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount must match EMI amount of {emi.emi_amount}",
        )

    existing = db.query(Payment).filter(Payment.transaction_id == payload.transaction_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Transaction ID already used")

    payment = Payment(
        emi_id=payload.emi_id,
        amount=payload.amount,
        payment_mode=payload.payment_mode,
        transaction_id=payload.transaction_id,
        status=PaymentStatus.SUCCESS,
    )
    db.add(payment)

    emi.status = EMIStatus.PAID
    db.commit()
    db.refresh(payment)

    _check_and_close_loan(db, application)

    audit_service.log_action(
        db,
        action="PAYMENT_RECORDED",
        entity="Payment",
        entity_id=payment.id,
        remarks=f"EMI {emi.id} paid via {payload.payment_mode.value}, txn {payload.transaction_id}",
    )

    notification_service.create_notification(
        db,
        user_id=application.customer.user_id,
        title="Payment Received",
        message=f"Your payment of {payload.amount} for EMI #{emi.emi_number} was recorded successfully.",
    )

    return payment


def _check_and_close_loan(db: Session, application: LoanApplication):
    remaining = (
        db.query(EMISchedule)
        .filter(EMISchedule.loan_application_id == application.id)
        .filter(EMISchedule.status != EMIStatus.PAID)
        .count()
    )
    if remaining == 0:
        application.status = LoanStatus.CLOSED
        db.commit()


def get_payment(db: Session, payment_id: int) -> Payment:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


def list_payments_for_emi(db: Session, emi_id: int):
    return db.query(Payment).filter(Payment.emi_id == emi_id).all()


def list_payments_for_application(db: Session, application_id: int):
    return (
        db.query(Payment)
        .join(EMISchedule, Payment.emi_id == EMISchedule.id)
        .filter(EMISchedule.loan_application_id == application_id)
        .all()
    )