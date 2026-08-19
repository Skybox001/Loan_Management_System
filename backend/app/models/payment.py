from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import PaymentMode, PaymentStatus


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    emi_id = Column(Integer, ForeignKey("emi_schedule.id"), nullable=False, index=True)

    payment_date = Column(Date, nullable=False, server_default=func.current_date())
    amount = Column(Numeric(14, 2), nullable=False)
    payment_mode = Column(SQLEnum(PaymentMode), nullable=False)
    transaction_id = Column(String(100), unique=True, nullable=False, index=True)

    status = Column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    emi = relationship("EMISchedule", back_populates="payments")