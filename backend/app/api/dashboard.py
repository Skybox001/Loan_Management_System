from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.dashboard import DashboardStats
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LOAN_OFFICER, UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    return dashboard_service.get_dashboard_stats(db)