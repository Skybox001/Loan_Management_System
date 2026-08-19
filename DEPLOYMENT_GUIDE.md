# Deployment Guide - Loan Management System

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Loan products seeded
- [ ] Staff users created in database
- [ ] Redis server running
- [ ] File upload directory exists and is writable
- [ ] CORS origins configured correctly
- [ ] SSL certificates ready (for production)
- [ ] Backup strategy defined

## Local Development Deployment (Windows)

### 1. Backend Deployment

```powershell
# Navigate to backend
cd "C:\Users\ASUS\OneDrive\Desktop\Projects\Loan Management system\backend"

# Activate virtual environment
.\venv\Scripts\activate

# Start Redis (separate terminal)
redis-server

# Start backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Access**: http://127.0.0.1:8000  
**API Docs**: http://127.0.0.1:8000/docs

### 2. Frontend Deployment

```powershell
# Navigate to frontend (new terminal)
cd "C:\Users\ASUS\OneDrive\Desktop\Projects\Loan Management system\frontend"

# Start development server
npm run dev
```

**Access**: http://localhost:3000

## Production Deployment Options

### Option 1: Cloud Platform (Recommended)

#### Deployment on Render.com

**Backend (FastAPI)**:
```yaml
# render.yaml
services:
  - type: web
    name: lms-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port 8000
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: CORS_ORIGINS
        value: https://your-frontend-url.com
```

**Database**: Use Render PostgreSQL or External PostgreSQL (e.g., Supabase, AWS RDS)

**Redis**: Use Render Redis or Upstash Redis (serverless)

**Frontend (Next.js)**:
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-backend-url.onrender.com"
  }
}
```

Deploy frontend to **Vercel** or **Netlify**

#### Deployment on AWS

**Architecture**:
- **EC2** for FastAPI backend (t2.micro for demo, t2.medium for prod)
- **RDS PostgreSQL** (Multi-AZ for production)
- **ElastiCache Redis** (Cluster mode for production)
- **S3** for document storage (instead of local filesystem)
- **CloudFront** + **S3** for Next.js static files
- **Application Load Balancer** for backend auto-scaling

**Steps**:

1. **Launch RDS PostgreSQL**
```bash
aws rds create-db-instance \
  --db-instance-identifier lms-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username lmsadmin \
  --master-user-password <strong-password> \
  --allocated-storage 20
```

2. **Launch ElastiCache Redis**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id lms-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

3. **Create EC2 instance and deploy backend**
```bash
# SSH into EC2
ssh -i keypair.pem ubuntu@<ec2-public-ip>

# Install dependencies
sudo apt update
sudo apt install python3-pip python3-venv nginx -y

# Clone repository
git clone <your-repo-url> /home/ubuntu/lms

# Setup backend
cd /home/ubuntu/lms/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env with production values
cat > .env << EOF
DATABASE_URL=postgresql+psycopg2://lmsadmin:<password>@<rds-endpoint>:5432/lms_db
REDIS_URL=redis://<elasticache-endpoint>:6379/0
JWT_SECRET_KEY=<generate-strong-key-here>
CORS_ORIGINS=https://your-frontend-domain.com
APP_ENV=production
EOF

# Run migrations
alembic upgrade head

# Seed data
python seed_products.py

# Setup systemd service
sudo cat > /etc/systemd/system/lms.service << EOF
[Unit]
Description=LMS FastAPI Application
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/lms/backend
Environment="PATH=/home/ubuntu/lms/backend/venv/bin"
ExecStart=/home/ubuntu/lms/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable lms
sudo systemctl start lms
```

4. **Configure NGINX reverse proxy**
```nginx
# /etc/nginx/sites-available/lms
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

5. **Deploy frontend to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### Option 2: Docker Deployment

**Backend Dockerfile**:
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile**:
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Docker Compose**:
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: lms_db
      POSTGRES_USER: lms_user
      POSTGRES_PASSWORD: lms_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+psycopg2://lms_user:lms_password@postgres:5432/lms_db
      REDIS_URL: redis://redis:6379/0
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      CORS_ORIGINS: http://localhost:3000
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend/app/uploads:/app/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Deploy**:
```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# Seed data
docker-compose exec backend python seed_products.py

# View logs
docker-compose logs -f backend
```

## Environment Configuration

### Backend Environment Variables

**Required**:
```env
DATABASE_URL=postgresql+psycopg2://user:pass@host:port/dbname
REDIS_URL=redis://host:port/0
JWT_SECRET_KEY=<minimum-32-character-secret>
```

**Optional** (with defaults):
```env
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
APP_ENV=production
APP_NAME=Loan Management System
UPLOAD_DIR=app/uploads
MAX_UPLOAD_SIZE_MB=10
CORS_ORIGINS=https://yourdomain.com
```

### Frontend Configuration

Update `lib/api.ts`:
```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});
```

Set environment variable:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Post-Deployment Tasks

### 1. Create Staff Users

Since staff registration is not public, create users via SQL:

```sql
-- Generate password hash first (use Python script)
-- python -c "from app.core.security import hash_password; print(hash_password('StrongPass@123'))"

INSERT INTO users (name, email, password_hash, role, created_at)
VALUES 
  ('System Admin', 'admin@yourdomain.com', '<hashed-password>', 'super_admin', NOW()),
  ('Jane Officer', 'officer@yourdomain.com', '<hashed-password>', 'loan_officer', NOW()),
  ('John Manager', 'manager@yourdomain.com', '<hashed-password>', 'credit_manager', NOW());
```

### 2. Verify Deployment

**Backend Health Check**:
```bash
curl https://api.yourdomain.com/api/auth/profile
# Should return 401 (authentication required)

curl https://api.yourdomain.com/docs
# Should return API documentation HTML
```

**Database Connection**:
```bash
# From backend server
python -c "from app.core.database import engine; engine.connect(); print('DB Connected')"
```

**Redis Connection**:
```bash
redis-cli -h <redis-host> PING
# Should return PONG
```

### 3. Load Test (Optional)

```bash
# Install locust
pip install locust

# Create locustfile.py
cat > locustfile.py << EOF
from locust import HttpUser, task, between

class LMSUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def view_products(self):
        self.client.get("/api/loan-products/")
EOF

# Run load test
locust -f locustfile.py --host=https://api.yourdomain.com
```

Visit http://localhost:8089 to configure and run tests.

## Monitoring & Maintenance

### Application Monitoring

**Logging**:
```python
# Add to main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

**Sentry Integration** (Error Tracking):
```bash
pip install sentry-sdk[fastapi]
```

```python
# main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
)
```

### Database Backups

**Automated PostgreSQL Backup**:
```bash
# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
pg_dump -h <rds-endpoint> -U lmsadmin lms_db | gzip > $BACKUP_DIR/lms_backup_$TIMESTAMP.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "lms_backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /home/ubuntu/backup.sh
```

### SSL Certificate Renewal

Let's Encrypt certificates auto-renew via certbot:
```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal cron job
sudo systemctl status certbot.timer
```

## Troubleshooting

### Backend Won't Start

**Check logs**:
```bash
sudo journalctl -u lms -n 50 --no-pager
```

**Common issues**:
1. Database connection failed → Check DATABASE_URL, security groups
2. Redis connection failed → Check REDIS_URL, ElastiCache access
3. Port already in use → Check if another process using port 8000

### Frontend Build Fails

**Check Node version**:
```bash
node --version  # Should be 18+
```

**Clear cache and rebuild**:
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Database Migration Issues

**Reset migrations** (DANGER - only in dev):
```bash
alembic downgrade base
alembic upgrade head
```

**Check migration status**:
```bash
alembic current
alembic history
```

## Security Hardening

### Production Security Checklist

- [ ] Change default JWT_SECRET_KEY to strong random value
- [ ] Enable HTTPS/SSL for all traffic
- [ ] Set secure cookie flags (httpOnly, secure, sameSite)
- [ ] Implement rate limiting (e.g., slowapi)
- [ ] Enable PostgreSQL SSL connections
- [ ] Restrict database access to backend IP only
- [ ] Use environment variables, never hardcode secrets
- [ ] Disable FastAPI debug mode (set APP_ENV=production)
- [ ] Implement CSRF protection for state-changing operations
- [ ] Regular security audits and dependency updates
- [ ] Setup WAF (Web Application Firewall) if using cloud
- [ ] Enable database query logging for audit

### Rate Limiting Example

```bash
pip install slowapi
```

```python
# main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/auth/login")
@limiter.limit("5/minute")
async def login(request: Request):
    ...
```

## Rollback Procedure

### Backend Rollback

```bash
# Stop service
sudo systemctl stop lms

# Restore previous version
cd /home/ubuntu/lms
git checkout <previous-commit-hash>

# Rollback migrations if needed
source venv/bin/activate
alembic downgrade -1

# Restart service
sudo systemctl start lms
```

### Database Rollback

```bash
# Restore from backup
gunzip < /home/ubuntu/backups/lms_backup_20260819_020000.sql.gz | psql -h <rds-endpoint> -U lmsadmin lms_db
```

## Cost Estimation (AWS)

### Development/Demo Setup (~$30-50/month)
- EC2 t2.micro: $8/month
- RDS db.t3.micro: $12/month
- ElastiCache cache.t3.micro: $11/month
- Data transfer: ~$5/month
- S3 storage (documents): ~$2/month

### Production Setup (~$150-300/month)
- EC2 t2.medium x 2 (Auto Scaling): $60/month
- RDS db.t3.medium (Multi-AZ): $80/month
- ElastiCache (Cluster): $40/month
- Load Balancer: $20/month
- Data transfer: ~$15/month
- S3 storage: ~$5/month
- CloudWatch/Monitoring: ~$10/month

---

**Last Updated**: August 19, 2026  
**Deployment Guide Version**: 1.0
