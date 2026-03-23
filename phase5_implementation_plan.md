# Phase 5 — Deployment & Documentation Implementation Plan

> [!IMPORTANT]
> This is the final phase. It runs AFTER Phase 4 (all tests passing, security audit complete).
> Focus: production-ready deployment, user documentation, and final academic deliverables.

---

## Prerequisites

- All Phase 3 implementation complete and integrated
- All Phase 4 tests passing (unit, integration, security, E2E)
- Security audit report approved
- No critical or high-severity bugs remaining

---

## Step 1: Production Build Preparation

### 1.1 Frontend Build

```bash
cd client
npm run build
```

This produces `client/dist/` with optimized static files.

**Verify:**
- Build completes without errors or warnings
- Output file sizes are reasonable (JS < 300KB gzipped, CSS < 10KB gzipped)
- `dist/index.html` has correct `lang="ar"` and `dir="rtl"`

### 1.2 Backend Environment Config

Create `server/.env.production`:
```
DATABASE_URL=postgresql://user:password@production-host:5432/real_estate_prod
JWT_ACCESS_SECRET=<generate-64-char-random-string>
JWT_REFRESH_SECRET=<generate-64-char-random-string>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-production-domain.com
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
```

> [!CAUTION]
> Never commit `.env.production` to version control. Use `.gitignore`.

### 1.3 Database Migrations

```bash
cd server
NODE_ENV=production npm run migrate:up
npm run seed  # First time only — creates admin user
```

---

## Step 2: Nginx Reverse Proxy Configuration

### [NEW] `nginx/default.conf`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve React static files
    root /var/www/real-estate/client/dist;
    index index.html;

    # Frontend routes — always serve index.html for SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

---

## Step 3: Process Management with PM2

```bash
npm install -g pm2

# Start the backend
cd server
pm2 start server.js --name real-estate-api --env production

# Save the process list for auto-restart
pm2 save
pm2 startup  # Follow the instructions to enable auto-start on boot

# Monitor
pm2 status
pm2 logs real-estate-api
```

---

## Step 4: Deployment Checklist

Execute each item and check it off:

### Infrastructure
- [ ] PostgreSQL production database created and accessible
- [ ] Node.js installed on production server (v18+)
- [ ] Nginx installed and configured
- [ ] PM2 installed globally
- [ ] TLS certificate configured (Let's Encrypt / certbot)

### Application
- [ ] `NODE_ENV=production` set in environment
- [ ] Production `.env` file configured with real secrets
- [ ] Database migrations executed on production DB
- [ ] Admin user seeded (first deploy only)
- [ ] Frontend built (`npm run build` in client)
- [ ] Static files deployed to Nginx document root
- [ ] Backend started with PM2

### Security Verification
- [ ] HTTPS working (HTTP redirects to HTTPS)
- [ ] CORS only allows production frontend origin
- [ ] Helmet headers present on all API responses
- [ ] Rate limiting active on auth endpoints
- [ ] HttpOnly cookies set for refresh tokens
- [ ] Access tokens expire after 15 minutes
- [ ] No `.env` files in version control

### Smoke Tests
- [ ] Login page loads correctly (Arabic, RTL)
- [ ] Admin login succeeds
- [ ] Dashboard shows stats
- [ ] Property CRUD works
- [ ] Request approval works
- [ ] PDF/Excel exports download
- [ ] Audit logs record all actions
- [ ] Account lockout works after 5 failed attempts

---

## Step 5: Documentation

### [NEW] `README.md` (Project Root)

```markdown
# نظام إدارة الملفات العقارية
## Real Estate File Management System

### Quick Start

#### Prerequisites
- Node.js v18+
- PostgreSQL 14+

#### Installation
\```bash
# Backend
cd server
npm install
cp .env.example .env  # Edit with your DB credentials
npm run migrate:up
npm run seed

# Frontend
cd client
npm install
\```

#### Development
\```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
\```

Open http://localhost:5173

#### Default Credentials
| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Admin@2026 |
| Employee | employee1 | Employee@2026 |

#### Production Build
\```bash
cd client && npm run build
cd server && NODE_ENV=production node server.js
\```
```

### [NEW] `docs/UserManual.md`

User manual for end users. Sections:
1. **تسجيل الدخول** — How to login, logout, session expiry
2. **لوحة التحكم** — Dashboard overview for admin and employee
3. **إدارة العقارات** — Add, edit, delete, search properties (Admin)
4. **عرض العقارات** — View and search properties (Employee)
5. **نظام الطلبات** — Submit change requests (Employee), Approve/Reject (Admin)
6. **إدارة المستخدمين** — Add users, reset passwords, unlock accounts (Admin)
7. **سجل التدقيق** — View audit logs (Admin)
8. **التقارير** — Export PDF and Excel reports
9. **الأمان** — Account lockout, password policy, session security

Include screenshots of each page captured from the running application.

### [NEW] `docs/DeploymentGuide.md`

- Environment setup (Node.js, PostgreSQL, Nginx)
- Step-by-step deployment instructions
- Environment variable reference table
- SSL/TLS setup instructions
- PM2 process management
- Database backup strategy
- Troubleshooting common issues

### [NEW] `docs/ApiDocumentation.md`

- All API endpoints with method, URL, access level, request body, response format
- Authentication flow (JWT + refresh token)
- Error response format
- Rate limiting rules
- Example requests and responses for each endpoint

---

## Step 6: Academic Deliverables

### [NEW] `docs/FinalReport.md`

The final academic project report. Sections:
1. **ملخص المشروع** — Project summary
2. **المقدمة** — Introduction and problem statement
3. **الأهداف** — Goals and success metrics
4. **تحليل المتطلبات** — Requirements analysis
5. **تصميم النظام** — System architecture, database design, API design
6. **التنفيذ** — Implementation details per module
7. **الاختبار** — Testing strategy and results
8. **الأمان** — Security measures implemented
9. **النشر** — Deployment architecture
10. **الخلاصة** — Conclusions and future work

---

## Deliverables Summary

| File | Description |
|------|-------------|
| `client/dist/` | Production-ready frontend build |
| `nginx/default.conf` | Nginx configuration |
| `README.md` | Project setup instructions |
| `docs/UserManual.md` | End-user manual with screenshots |
| `docs/DeploymentGuide.md` | Server deployment guide |
| `docs/ApiDocumentation.md` | API reference documentation |
| `docs/FinalReport.md` | Academic final report |
| `server/SecurityAudit.md` | Security audit results (from Phase 4) |
| `TestReport.md` | Test results summary (from Phase 4) |
