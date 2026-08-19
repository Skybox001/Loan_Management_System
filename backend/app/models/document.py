from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import DocumentType, DocumentStatus


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    loan_application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False)

    document_type = Column(SQLEnum(DocumentType), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_kb = Column(Integer, nullable=True)

    status = Column(SQLEnum(DocumentStatus), nullable=False, default=DocumentStatus.PENDING)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(String(500), nullable=True)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    loan_application = relationship("LoanApplication", back_populates="documents")