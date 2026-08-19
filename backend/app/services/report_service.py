import csv
import io

from sqlalchemy.orm import Session

from app.models.loan_application import LoanApplication
from app.models.customer import Customer
from app.models.emi_schedule import EMISchedule
from app.models.payment import Payment
from app.models.enums import EMIStatus, PaymentStatus


def _to_csv(headers: list[str], rows: list[list]) -> io.StringIO:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    writer.writerows(rows)
    buffer.seek(0)
    return buffer


def loan_summary_report(db: Session) -> io.StringIO:
    applications = (
        db.query(LoanApplication, Customer)
        .join(Customer, LoanApplication.customer_id == Customer.id)
        .all()
    )
    headers = ["Application ID", "Customer Name", "Amount", "Interest Rate", "Tenure", "Status", "Created At"]
    rows = [
        [app.id, cust.full_name, str(app.amount), str(app.interest_rate), app.tenure, app.status.value, app.created_at]
        for app, cust in applications
    ]
    return _to_csv(headers, rows)


def collection_report(db: Session) -> io.StringIO:
    payments = (
        db.query(Payment, EMISchedule, LoanApplication, Customer)
        .join(EMISchedule, Payment.emi_id == EMISchedule.id)
        .join(LoanApplication, EMISchedule.loan_application_id == LoanApplication.id)
        .join(Customer, LoanApplication.customer_id == Customer.id)
        .filter(Payment.status == PaymentStatus.SUCCESS)
        .all()
    )
    headers = ["Payment ID", "Application ID", "Customer Name", "EMI Number", "Amount", "Mode", "Transaction ID", "Payment Date"]
    rows = [
        [pay.id, loan.id, cust.full_name, emi.emi_number, str(pay.amount), pay.payment_mode.value, pay.transaction_id, pay.payment_date]
        for pay, emi, loan, cust in payments
    ]
    return _to_csv(headers, rows)


def outstanding_report(db: Session) -> io.StringIO:
    rows_data = (
        db.query(EMISchedule, LoanApplication, Customer)
        .join(LoanApplication, EMISchedule.loan_application_id == LoanApplication.id)
        .join(Customer, LoanApplication.customer_id == Customer.id)
        .filter(EMISchedule.status != EMIStatus.PAID)
        .all()
    )
    headers = ["Application ID", "Customer Name", "EMI Number", "Due Date", "EMI Amount", "Outstanding Balance", "Status"]
    rows = [
        [loan.id, cust.full_name, emi.emi_number, emi.due_date, str(emi.emi_amount), str(emi.outstanding_balance), emi.status.value]
        for emi, loan, cust in rows_data
    ]
    return _to_csv(headers, rows)


def emi_report(db: Session, application_id: int) -> io.StringIO:
    schedule = (
        db.query(EMISchedule)
        .filter(EMISchedule.loan_application_id == application_id)
        .order_by(EMISchedule.emi_number)
        .all()
    )
    headers = ["EMI Number", "Due Date", "Principal", "Interest", "EMI Amount", "Outstanding Balance", "Status"]
    rows = [
        [e.emi_number, e.due_date, str(e.principal), str(e.interest), str(e.emi_amount), str(e.outstanding_balance), e.status.value]
        for e in schedule
    ]
    return _to_csv(headers, rows)