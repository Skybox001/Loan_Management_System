from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.audit_log import AuditLogOut
from app.services import audit_service

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


@router.get("/", response_model=list[AuditLogOut])
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    return audit_service.list_logs(db, skip, limit)


@router.get("/{entity}/{entity_id}", response_model=list[AuditLogOut])
def get_logs_for_entity(
    entity: str,
    entity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.CREDIT_MANAGER)),
):
    return audit_service.get_logs_for_entity(db, entity, entity_id)