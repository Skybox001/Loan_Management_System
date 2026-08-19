from fastapi import APIRouter, Depends, File, UploadFile, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole, DocumentType
from app.schemas.document import DocumentOut, DocumentVerify
from app.services import document_service, loan_application_service, customer_service

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.post("/{application_id}/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    application_id: int,
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CUSTOMER)),
):
    application = loan_application_service.get_application(db, application_id)
    customer = customer_service.get_customer_by_user(db, current_user.id)
    if application.customer_id != customer.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not your application")

    return document_service.save_document(db, application, document_type, file)


@router.get("/{application_id}", response_model=list[DocumentOut])
def list_documents(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = loan_application_service.get_application(db, application_id)

    if current_user.role == UserRole.CUSTOMER:
        customer = customer_service.get_customer_by_user(db, current_user.id)
        if application.customer_id != customer.id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not your application")

    return document_service.list_documents_for_application(db, application_id)


@router.patch("/verify/{document_id}", response_model=DocumentOut)
def verify_document(
    document_id: int,
    payload: DocumentVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LOAN_OFFICER, UserRole.CREDIT_MANAGER, UserRole.SUPER_ADMIN)),
):
    document = document_service.get_document(db, document_id)
    return document_service.verify_document(db, document, payload.status, current_user.id, payload.remarks)