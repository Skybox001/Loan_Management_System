import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    LOAN_OFFICER = "loan_officer"
    CREDIT_MANAGER = "credit_manager"
    CUSTOMER = "customer"


class EmploymentType(str, enum.Enum):
    SALARIED = "salaried"
    SELF_EMPLOYED = "self_employed"
    BUSINESS = "business"
    UNEMPLOYED = "unemployed"


class LoanStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    DOCUMENT_VERIFICATION = "document_verification"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISBURSED = "disbursed"
    CLOSED = "closed"


class DocumentType(str, enum.Enum):
    AADHAAR = "aadhaar"
    PAN = "pan"
    SALARY_SLIP = "salary_slip"
    BANK_STATEMENT = "bank_statement"
    FORM_16 = "form_16"
    PHOTOGRAPH = "photograph"
    ADDRESS_PROOF = "address_proof"


class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class EMIStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    PAID = "paid"
    PENDING = "pending"
    OVERDUE = "overdue"


class PaymentMode(str, enum.Enum):
    UPI = "upi"
    NEFT = "neft"
    CARD = "card"
    CASH = "cash"
    NETBANKING = "netbanking"


class PaymentStatus(str, enum.Enum):
    SUCCESS = "success"
    PENDING = "pending"
    FAILED = "failed"