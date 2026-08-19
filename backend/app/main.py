from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    auth,
    customers,
    loan_products,
    loan_applications,
    documents,
    emi_schedule,
    payments,
    audit_logs,
    dashboard,
    notifications,
    reports,
)


from app.core.config import settings

app = FastAPI(
    title="Loan Management System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(loan_products.router)
app.include_router(loan_applications.router)
app.include_router(documents.router)
app.include_router(emi_schedule.router)
app.include_router(payments.router)
app.include_router(audit_logs.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "LMS backend"}


@app.get("/health")
def health():
    return {"status": "healthy"}