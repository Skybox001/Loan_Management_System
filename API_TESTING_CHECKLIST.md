# API Testing Video Checklist (10-15 Minutes)

This checklist corresponds to the mandatory video requirements from the assignment.

## 1. Authentication (3 minutes)

### User Registration
- [ ] POST `/api/auth/register` - Register new customer
  - Show successful registration
  - Show duplicate email error (validation)

### Login
- [ ] POST `/api/auth/login` - Login with credentials
  - Show successful login with tokens
  - Show invalid credentials error

### Role-Based Access
- [ ] Test accessing protected endpoints
  - Show customer accessing their own data
  - Show staff accessing admin endpoints
  - Show 403 error when customer tries to access staff endpoint

### Invalid JWT Handling
- [ ] Test with expired token
- [ ] Test with malformed token
- [ ] Show automatic redirect to login on 401

## 2. Customer Management (2 minutes)

### Create Customer Profile
- [ ] POST `/api/customers/` - Create customer profile
  - Show all required fields (PAN, Aadhaar, employment, income, bank details)
  - Show successful creation

### Update Customer
- [ ] PUT `/api/customers/me` - Update own profile
  - Show profile update
  - Show validation errors

### Search Customer (Staff Only)
- [ ] GET `/api/customers/?search=name` - Search by name
- [ ] GET `/api/customers/?search=PAN` - Search by PAN
- [ ] Show search results

## 3. Loan Workflow (5 minutes)

### Create Loan Application
- [ ] POST `/api/loan-applications/` - Create application
  - Select loan product from dropdown (5 seeded products)
  - Enter amount, tenure, purpose, income
  - Show draft status

### Upload Documents
- [ ] POST `/api/documents/{application_id}` - Upload document
  - Upload PAN card (PDF/JPG/PNG, max 10MB)
  - Upload Aadhaar
  - Upload salary slip
  - Show pending verification status

### Submit Application
- [ ] POST `/api/loan-applications/{id}/submit` - Submit for review
  - Show status change: Draft → Submitted

### Document Verification (Loan Officer)
- [ ] PATCH `/api/documents/{id}/verify` - Verify documents
  - Mark documents as verified
  - Show remarks field

### Loan Officer Review
- [ ] PATCH `/api/loan-applications/{id}/status` - Change status
  - Submitted → Under Review (Loan Officer)
  - Under Review → Document Verification (Loan Officer)

### Credit Manager Approval
- [ ] PATCH `/api/loan-applications/{id}/status` - Approve loan
  - Document Verification → Approved (Credit Manager)
  - Show auto-generation of EMI schedule

### Loan Rejection (Alternative Flow)
- [ ] PATCH `/api/loan-applications/{id}/status` - Reject loan
  - Show rejection reason required
  - Show status change to Rejected

### Loan Disbursement
- [ ] PATCH `/api/loan-applications/{id}/status` - Disburse loan
  - Approved → Disbursed (Credit Manager)

## 4. EMI Schedule (1 minute)

### Generate EMI Schedule
- [ ] Show EMI schedule auto-generated after approval
- [ ] GET `/api/emi-schedule/{application_id}` - View schedule

### View Schedule
- [ ] Display complete amortization schedule
  - EMI number
  - Due date
  - Principal component
  - Interest component
  - EMI amount
  - Outstanding balance

### Outstanding Balance Calculation
- [ ] Show reducing balance calculation
- [ ] Show last EMI absorbs rounding residue

## 5. Repayment (2 minutes)

### Record Payment (Staff Only)
- [ ] POST `/api/payments/` - Record payment
  - Select EMI from list
  - Enter amount, payment mode, transaction ID
  - Show status update to "paid"

### View Payment History
- [ ] GET `/api/payments/?application_id={id}` - List payments
  - Show all recorded payments
  - Show payment date, amount, mode, transaction ID

### Loan Closure
- [ ] Show automatic loan closure when last EMI paid
  - Status: Disbursed → Closed
  - Show in audit logs

## 6. Dashboard (1 minute)

### Loan Statistics
- [ ] GET `/api/dashboard/stats` - Dashboard data
  - Total customers
  - Total loans by status
  - Active loans count

### Collection Statistics
- [ ] Show total disbursed amount
- [ ] Show total collected amount
- [ ] Show monthly collections

### Outstanding Amount
- [ ] Show total outstanding balance
- [ ] Show overdue EMIs count
- [ ] Show pending applications count

## 7. Reports (1 minute)

- [ ] GET `/api/reports/loan-summary` - Download CSV
- [ ] GET `/api/reports/collection` - Download CSV
- [ ] GET `/api/reports/outstanding` - Download CSV
- [ ] GET `/api/reports/emi/{application_id}` - Download CSV
- [ ] Show CSV file opened in Excel

## 8. Validation Scenarios (10+ required)

Show these validation errors:

1. [ ] Duplicate PAN registration (400 error)
2. [ ] Duplicate Aadhaar registration (400 error)
3. [ ] Invalid PAN format (422 error)
4. [ ] Aadhaar not 12 digits (422 error)
5. [ ] Loan amount below product minimum (400 error)
6. [ ] Loan amount above product maximum (400 error)
7. [ ] Tenure exceeds product max tenure (400 error)
8. [ ] Missing required documents before approval (400 error)
9. [ ] Invalid status transition (400 error)
10. [ ] Payment on closed loan (400 error)
11. [ ] Duplicate transaction ID (400 error)
12. [ ] File upload exceeds 10MB (413 error)
13. [ ] Unsupported file format (400 error)
14. [ ] Customer accessing other customer's data (403 error)
15. [ ] Monthly income less than or equal to zero (422 error)

## 9. Error Handling Scenarios (5+ required)

Show these error scenarios:

1. [ ] 401 Unauthorized - No token provided
2. [ ] 401 Unauthorized - Invalid/expired token
3. [ ] 403 Forbidden - Wrong role accessing endpoint
4. [ ] 404 Not Found - Non-existent resource
5. [ ] 422 Unprocessable Entity - Invalid input schema
6. [ ] 500 Internal Server Error - Simulate Redis failure (optional)

## 10. Swagger Documentation

- [ ] Open http://127.0.0.1:8000/docs
- [ ] Show all API endpoint groups:
  - Authentication (4 endpoints)
  - Customers (5 endpoints)
  - Loan Products (5 endpoints)
  - Loan Applications (6+ endpoints)
  - Documents (3 endpoints)
  - EMI Schedule (1 endpoint)
  - Payments (2 endpoints)
  - Dashboard (1 endpoint)
  - Reports (4 endpoints)
  - Notifications (2 endpoints)
  - Audit Logs (2 endpoints)
- [ ] Show request/response schemas
- [ ] Show authorization with JWT token

## 11. Additional Demonstrations

### Search & Filters
- [ ] Search customer by name
- [ ] Search customer by phone
- [ ] Search customer by PAN
- [ ] Filter loans by status
- [ ] Filter loans by date range
- [ ] Filter loans by product

### Audit Logs
- [ ] GET `/api/audit-logs/` - Show all audit entries
- [ ] GET `/api/audit-logs/?entity_type=loan_application&entity_id=1`
- [ ] Show captured status changes

### Notifications
- [ ] GET `/api/notifications/` - List notifications
- [ ] Show notifications created on status changes
- [ ] PATCH `/api/notifications/{id}/read` - Mark as read

### Redis Caching
- [ ] Show dashboard response time with cache hit (<500ms)
- [ ] Mention Redis is used for caching

---

## Video Recording Tips

1. **Use Postman** for all API demonstrations (you have the collection ready)
2. **Show the request and response** for each endpoint clearly
3. **Narrate** what you're testing as you go
4. **Keep it organized** - follow this checklist order
5. **Time limit**: 10-15 minutes (prioritize key features if running long)
6. **Tools**: 
   - Postman for API testing
   - Browser for Swagger UI
   - Excel to open downloaded CSV reports

## Recording Tools Suggestions

- **Screen Recording**: OBS Studio (free), Loom, or Windows Game Bar (Win+G)
- **Audio**: Use good microphone, narrate clearly
- **Upload**: YouTube (unlisted), Google Drive, or Loom

---

**Checklist Last Updated**: August 19, 2026  
**Corresponds to**: Full Stack Technical Assessment - LMS Assignment
