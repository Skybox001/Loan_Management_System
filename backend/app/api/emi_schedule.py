from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.emi_schedule import EMIScheduleOut
from app.services import emi_service, loan_application_service, customer_service

router = APIRouter(prefix="/api/emi-schedule", tags=["EMI Schedule"])


@router.get("/{application_id}", response_model=list[EMIScheduleOut])
def get_emi_schedule(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = loan_application_service.get_application(db, application_id)

    if current_user.role == UserRole.CUSTOMER:
        customer = customer_service.get_customer_by_user(db, current_user.id)
        if application.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="Not your application")

    return emi_service.get_schedule_for_application(db, application_id)