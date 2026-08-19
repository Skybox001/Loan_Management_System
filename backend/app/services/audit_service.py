from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    action: str,
    entity: str,
    entity_id: int | None = None,
    user_id: int | None = None,
    remarks: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        remarks=remarks,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_logs_for_entity(db: Session, entity: str, entity_id: int):
    return (
        db.query(AuditLog)
        .filter(AuditLog.entity == entity, AuditLog.entity_id == entity_id)
        .order_by(AuditLog.timestamp.desc())
        .all()
    )


def list_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()