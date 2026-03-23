# Phase 4 — Testing Implementation Plan

> [!IMPORTANT]
> This phase runs AFTER Phase 3E (integration is complete and all flows verified manually).
> The testing pyramid: Unit Tests (base) → Integration Tests → Security Tests → E2E Tests (top).

---

## Prerequisites

- All Phase 3 implementation complete (backend + frontend + integration)
- PostgreSQL running with seeded data
- Both servers operational (backend :5000, frontend :5173)

---

## Step 1: Backend Unit Tests (BE-13)

### Setup

```bash
cd server
# Jest is already installed as devDependency
```

Create `server/jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['dotenv/config'],
};
```

Create `.env.test` in `server/` with a separate test database:
```
DATABASE_URL=postgresql://postgres:123@localhost:5432/real_estate_test_db
NODE_ENV=test
JWT_ACCESS_SECRET=test_access_secret
JWT_REFRESH_SECRET=test_refresh_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
BCRYPT_SALT_ROUNDS=4
MAX_LOGIN_ATTEMPTS=5
```

> [!WARNING]
> Use a SEPARATE test database. Never run tests against the development database.

### Test Files to Create

#### [NEW] `server/tests/unit/passwordUtils.test.js`
- `hashPassword` returns a hash different from input
- `comparePassword` returns true for matching password
- `comparePassword` returns false for wrong password

#### [NEW] `server/tests/unit/tokenUtils.test.js`
- `generateAccessToken` returns a valid JWT string
- `generateRefreshToken` returns a valid JWT string
- `verifyAccessToken` decodes a valid token
- `verifyAccessToken` throws on expired token
- Token payloads contain `userId`, `username`, `role`

#### [NEW] `server/tests/unit/validators.test.js`
- Auth validator: rejects empty username, empty password
- Property validator: rejects missing `propertyFileNumber`, invalid `nationalNumber`
- Request validator: rejects missing `propertyFileNumber`, missing `requestType`
- User validator: rejects weak passwords, missing fields

#### [NEW] `server/tests/unit/propertyService.test.js`
- Mock the model layer
- `listProperties` returns paginated results
- `getProperty` returns null for non-existent property
- `createProperty` calls model with correct data
- `deleteProperty` calls soft-delete

#### [NEW] `server/tests/unit/authService.test.js`
- Mock the model layer
- `login` with correct credentials returns tokens + user
- `login` with wrong password increments fail counter
- `login` on locked account throws error
- `login` locks account after MAX_LOGIN_ATTEMPTS

---

## Step 2: Backend Integration Tests (BE-14)

### Setup

Create `server/tests/setup.js`:
```javascript
const { pool, query } = require('../config/db');

beforeAll(async () => {
  // Run migrations on test DB
  // Seed test data
});

afterAll(async () => {
  // Clean up test data
  await pool.end();
});
```

### Test Files to Create

#### [NEW] `server/tests/integration/auth.test.js`

| Test Case | Method | Endpoint | Expected |
|-----------|--------|----------|----------|
| Login with valid credentials | POST | `/api/v1/auth/login` | 200, returns accessToken + sets cookie |
| Login with wrong password | POST | `/api/v1/auth/login` | 401, error message |
| Login with wrong password 5x | POST | `/api/v1/auth/login` | 423, account locked |
| Refresh token | POST | `/api/v1/auth/refresh-token` | 200, new accessToken |
| Logout | POST | `/api/v1/auth/logout` | 200, clears cookie |
| Access protected route without token | GET | `/api/v1/properties` | 401 |

#### [NEW] `server/tests/integration/properties.test.js`

| Test Case | Role | Method | Endpoint | Expected |
|-----------|------|--------|----------|----------|
| List properties | Admin | GET | `/api/v1/properties` | 200, array of properties |
| Get property detail | Admin | GET | `/api/v1/properties/1001` | 200, property object |
| Get reserved property (employee) | Employee | GET | `/api/v1/properties/1003` | 200, restricted fields only |
| Create property | Admin | POST | `/api/v1/properties` | 201, new property |
| Create property (employee) | Employee | POST | `/api/v1/properties` | 403 |
| Update property | Admin | PUT | `/api/v1/properties/1001` | 200, updated data |
| Delete property | Admin | DELETE | `/api/v1/properties/1005` | 200, soft deleted |
| Search properties | Admin | GET | `/api/v1/properties/search?ownerName=أحمد` | 200, filtered results |
| Search creates log | Admin | GET | `/api/v1/properties/search?...` | Log entry created |

#### [NEW] `server/tests/integration/requests.test.js`

| Test Case | Role | Method | Endpoint | Expected |
|-----------|------|--------|----------|----------|
| Submit request | Employee | POST | `/api/v1/requests` | 201, pending request |
| Submit request (admin) | Admin | POST | `/api/v1/requests` | 403 |
| List all requests | Admin | GET | `/api/v1/requests` | 200, all requests |
| List my requests | Employee | GET | `/api/v1/requests/my` | 200, own requests |
| Approve request | Admin | PATCH | `/api/v1/requests/:id/approve` | 200, property updated |
| Reject request | Admin | PATCH | `/api/v1/requests/:id/reject` | 200, no property change |
| Approve creates log | Admin | PATCH | `/api/v1/requests/:id/approve` | Log entry created |

#### [NEW] `server/tests/integration/users.test.js`

| Test Case | Role | Method | Endpoint | Expected |
|-----------|------|--------|----------|----------|
| List users | Admin | GET | `/api/v1/users` | 200, user array |
| List users (employee) | Employee | GET | `/api/v1/users` | 403 |
| Create user | Admin | POST | `/api/v1/users` | 201, new user |
| Reset password | Admin | PATCH | `/api/v1/users/:id/reset-password` | 200 |
| Unlock account | Admin | PATCH | `/api/v1/users/:id/unlock` | 200 |
| Delete user | Admin | DELETE | `/api/v1/users/:id` | 200, soft deleted |

#### [NEW] `server/tests/integration/reports.test.js`

| Test Case | Role | Method | Endpoint | Expected |
|-----------|------|--------|----------|----------|
| Export properties PDF | Admin | GET | `/api/v1/reports/properties/pdf` | 200, content-type: application/pdf |
| Export properties Excel | Admin | GET | `/api/v1/reports/properties/excel` | 200, content-type: spreadsheet |
| Export logs PDF (employee) | Employee | GET | `/api/v1/reports/logs/pdf` | 403 |

---

## Step 3: Security Tests (SC-01 to SC-09)

### [NEW] `server/tests/security/injection.test.js`
- SQL injection in search query params → should return empty results, NOT error
- SQL injection in login username → should return 401, NOT crash
- XSS in property `ownerName` → should be stored as plain text, not executed

### [NEW] `server/tests/security/authorization.test.js`
- Employee accessing admin-only endpoints → 403
- Employee trying to approve requests → 403
- Employee trying to delete properties → 403
- Employee accessing `محجوز` property detail → restricted fields only
- Accessing endpoints without token → 401
- Accessing endpoints with expired token → 401
- Accessing endpoints with tampered token → 401

### [NEW] `server/tests/security/rateLimit.test.js`
- Send 5 rapid login attempts → after limit, should get 429

### [NEW] `server/tests/security/headers.test.js`
- Verify `X-Content-Type-Options: nosniff` header present
- Verify `X-Frame-Options` header present
- Verify CORS only allows configured origin

### Security Audit Report

After running all tests, create `server/SecurityAudit.md` documenting:
- [ ] No SQL injection possible
- [ ] No XSS vectors
- [ ] No IDOR vulnerabilities
- [ ] No privilege escalation paths
- [ ] Tokens expire correctly
- [ ] Account lockout functions correctly
- [ ] Rate limiting blocks brute force
- [ ] Logs cannot be modified or deleted
- [ ] `محجوز` files are hidden from employees
- [ ] CORS only allows frontend origin
- [ ] Helmet headers present on all responses

---

## Step 4: Frontend Component Tests (FE-13)

### Setup

```bash
cd client
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom
```

Add to `vite.config.js`:
```javascript
test: {
  environment: 'jsdom',
  globals: true,
}
```

### Test Files to Create

#### [NEW] `client/src/__tests__/components/Button.test.jsx`
- Renders with children text
- Applies variant classes
- Shows spinner when loading
- Disabled when loading

#### [NEW] `client/src/__tests__/components/Badge.test.jsx`
- Renders correct color for each status

#### [NEW] `client/src/__tests__/pages/Login.test.jsx`
- Renders username and password fields
- Shows validation errors for empty fields
- Redirects authenticated users

---

## Step 5: E2E Tests (QA-03)

### Setup

```bash
cd client
npm install --save-dev playwright @playwright/test
npx playwright install
```

### [NEW] `client/e2e/auth.spec.js`
1. Admin login → verify redirect to dashboard
2. Wrong password → verify error toast
3. 5 failed logins → verify lockout message
4. Logout → verify redirect to login

### [NEW] `client/e2e/properties.spec.js`
1. Admin: Create property → verify in list
2. Admin: Edit property → verify updated
3. Admin: Delete property → verify removed
4. Employee: Verify no CRUD buttons visible

### [NEW] `client/e2e/requests.spec.js`
1. Employee: Submit request → verify in "my requests"
2. Admin: Approve request → verify property updated
3. Admin: Reject request → verify no property change

### [NEW] `client/e2e/reports.spec.js`
1. Admin: Download PDF → verify file
2. Admin: Download Excel → verify file

---

## Run Commands

```bash
# Backend unit tests
cd server && npm test

# Backend integration tests
cd server && npm test -- --testPathPattern=integration

# Security tests
cd server && npm test -- --testPathPattern=security

# Frontend tests
cd client && npx vitest run

# E2E tests
cd client && npx playwright test
```

---

## Deliverables

| File | Description |
|------|-------------|
| `server/tests/unit/*.test.js` | Unit tests for services, validators, utils |
| `server/tests/integration/*.test.js` | API endpoint integration tests |
| `server/tests/security/*.test.js` | Security vulnerability tests |
| `client/src/__tests__/**/*.test.jsx` | Frontend component tests |
| `client/e2e/*.spec.js` | End-to-end tests |
| `server/SecurityAudit.md` | Security audit checklist and results |
| `TestReport.md` | Final test results summary |
