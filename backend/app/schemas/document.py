from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.enums import DocumentType, DocumentStatus


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loan_application_id: int
    document_type: DocumentType
    file_path: str
    file_size_kb: Optional[int]
    status: DocumentStatus
    verified_by: Optional[int]
    remarks: Optional[str]
    uploaded_at: datetime


class DocumentVerify(BaseModel):
    status: DocumentStatus
    remarks: Optional[str] = None