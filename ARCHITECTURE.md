# Loan Management System - Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js Frontend (Port 3000)                 │  │
│  │  - React Components with TypeScript                       │  │
│  │  - Tailwind CSS Styling                                   │  │
│  │  - Axios HTTP Client with JWT Interceptor                 │  │
│  │  - Context API for State Management                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/HTTP
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FastAPI Backend (Port 8000)                  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  API Layer (Routers)                               │  │  │
│  │  │  - Auth, Customers, Loans, Products, Payments      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Business Logic Layer (Services)                   │  │  │
│  │  │  - Application workflow, EMI calculation,          │  │  │
│  │  │    Payment processing, Report generation           │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Security Layer (Core)                             │  │  │
│  │  │  - JWT Auth, RBAC, Password Hashing (Bcrypt)      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    ↓                          ↓
┌───────────────────────────────┐   ┌──────────────────────────┐
│       DATA TIER               │   │     CACHE TIER           │
│  ┌─────────────────────────┐  │   │  ┌───────────────────┐  │
│  │   PostgreSQL (5432)     │  │   │  │  Redis (6379)     │  │
│  │  - 9 Core Tables        │  │   │  │  - Dashboard      │  │
│  │  - ACID Compliance      │  │   │  │    Stats Cache    │  │
│  │  - Foreign Key          │  │   │  │  - Session Data   │  │
│  │    Relationships        │  │   │  └───────────────────┘  │
│  └─────────────────────────┘  │   └──────────────────────────┘
└───────────────────────────────┘
```

## Component Architecture

### Backend Architecture (Layered Pattern)

```
┌───────────────────────────────────────────────────────────────┐
│                         main.py (Entry Point)                  │
│  - FastAPI App Initialization                                  │
│  - CORS Middleware Configuration                               │
│  - Router Registration                                         │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                    API Layer (app/api/)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   auth.py   │ │customers.py │ │loan_apps.py │ ...        │
│  │  - register │ │ - CRUD ops  │ │ - workflow  │            │
│  │  - login    │ │ - profile   │ │ - status    │            │
│  │  - refresh  │ │ - search    │ │ - submit    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│              Business Logic Layer (app/services/)              │
│  ┌──────────────────────┐  ┌──────────────────────┐          │
│  │ loan_application_    │  │  emi_service.py      │          │
│  │ service.py           │  │  - Schedule          │          │
│  │ - TRANSITIONS map    │  │    generation        │          │
│  │ - Status validation  │  │  - Amortization      │          │
│  │ - Approval workflow  │  │    calculation       │          │
│  └──────────────────────┘  └──────────────────────┘          │
│  ┌──────────────────────┐  ┌──────────────────────┐          │
│  │ payment_service.py   │  │  audit_service.py    │          │
│  │ - Payment recording  │  │  - Logging           │          │
│  │ - Auto-close logic   │  │  - Change tracking   │          │
│  └──────────────────────┘  └──────────────────────┘          │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                 Data Access Layer (app/models/)                │
│  - SQLAlchemy ORM Models                                       │
│  - Relationships & Constraints                                 │
└───────────────────────────────────────────────────────────────┘
```

### Frontend Architecture (Component Hierarchy)

```
┌───────────────────────────────────────────────────────────────┐
│                      app/layout.tsx (Root)                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │            AuthProvider (lib/auth.tsx)               │    │
│  │  - User state management                             │    │
│  │  - Login/Logout handlers                             │    │
│  │  - Profile fetching                                  │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                      Page Components                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   /login     │  │  /dashboard  │  │  /profile    │       │
│  │  Public      │  │  Protected   │  │  Customer    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │/applications │  │  /customers  │  │  /products   │       │
│  │ Role-based   │  │  Staff only  │  │  All roles   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  /payments   │  │   /reports   │  │/notifications│       │
│  │  Staff only  │  │  Staff only  │  │  All roles   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                  Shared Components (components/)               │
│  ┌────────────────────────┐  ┌────────────────────────┐      │
│  │   AppShell.tsx         │  │   Sidebar.tsx          │      │
│  │  - Auth guard wrapper  │  │  - Role-based nav      │      │
│  │  - Layout with sidebar │  │  - Active route        │      │
│  └────────────────────────┘  └────────────────────────┘      │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌───────────────────────────────────────────────────────────────┐
│                    HTTP Client (lib/api.ts)                    │
│  - Axios instance with baseURL                                 │
│  - Request interceptor: Attach JWT from cookies                │
│  - Response interceptor: Handle 401, redirect to login         │
└───────────────────────────────────────────────────────────────┘
```

## Database Schema (ER Diagram)

```
┌──────────────────┐
│      users       │
├──────────────────┤
│ PK: id           │
│    name          │
│    email (UK)    │
│    password_hash │
│    role (enum)   │
│    created_at    │
└────────┬─────────┘
         │ 1
         │
         │ 1
┌────────▼─────────┐         ┌──────────────────┐
│    customers     │         │  loan_products   │
├──────────────────┤         ├──────────────────┤
│ PK: id           │         │ PK: id           │
│ FK: user_id      │         │    name          │
│    full_name     │         │    min_amount    │
│    phone         │         │    max_amount    │
│    dob           │         │    interest_rate │
│    pan (UK)      │         │    max_tenure    │
│    aadhaar (UK)  │         │    processing_fee│
│    address       │         │    created_at    │
│    employment_   │         └────────┬─────────┘
│    ...banking    │                  │ 1
│    created_at    │                  │
└────────┬─────────┘                  │
         │ 1                          │
         │                            │
         │ N                          │ N
┌────────▼────────────────────────────▼──────┐
│           loan_applications                │
├────────────────────────────────────────────┤
│ PK: id                                     │
│ FK: customer_id                            │
│ FK: loan_product_id                        │
│    amount                                  │
│    interest_rate                           │
│    tenure                                  │
│    purpose                                 │
│    monthly_income                          │
│    existing_emis                           │
│    status (enum)                           │
│    reviewed_by, approved_by (FK: users)    │
│    rejection_reason                        │
│    created_at, updated_at                  │
└────────┬───────────────┬───────────────────┘
         │ 1             │ 1
         │               │
         │ N             │ N
┌────────▼──────┐  ┌─────▼──────────┐
│  documents    │  │  emi_schedule  │
├───────────────┤  ├────────────────┤
│ PK: id        │  │ PK: id         │
│ FK: loan_app  │  │ FK: loan_app   │
│    doc_type   │  │    emi_number  │
│    file_path  │  │    due_date    │
│    file_size  │  │    principal   │
│    status     │  │    interest    │
│    verified_by│  │    emi_amount  │
│    remarks    │  │    outstanding │
│    uploaded_at│  │    status      │
└───────────────┘  └────────┬───────┘
                            │ 1
                            │
                            │ N
                    ┌───────▼──────┐
                    │   payments   │
                    ├──────────────┤
                    │ PK: id       │
                    │ FK: emi_id   │
                    │    amount    │
                    │    mode      │
                    │    txn_id(UK)│
                    │    status    │
                    │    paid_at   │
                    │    recorded_ │
                    │    by        │
                    └──────────────┘

┌──────────────────┐          ┌──────────────────┐
│   audit_logs     │          │  notifications   │
├──────────────────┤          ├──────────────────┤
│ PK: id           │          │ PK: id           │
│ FK: user_id      │          │ FK: user_id      │
│    action        │          │    title         │
│    entity_type   │          │    message       │
│    entity_id     │          │    is_read       │
│    details       │          │    created_at    │
│    created_at    │          └──────────────────┘
└──────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
UK = Unique Key
```

## Loan Application State Machine

```
                    ┌─────────────┐
                    │    DRAFT    │
                    └──────┬──────┘
                           │
                      (Customer submits)
                           │
                           ▼
                    ┌─────────────┐
              ┌─────┤  SUBMITTED  ├─────┐
              │     └─────────────┘     │
              │                         │
    (Loan Officer reviews)      (Loan Officer rejects)
              │                         │
              ▼                         ▼
       ┌─────────────┐           ┌──────────┐
  ┌────┤UNDER_REVIEW ├────┐      │ REJECTED │
  │    └─────────────┘    │      └──────────┘
  │                       │
(LO approves)       (LO rejects)
  │                       │
  ▼                       ▼
┌─────────────────────┐ ┌──────────┐
│ DOCUMENT_           │ │ REJECTED │
│ VERIFICATION        │ └──────────┘
└──────┬──────────────┘
       │
       │ (Credit Manager reviews docs)
       │
       ├─────────┬─────────┐
       │         │         │
  (Approve) (Reject)  (Verify more)
       │         │         │
       ▼         ▼         ▼
┌──────────┐ ┌──────────┐ (Loop back)
│ APPROVED │ │ REJECTED │
└────┬─────┘ └──────────┘
     │
     │ (Credit Manager disburses)
     │
     ▼
┌──────────┐
│DISBURSED │
└────┬─────┘
     │
     │ (All EMIs paid or manual close)
     │
     ▼
┌──────────┐
│  CLOSED  │
└──────────┘

TRANSITIONS Matrix:
submitted → under_review, rejected (loan_officer, super_admin)
under_review → document_verification, rejected (loan_officer, super_admin)
document_verification → approved, rejected (credit_manager, super_admin)
approved → disbursed (credit_manager, super_admin)
disbursed → closed (credit_manager, super_admin, auto)
```

## Authentication Flow

```
┌────────┐                    ┌──────────┐                ┌──────────┐
│ Client │                    │ Frontend │                │  Backend │
└───┬────┘                    └────┬─────┘                └────┬─────┘
    │                              │                           │
    │ 1. User fills login form     │                           │
    ├─────────────────────────────>│                           │
    │                              │                           │
    │                              │ 2. POST /api/auth/login   │
    │                              │   {email, password}       │
    │                              ├──────────────────────────>│
    │                              │                           │
    │                              │                    3. Verify password
    │                              │                       (bcrypt compare)
    │                              │                           │
    │                              │ 4. Generate JWT tokens    │
    │                              │    - access_token (30min) │
    │                              │    - refresh_token (7d)   │
    │                              │<──────────────────────────┤
    │                              │                           │
    │ 5. Store tokens in cookies   │                           │
    │    (js-cookie)               │                           │
    │<─────────────────────────────┤                           │
    │                              │                           │
    │ 6. Subsequent requests       │                           │
    │    include Bearer token      │                           │
    │                              │ GET /api/customers/me     │
    │                              │ Authorization: Bearer xxx │
    │                              ├──────────────────────────>│
    │                              │                           │
    │                              │                    7. Verify JWT
    │                              │                       (decode token)
    │                              │                       (check expiry)
    │                              │                           │
    │                              │ 8. Return user data       │
    │                              │<──────────────────────────┤
    │                              │                           │
    │ 9. If 401 → redirect to /login                          │
    │    Interceptor clears cookies                           │
    │<─────────────────────────────┤                           │
    │                              │                           │

Refresh Flow (when access token expires):
    │                              │                           │
    │                              │ POST /api/auth/refresh    │
    │                              │ {refresh_token}           │
    │                              ├──────────────────────────>│
    │                              │                           │
    │                              │ New access + refresh      │
    │                              │ (token rotation)          │
    │                              │<──────────────────────────┤
    │                              │                           │
```

## Payment & EMI Flow

```
┌────────────────┐
│ Loan Approved  │
└────────┬───────┘
         │
         │ (Auto-trigger)
         ▼
┌────────────────────────────┐
│ EMI Service                │
│ - Calculate amortization   │
│ - Generate N EMI records   │
│   (reducing balance)       │
│ - Store in emi_schedule    │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Loan Status: DISBURSED     │
│ EMI Records Created        │
│ Status: PENDING            │
└────────┬───────────────────┘
         │
         │ (Staff records payment)
         ▼
┌────────────────────────────┐
│ Payment Service            │
│ 1. Validate EMI exists     │
│ 2. Validate amount         │
│ 3. Check unique txn_id     │
│ 4. Create payment record   │
│ 5. Update EMI status       │
│    → PAID if amount=EMI    │
└────────┬───────────────────┘
         │
         │ (Check if all EMIs paid)
         ▼
┌────────────────────────────┐
│ Is Last EMI?               │
└─────┬────────────────┬─────┘
      │ NO             │ YES
      │                │
      ▼                ▼
   Continue      ┌──────────────┐
                 │ Auto-close   │
                 │ loan status  │
                 │ → CLOSED     │
                 └──────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Authentication Layer                                      │
│    - JWT tokens (HS256 algorithm)                           │
│    - Bcrypt password hashing (12 rounds)                    │
│    - Token expiry: Access 30min, Refresh 7 days            │
│    - Token rotation on refresh                              │
│                                                             │
│ 2. Authorization Layer (RBAC)                               │
│    - Role enum: customer, loan_officer,                     │
│                 credit_manager, super_admin                 │
│    - Endpoint-level guards via dependencies                 │
│    - require_roles() factory for multi-role access          │
│                                                             │
│ 3. Input Validation                                         │
│    - Pydantic schemas (backend)                             │
│    - TypeScript types (frontend)                            │
│    - File upload validation (type, size, extension)         │
│                                                             │
│ 4. Data Protection                                          │
│    - SQL Injection: SQLAlchemy ORM                          │
│    - XSS: React escaping, no dangerouslySetInnerHTML       │
│    - CSRF: SameSite cookies (if implemented)                │
│    - CORS: Restricted to frontend origin                    │
│                                                             │
│ 5. Sensitive Data                                           │
│    - PAN/Aadhaar unique constraints                         │
│    - No plaintext password storage                          │
│    - .env for secrets (not in git)                          │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture (Recommended)

```
┌──────────────────────────────────────────────────────────────┐
│                        Load Balancer                          │
│                     (NGINX / Cloudflare)                      │
└────────────────────┬───────────────────┬─────────────────────┘
                     │                   │
        ┌────────────▼────────┐  ┌───────▼────────────┐
        │  Frontend Instance  │  │ Backend Instance   │
        │  (Next.js Server)   │  │ (FastAPI + Uvicorn)│
        │  Port 3000          │  │ Port 8000          │
        └─────────────────────┘  └──────────┬─────────┘
                                            │
                     ┌──────────────────────┼────────────────┐
                     │                      │                │
          ┌──────────▼─────────┐  ┌─────────▼──────┐  ┌─────▼──────┐
          │ PostgreSQL (RDS)   │  │ Redis (ElastiC)│  │ S3 Bucket  │
          │ Multi-AZ           │  │ Cache Cluster  │  │ (Documents)│
          └────────────────────┘  └────────────────┘  └────────────┘
```

## Technology Choices & Rationale

| Component | Technology | Why? |
|-----------|-----------|------|
| Backend Framework | FastAPI | High performance, automatic API docs, type safety, async support |
| Database | PostgreSQL | ACID compliance, JSON support, robust for financial data |
| Cache | Redis | Fast in-memory operations, perfect for dashboard stats |
| ORM | SQLAlchemy | Mature, prevents SQL injection, easy migrations |
| Auth | JWT | Stateless, scalable, works well with SPAs |
| Frontend Framework | Next.js | SSR/SSG capable, great DX, file-based routing |
| Styling | Tailwind CSS | Rapid development, consistent design system |
| Type Safety | TypeScript | Catch errors at compile time, better IDE support |

## Performance Optimizations

1. **Dashboard Caching**: Redis cache for aggregated stats (60s TTL)
2. **Database Indexing**: Indexes on foreign keys, email, PAN, Aadhaar
3. **Pagination**: List endpoints support skip/limit
4. **Lazy Loading**: Frontend loads data on-demand
5. **JWT Refresh**: Avoid frequent re-login
6. **File Size Limits**: 10MB max to prevent DoS

## Scalability Considerations

1. **Horizontal Scaling**: Stateless backend can scale horizontally
2. **Database Connection Pooling**: SQLAlchemy pool management
3. **Cache Layer**: Redis reduces database load
4. **Async Operations**: FastAPI async endpoints for I/O operations
5. **CDN**: Static assets can be served via CDN
6. **Microservices**: Can split into services (auth, loans, payments) if needed

---

**Document Version**: 1.0  
**Last Updated**: August 19, 2026  
**Maintained By**: LMS Development Team
