from sqlalchemy import Column, Integer, Date, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import EMIStatus


class EMISchedule(Base):
    __tablename__ = "emi_schedule"

    id = Column(Integer, primary_key=True, index=True)
    loan_application_id = Column(Integer, ForeignKey("loan_applications.id"), nullable=False, index=True)

    emi_number = Column(Integer, nullable=False)  # 1, 2, 3... up to tenure
    due_date = Column(Date, nullable=False)

    principal = Column(Numeric(14, 2), nullable=False)
    interest = Column(Numeric(14, 2), nullable=False)
    emi_amount = Column(Numeric(14, 2), nullable=False)
    outstanding_balance = Column(Numeric(14, 2), nullable=False)  # balance after this EMI

    status = Column(SQLEnum(EMIStatus), nullable=False, default=EMIStatus.UPCOMING, index=True)

    loan_application = relationship("LoanApplication", back_populates="emi_schedule")
    payments = relationship("Payment", back_populates="emi")