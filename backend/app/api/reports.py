from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _stream_csv(buffer, filename: str) -> StreamingResponse:
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/loan-summary")
def get_loan_summary_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    buffer = report_service.loan_summary_report(db)
    return _stream_csv(buffer, "loan_summary.csv")


@router.get("/collection")
def get_collection_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    buffer = report_service.collection_report(db)
    return _stream_csv(buffer, "collection_report.csv")


@router.get("/outstanding")
def get_outstanding_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    buffer = report_service.outstanding_report(db)
    return _stream_csv(buffer, "outstanding_report.csv")


@router.get("/emi/{application_id}")
def get_emi_report(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LOAN_OFFICER, UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    buffer = report_service.emi_report(db, application_id)
    return _stream_csv(buffer, f"emi_schedule_{application_id}.csv")