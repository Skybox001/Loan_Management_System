from decimal import Decimal
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_customers: int
    total_applications: int
    applications_by_status: dict[str, int]
    total_disbursed_amount: Decimal
    total_outstanding_amount: Decimal
    total_collected_amount: Decimal
    overdue_emi_count: int
    pending_document_verifications: int