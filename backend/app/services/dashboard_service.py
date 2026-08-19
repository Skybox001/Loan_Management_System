from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.loan_application import LoanApplication
from app.models.emi_schedule import EMISchedule
from app.models.payment import Payment
from app.models.document import Document
from app.models.enums import LoanStatus, EMIStatus, DocumentStatus, PaymentStatus
from app.schemas.dashboard import DashboardStats
from app.core.redis import cache_get, cache_set

CACHE_KEY = "dashboard:stats"
CACHE_TTL = 60  # seconds — short enough to stay reasonably fresh, long enough to save repeated heavy queries


def get_dashboard_stats(db: Session) -> DashboardStats:
    cached = cache_get(CACHE_KEY)
    if cached:
        return DashboardStats(**cached)

    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_applications = db.query(func.count(LoanApplication.id)).scalar() or 0

    status_rows = (
        db.query(LoanApplication.status, func.count(LoanApplication.id))
        .group_by(LoanApplication.status)
        .all()
    )
    applications_by_status = {status.value: count for status, count in status_rows}

    total_disbursed_amount = (
        db.query(func.coalesce(func.sum(LoanApplication.amount), 0))
        .filter(LoanApplication.status.in_([LoanStatus.DISBURSED, LoanStatus.CLOSED]))
        .scalar()
    ) or Decimal("0")

    total_outstanding_amount = (
        db.query(func.coalesce(func.sum(EMISchedule.emi_amount), 0))
        .filter(EMISchedule.status != EMIStatus.PAID)
        .scalar()
    ) or Decimal("0")

    total_collected_amount = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == PaymentStatus.SUCCESS)
        .scalar()
    ) or Decimal("0")

    overdue_emi_count = (
        db.query(func.count(EMISchedule.id))
        .filter(EMISchedule.status == EMIStatus.OVERDUE)
        .scalar()
    ) or 0

    pending_document_verifications = (
        db.query(func.count(Document.id))
        .filter(Document.status == DocumentStatus.PENDING)
        .scalar()
    ) or 0

    stats = DashboardStats(
        total_customers=total_customers,
        total_applications=total_applications,
        applications_by_status=applications_by_status,
        total_disbursed_amount=total_disbursed_amount,
        total_outstanding_amount=total_outstanding_amount,
        total_collected_amount=total_collected_amount,
        overdue_emi_count=overdue_emi_count,
        pending_document_verifications=pending_document_verifications,
    )

    cache_set(CACHE_KEY, stats.model_dump(), ttl_seconds=CACHE_TTL)

    return stats