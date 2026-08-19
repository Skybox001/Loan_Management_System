# Loan Origination & Management System (LMS)

A comprehensive full-stack loan management system built with FastAPI and Next.js, featuring complete loan lifecycle management from application to disbursement and repayment.

## 🚀 Tech Stack

### Backend
- **Framework**: FastAPI 0.104+
- **ORM**: SQLAlchemy 2.0+
- **Database**: PostgreSQL 18
- **Cache**: Redis
- **Migrations**: Alembic
- **Authentication**: JWT (Access + Refresh tokens with rotation)
- **Security**: Bcrypt password hashing, role-based access control (RBAC)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with JWT interceptor
- **State Management**: React Context API

## 📋 Features

### Core Functionality
- ✅ **Multi-role Authentication System**: Customer, Loan Officer, Credit Manager, Super Admin
- ✅ **Customer Profile Management**: Complete KYC with PAN/Aadhaar validation
- ✅ **Loan Products**: Configurable products with min/max amounts, interest rates, tenures
- ✅ **Loan Application Workflow**: Draft → Submit → Review → Document Verification → Approve/Reject → Disburse → Closed
- ✅ **Document Upload & Verification**: Support for PAN, Aadhaar, Income Proof, Bank Statements (10MB limit, PDF/JPG/PNG)
- ✅ **EMI Schedule Generation**: Reducing balance method with automatic amortization
- ✅ **Payment Recording**: Staff-initiated payment tracking with multiple payment modes
- ✅ **Audit Logging**: Complete audit trail for loan status changes and payments
- ✅ **Dashboard Analytics**: Cached aggregated stats (Redis, 60s TTL)
- ✅ **Notifications**: Database-logged notifications for status changes and payments
- ✅ **Reports**: CSV export for loan summary, collections, outstanding, EMI schedules

### Role-Based Permissions
- **Customer**: View/create own applications, upload documents, view EMI schedule
- **Loan Officer**: Review applications, move to document verification, manage customers
- **Credit Manager**: Approve/reject applications, disburse loans, record payments, access all reports
- **Super Admin**: Full system access + manage loan products

### Search & Filtering
- Customer search by name/phone/PAN
- Loan application filtering by status/customer/amount range

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 18
- Redis Server

### Backend Setup

1. **Clone and navigate to backend**
```powershell
cd "C:\Users\ASUS\OneDrive\Desktop\Projects\Loan Management system\backend"
```

2. **Create virtual environment**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

3. **Install dependencies**
```powershell
pip install -r requirements.txt
```

4. **Configure environment**
Create `.env` file in backend directory:
```env
DATABASE_URL=postgresql+psycopg2://lms_user:lms_password@localhost:5432/lms_db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
APP_ENV=development
APP_NAME=Loan Management System
UPLOAD_DIR=app/uploads
MAX_UPLOAD_SIZE_MB=10
CORS_ORIGINS=http://localhost:3000
```

5. **Setup database**
```powershell
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE lms_db;
CREATE USER lms_user WITH PASSWORD 'lms_password';
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
\q

# Run migrations
alembic upgrade head

# Seed loan products (optional)
python seed_products.py
```

6. **Start Redis** (separate terminal)
```powershell
redis-server
```

7. **Start backend server**
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will be available at: http://127.0.0.1:8000  
API Documentation (Swagger): http://127.0.0.1:8000/docs

### Frontend Setup

1. **Navigate to frontend**
```powershell
cd "C:\Users\ASUS\OneDrive\Desktop\Projects\Loan Management system\frontend"
```

2. **Install dependencies**
```powershell
npm install
```

3. **Start development server**
```powershell
npm run dev
```

Frontend will be available at: http://localhost:3000

## 📖 Usage Guide

### First Time Setup

1. **Register as Customer**
   - Go to http://localhost:3000/login
   - Click "Register" (only customer registration is public)
   - Fill in email, password, name

2. **Complete Profile**
   - After login, go to "My Profile"
   - Fill in all required fields (PAN, Aadhaar, phone, etc.)
   - Save profile

3. **Create Loan Application**
   - Go to "My Applications" → "New Application"
   - Select loan product
   - Enter amount, tenure, purpose, income details
   - Save as draft or submit directly

### Staff User Creation

Staff users (Loan Officer, Credit Manager, Super Admin) must be created directly in the database or via a super admin API endpoint (not exposed in public registration).

**Example SQL:**
```sql
INSERT INTO users (name, email, password_hash, role, created_at)
VALUES 
  ('Admin User', 'admin@lms.com', '$2b$12$...', 'super_admin', NOW()),
  ('Loan Officer', 'officer@lms.com', '$2b$12$...', 'loan_officer', NOW()),
  ('Credit Manager', 'manager@lms.com', '$2b$12$...', 'credit_manager', NOW());
```

Use Python to generate password hash:
```python
from app.core.security import hash_password
print(hash_password("your_password"))
```

### Workflow Example

1. **Customer Journey**
   - Register → Complete Profile → Apply for Loan → Upload Documents → Track Status

2. **Loan Officer Journey**
   - Login → View Applications → Move to Review → Request Documents → Move to Verification

3. **Credit Manager Journey**
   - Login → Approve/Reject Applications → Disburse Approved Loans → Record Payments → View Reports

## 📂 Project Structure

```
backend/
├── alembic/              # Database migrations
├── app/
│   ├── api/              # API route handlers
│   │   ├── auth.py
│   │   ├── customers.py
│   │   ├── loan_applications.py
│   │   ├── loan_products.py
│   │   ├── documents.py
│   │   ├── payments.py
│   │   ├── emi_schedule.py
│   │   ├── reports.py
│   │   ├── notifications.py
│   │   ├── dashboard.py
│   │   └── audit_logs.py
│   ├── core/             # Core configurations
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── redis.py
│   │   └── deps.py       # RBAC dependencies
│   ├── models/           # SQLAlchemy models (9 tables)
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic layer
│   ├── uploads/          # Document storage
│   └── main.py           # FastAPI app entry
├── seed_products.py      # Seed loan products
├── requirements.txt
└── .env

frontend/
├── app/
│   ├── applications/     # Loan applications
│   │   ├── page.tsx      # List view
│   │   ├── new/page.tsx  # Create application
│   │   └── [id]/page.tsx # Detail view
│   ├── customers/        # Customer management (staff)
│   ├── products/         # Loan products
│   ├── payments/         # Payment recording
│   ├── reports/          # CSV reports
│   ├── notifications/    # Notifications
│   ├── profile/          # Customer profile
│   ├── dashboard/        # Dashboard
│   ├── login/            # Login/Register
│   ├── layout.tsx        # Root layout with AuthProvider
│   └── globals.css
├── components/
│   ├── AppShell.tsx      # Auth guard + sidebar layout
│   └── Sidebar.tsx       # Role-based navigation
├── lib/
│   ├── api.ts            # Axios instance with JWT
│   └── auth.tsx          # Auth context provider
├── package.json
└── tailwind.config.ts
```

## 🔐 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Authentication**: Secure token-based auth with refresh token rotation
- **Role-Based Access Control**: Granular permissions per endpoint
- **Input Validation**: Pydantic schemas on backend, TypeScript on frontend
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- **File Upload Validation**: Type, size, extension checks
- **CORS Configuration**: Restricted to frontend origin
- **Redis Cache**: Secure session management and dashboard caching

## 🗄️ Database Schema

### Core Tables (9)
1. **users** - Authentication and roles
2. **customers** - Customer profiles with KYC
3. **loan_products** - Configurable loan products
4. **loan_applications** - Loan applications with status workflow
5. **documents** - Uploaded documents with verification status
6. **emi_schedule** - Generated EMI payment schedule
7. **payments** - Payment records
8. **audit_logs** - Audit trail
9. **notifications** - User notifications

### Key Relationships
- User (1) → Customer (1)
- Customer (1) → Applications (N)
- Application (1) → Documents (N)
- Application (1) → EMI Schedule (N)
- EMI (1) → Payments (N)

## 🔄 Loan Status Workflow

```
Draft → Submitted → Under Review → Document Verification → Approved/Rejected
                                                              ↓
                                                          Disbursed → Closed
```

**Transition Rules:**
- **Submitted → Under Review**: Loan Officer, Super Admin
- **Under Review → Document Verification**: Loan Officer, Super Admin
- **Document Verification → Approved/Rejected**: Credit Manager, Super Admin
- **Approved → Disbursed**: Credit Manager, Super Admin
- **Disbursed → Closed**: Automatic when all EMIs paid, or manual by Credit Manager

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - Login (all roles)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get current user

### Customers
- `POST /api/customers/` - Create customer profile
- `GET /api/customers/me` - Get own profile
- `PUT /api/customers/me` - Update own profile
- `GET /api/customers/` - List all (staff only)
- `GET /api/customers/{id}` - Get customer (staff only)

### Loan Applications
- `POST /api/loan-applications/` - Create application
- `GET /api/loan-applications/mine` - List own applications
- `GET /api/loan-applications/` - List all (staff only)
- `GET /api/loan-applications/{id}` - Get application
- `POST /api/loan-applications/{id}/submit` - Submit application
- `PATCH /api/loan-applications/{id}/status` - Change status (staff only)

### Loan Products
- `GET /api/loan-products/` - List products
- `POST /api/loan-products/` - Create product (super admin)
- `PUT /api/loan-products/{id}` - Update product (super admin)
- `DELETE /api/loan-products/{id}` - Delete product (super admin)

### Documents
- `POST /api/documents/{application_id}` - Upload document
- `GET /api/documents/` - List documents
- `PATCH /api/documents/{id}/verify` - Verify document (staff only)

### Payments
- `POST /api/payments/` - Record payment (staff only)
- `GET /api/payments/` - List payments

### Reports (Credit Manager, Super Admin)
- `GET /api/reports/loan-summary` - Loan summary CSV
- `GET /api/reports/collection` - Collection report CSV
- `GET /api/reports/outstanding` - Outstanding report CSV
- `GET /api/reports/emi/{application_id}` - EMI schedule CSV

### Dashboard
- `GET /api/dashboard/stats` - Aggregated statistics (cached)

### Notifications
- `GET /api/notifications/` - List notifications
- `PATCH /api/notifications/{id}/read` - Mark as read

## 🧪 Testing

### Backend Testing
```powershell
# Test with Swagger UI
http://127.0.0.1:8000/docs

# Or use provided test scripts
python test_loan_products_api.py
python test_frontend_flow.py
```

### Frontend Testing
1. Start both backend and frontend
2. Register as customer
3. Complete profile
4. Create and submit loan application
5. Login as staff (if staff user exists)
6. Process application through workflow

## 🚧 Known Limitations

1. **Overdue EMI Logic**: No scheduled job to auto-mark EMIs overdue past due date
2. **Email/SMS**: Notifications logged to DB only, no actual email/SMS integration
3. **Reports**: CSV export only (PDF/Excel not implemented)
4. **Bonus Features**: WebAuthn, OCR, AI credit scoring not implemented
5. **Customer Self-Payment**: Customers cannot record their own payments (staff only)

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+psycopg2://user:password@host:port/dbname
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key-minimum-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
APP_ENV=development
APP_NAME=Loan Management System
UPLOAD_DIR=app/uploads
MAX_UPLOAD_SIZE_MB=10
CORS_ORIGINS=http://localhost:3000
```

### Frontend
No `.env` needed - API URL hardcoded in `lib/api.ts` as `http://127.0.0.1:8000`

## 🤝 Contributing

This is a project submission. Not accepting contributions at this time.

## 📄 License

Academic/Educational Project - All rights reserved.

## 👨‍💻 Developer

Developed as part of a comprehensive loan management system project.

---

**Last Updated**: August 19, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
