from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable: system-generated actions

    action = Column(String(100), nullable=False)       # e.g. "LOAN_APPROVED", "DOCUMENT_UPLOADED"
    entity = Column(String(100), nullable=False)        # e.g. "LoanApplication", "Payment"
    entity_id = Column(Integer, nullable=True)           # id of the affected row
    remarks = Column(String(500), nullable=True)

    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="audit_logs")