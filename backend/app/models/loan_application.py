from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import LoanStatus


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    loan_product_id = Column(Integer, ForeignKey("loan_products.id"), nullable=False)

    amount = Column(Numeric(14, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    tenure = Column(Integer, nullable=False)  # in months
    purpose = Column(String(500), nullable=True)

    monthly_income = Column(Numeric(12, 2), nullable=False)
    existing_emis = Column(Numeric(12, 2), default=0)

    status = Column(SQLEnum(LoanStatus), nullable=False, default=LoanStatus.DRAFT, index=True)

    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)   # Loan Officer
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Credit Manager
    rejection_reason = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="loan_applications")
    loan_product = relationship("LoanProduct", back_populates="loan_applications")
    documents = relationship("Document", back_populates="loan_application")
    emi_schedule = relationship("EMISchedule", back_populates="loan_application")