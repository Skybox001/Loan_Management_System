from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import EmploymentType


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    full_name = Column(String(255), nullable=False)
    phone = Column(String(15), nullable=False)
    dob = Column(Date, nullable=True)

    pan = Column(String(10), unique=True, nullable=False, index=True)
    aadhaar = Column(String(12), unique=True, nullable=False, index=True)

    address = Column(String(500), nullable=True)
    employment_type = Column(SQLEnum(EmploymentType), nullable=True)
    employer_name = Column(String(255), nullable=True)
    monthly_income = Column(Numeric(12, 2), nullable=True)

    bank_account_number = Column(String(50), nullable=True)
    bank_ifsc = Column(String(11), nullable=True)
    bank_name = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="customer")
    loan_applications = relationship("LoanApplication", back_populates="customer")