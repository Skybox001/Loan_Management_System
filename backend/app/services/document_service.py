import os
import uuid
from fastapi import HTTPException, UploadFile

from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.loan_application import LoanApplication
from app.models.enums import DocumentType, DocumentStatus

UPLOAD_DIR = "app/uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/jpg", "image/png"}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


def save_document(
    db: Session,
    application: LoanApplication,
    document_type: DocumentType,
    file: UploadFile,
) -> Document:
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, and PNG files are allowed")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type")

    contents = file.file.read()
    size = len(contents)
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    document = Document(
        loan_application_id=application.id,
        document_type=document_type,
        file_path=file_path,
        file_size_kb=size // 1024,
        status=DocumentStatus.PENDING,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_document(db: Session, document_id: int) -> Document:
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


def list_documents_for_application(db: Session, application_id: int):
    return db.query(Document).filter(Document.loan_application_id == application_id).all()


def verify_document(db: Session, document: Document, status: DocumentStatus, verifier_id: int, remarks: str | None) -> Document:
    document.status = status
    document.verified_by = verifier_id
    document.remarks = remarks
    db.commit()
    db.refresh(document)
    return document