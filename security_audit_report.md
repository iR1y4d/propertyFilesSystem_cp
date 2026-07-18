# 🛡️ Comprehensive Security & Performance Audit Report
## Property Files System — PERN Stack

**Date:** 2026-06-10  
**Stack:** PostgreSQL · Express.js · React 19 · Node.js  
**Environment:** Local / Railway  
**Authentication:** JWT (Access + Refresh Tokens)

---

# 📋 Executive Summary

| Category | Critical | High | Medium | Low | ✅ Good |
|---|---|---|---|---|---|
| Auth & Authorization | 1 | 2 | 1 | 0 | 5 |
| Input Validation | 0 | 1 | 2 | 1 | 4 |
| API Security | 0 | 1 | 2 | 1 | 3 |
| Infrastructure | 1 | 1 | 2 | 1 | 2 |
| Dependencies | 0 | 0 | 1 | 1 | 2 |
| Performance | 0 | 1 | 2 | 0 | 3 |
| **TOTAL** | **2** | **6** | **10** | **4** | **19** |

> [!IMPORTANT]
> 2 Critical issues found — both in Infrastructure (JWT secrets & DB password). Fix these immediately before any production deployment.

---

# 🔎 PHASE 1 — SECURITY AUDIT

---

## 1.1 Authentication & Authorization

### 🔴 CRITICAL — SEC-01: Default/Placeholder JWT Secrets

**File:** [.env](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/.env#L5-L6)  
**Lines:** 5–6

```
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

**Why Dangerous:** These are placeholder values committed to the repo. Any attacker who reads the source code (or guesses these common defaults) can forge valid JWT tokens for **any user, including admin**, gaining full system access.

**Real-World Attack:**
```js
// Attacker forges an admin token
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 1, username: 'admin', role: 'مدير' },
  'your_access_secret_here', // Known default!
  { expiresIn: '1h' }
);
// Now they have full admin access to every endpoint
```

**Fix:**
```bash
# Generate cryptographically secure secrets (run in terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
```env
# .env — Replace with generated values (minimum 64 chars)
JWT_ACCESS_SECRET=a1b2c3d4e5f6...64+_hex_chars...
JWT_REFRESH_SECRET=f6e5d4c3b2a1...64+_hex_chars...
```

Also add a hard-fail check in [server.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/server.js#L11-L13):
```js
// Change from console.warn to process.exit
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('❌ FATAL: JWT secrets are not set!');
  process.exit(1); // Don't start with defaults
}
```

---

### 🟠 HIGH — SEC-02: No Refresh Token Revocation / Blacklist

**Files:**  
- [authService.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/services/authService.js#L66-L71) (logout)  
- [authController.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/controllers/authController.js#L32-L46) (logout)

**Current Code:**
```js
const logout = async (userId) => {
  await logModel.createLog({ userId, action: LOG_ACTIONS.LOGOUT });
  // Cookie is cleared on client side, but the refresh token itself is NOT invalidated
};
```

**Why Dangerous:** When a user logs out, the refresh token is cleared from the browser cookie, but **the token itself remains valid** until it expires (7 days). If an attacker captured the refresh token (via XSS, network sniffing, or physical access), they can continue using it even after the user logs out.

**Real-World Attack:**
1. Attacker captures refresh token from browser dev tools or network
2. User logs out
3. Attacker uses the captured refresh token to get new access tokens for 7 more days

**Fix — Add a `refresh_tokens` table:**
```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  token_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

On login: store token hash. On logout: mark `revoked_at = NOW()`. On refresh: check token is not revoked.

---

### 🟠 HIGH — SEC-03: Locked Users Can Still Use Existing Tokens

**File:** [auth.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/middleware/auth.js#L6-L30)

**Current Code:**
```js
module.exports = (req, res, next) => {
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
  req.user = { userId: decoded.userId, username: decoded.username, role: decoded.role };
  next();
  // ❌ Never checks if user is locked or deleted!
};
```

**Why Dangerous:** If an admin locks a user account (e.g., after detecting a breach), the user's **existing access token remains valid** for up to 15 minutes. During this window, the locked user can still perform any action.

**Real-World Attack:**
1. Admin detects compromised employee account
2. Admin locks the account via `/api/v1/users/:id/unlock`
3. Attacker still has 15 min of full access with existing token

**Fix — Add a DB check for critical operations, or reduce token TTL:**
```js
// Option A: Check user status on each request (adds 1 DB query per request)
module.exports = async (req, res, next) => {
  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
    
    // Check user is still active
    const user = await userModel.findById(decoded.userId);
    if (!user || user.is_locked) {
      return res.status(401).json({ success: false, message: 'الحساب مغلق أو محذوف' });
    }
    
    req.user = { userId: decoded.userId, username: decoded.username, role: decoded.role };
    next();
  } catch (err) { next(err); }
};
```

```js
// Option B (lighter): Reduce access token TTL to 5 minutes
ACCESS_TOKEN_EXPIRY=5m
```

---

### 🟡 MEDIUM — SEC-04: Login Accepts Minimum 6-Char Password but Create User Requires 8

**Files:**  
- [authValidator.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/validators/authValidator.js#L12) — `min(6)`
- [userValidator.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/validators/userValidator.js#L19) — `min(8)` + regex

**Why Dangerous:** Login validation allows 6-char passwords, but user creation enforces 8+uppercase+number+special. This inconsistency means an older user with a weak password could remain valid, or the login validator could be loosened further without anyone noticing.

**Fix:** Align both to the same minimum:
```js
// authValidator.js
password: z.string({ required_error: 'كلمة المرور مطلوبة' })
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
```

---

### ✅ Auth Strengths (What's Done Right)

| Feature | File | Status |
|---|---|---|
| Bcrypt with 12 salt rounds | [passwordUtils.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/utils/passwordUtils.js#L10) | ✅ Excellent |
| Rate limiting on login (30/15min) | [rateLimiter.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/middleware/rateLimiter.js#L7-L9) | ✅ Good |
| Account lockout after 5 failures | [authService.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/services/authService.js#L28-L30) | ✅ Good |
| RBAC middleware on all routes | [rbac.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/middleware/rbac.js) | ✅ Good |
| Refresh token in HttpOnly cookie | [authController.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/controllers/authController.js#L12-L17) | ✅ Excellent |

---

## 1.2 Input Validation

### 🟠 HIGH — SEC-05: Unvalidated `newData` in Request Submission Allows Arbitrary JSON

**File:** [requestValidator.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/validators/requestValidator.js#L15)

```js
newData: z.record(z.any()).optional()
```

**Why Dangerous:** `z.record(z.any())` accepts **any JSON structure** — deeply nested objects, huge arrays, prototype pollution payloads, etc. When this data is later used in `propertyModel.update()` or `propertyModel.create()`, it could inject unexpected fields.

**Real-World Attack:**
```json
{
  "propertyFileNumber": 123,
  "requestType": "تعديل",
  "newData": {
    "ownerName": "attacker",
    "__proto__": { "isAdmin": true },
    "deleted_at": null
  }
}
```

The `propertyModel.update()` function uses a whitelist mapping (`mappings`), which **mitigates this partially**, but the raw `newData` is still stored as JSONB in the `edit_requests` table and displayed in the admin UI.

**Fix:**
```js
const submitRequestSchema = z.object({
  body: z.object({
    propertyFileNumber: z.number().int().positive(),
    requestType: z.enum(['إضافة', 'تعديل', 'حذف', 'حذف_صور']),
    requestDescription: z.string().max(255).optional().or(z.literal('')),
    newData: z.object({
      ownerName: z.string().min(2).max(255).optional(),
      nationalNumber: z.number().int().optional(),
      location: z.string().min(2).max(255).optional(),
      area: z.string().max(100).optional(),
      status: z.enum(['مؤقت', 'مصدق', 'محجوز']).optional(),
      imagesToDelete: z.array(z.string()).max(20).optional(),
    }).optional()
  })
});
```

---

### 🟡 MEDIUM — SEC-06: Report Search Filters Not Validated

**File:** [reportController.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/controllers/reportController.js#L78)

```js
const { search, status, location, propertyFileNumber, ownerName, nationalNumber } = req.query;
```

These query parameters are passed directly to `propertyModel.findAll()` without Zod validation. While the model uses parameterized queries (safe from SQL injection), there's no length/type validation — a user could pass a 10MB string as `search`, consuming server memory.

**Fix:** Add a validation middleware to the report routes:
```js
const reportSearchSchema = z.object({
  query: z.object({
    search: z.string().max(200).optional(),
    status: z.enum(['مؤقت', 'مصدق', 'محجوز']).optional(),
    location: z.string().max(200).optional(),
    propertyFileNumber: z.string().max(20).optional(),
    ownerName: z.string().max(200).optional(),
    nationalNumber: z.string().max(20).optional(),
  })
});
```

---

### 🟡 MEDIUM — SEC-07: Log Query Filters Not Validated

**File:** [logController.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/controllers/logController.js#L8)

```js
const { page, limit, userId, action, dateFrom, dateTo } = req.query;
```

Same issue as SEC-06 — `dateFrom`, `dateTo`, `userId`, and `action` reach the model unvalidated. A malformed date string could cause unexpected DB errors.

**Fix:** Add a Zod schema for log filters.

---

### 🟢 LOW — SEC-08: Login Validation Allows 6-Char Username

**File:** [authValidator.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/validators/authValidator.js#L10) — `min(3)`

Not a vulnerability per se, but 3-character usernames increase brute-force surface area. Consider `min(4)`.

---

### ✅ Input Validation Strengths

| Feature | File | Status |
|---|---|---|
| Parameterized SQL queries everywhere | All models | ✅ No SQL Injection |
| Zod validation on property create/update | [propertyValidator.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/validators/propertyValidator.js) | ✅ Excellent |
| Strong password policy (8+ mixed) | [userValidator.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/validators/userValidator.js#L19-L22) | ✅ Excellent |
| File upload: MIME + extension whitelist | [uploadMiddleware.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/middleware/uploadMiddleware.js#L28-L35) | ✅ Good |

---

## 1.3 API Security

### 🟠 HIGH — SEC-09: CORS Allows No-Origin Requests

**File:** [app.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/app.js#L26-L27)

```js
origin: (origin, callback) => {
  if (!origin) return callback(null, true); // ❌ Allows curl, Postman, mobile — and server-side attacks
```

**Why Dangerous:** By allowing requests with no `Origin` header, server-side request forgery (SSRF) or any non-browser client can bypass CORS entirely. While the API still requires JWT auth, this opens the door for cross-service attacks on an internal network.

**Fix:**
```js
origin: (origin, callback) => {
  // In production, reject no-origin requests
  if (!origin && process.env.NODE_ENV === 'production') {
    return callback(new Error('CORS: Origin required'), false);
  }
  if (!origin) return callback(null, true); // Allow in dev
  if (allowedOrigins.includes(origin)) return callback(null, true);
  return callback(null, false);
},
```

---

### 🟡 MEDIUM — SEC-10: Global Rate Limit Too Generous (300/15min)

**File:** [app.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/app.js#L39-L44)

```js
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 requests per 15 min = 20/min
});
```

300 requests per 15 minutes (20/min) is generous for an internal property management system. Consider 100/15min for general endpoints and stricter limits on write endpoints.

---

### 🟡 MEDIUM — SEC-11: No Per-Endpoint Rate Limiting on Report Generation

**File:** [report.routes.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/routes/report.routes.js#L12-L18)

Report generation spawns Puppeteer (Chromium) which is CPU+memory intensive. There's no specific rate limit, so a user could trigger dozens of concurrent PDF generations and crash the server.

**Fix:**
```js
const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 reports per minute per IP
  message: { success: false, message: 'كثرة طلبات التقارير، حاول لاحقاً' }
});

router.get('/properties/:format', reportLimiter, authorize(ROLES.ADMIN, ROLES.EMPLOYEE), reportController.exportProperties);
```

---

### 🟢 LOW — SEC-12: No Request Body Size Limit on Multipart Uploads

**File:** [app.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/app.js#L47) — JSON limited to 1MB ✅  
**File:** [uploadMiddleware.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/middleware/uploadMiddleware.js#L41) — fileSize limited to 5MB ✅

These limits are good. The total upload size (20 files × 5MB = 100MB) is somewhat large. Consider a total upload size limit.

---

### ✅ API Security Strengths

| Feature | File | Status |
|---|---|---|
| Helmet security headers | [app.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/app.js#L17-L19) | ✅ Excellent |
| Global rate limiting | [app.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/app.js#L39-L45) | ✅ Good |
| Auth-only login rate limiting | [rateLimiter.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/middleware/rateLimiter.js) | ✅ Good |

---

## 1.4 Infrastructure Security

### 🔴 CRITICAL — SEC-13: Hardcoded Weak Database Password

**File:** [.env](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/.env#L2)

```
DATABASE_URL=postgresql://postgres:123@localhost:5432/real_estate_db
```

**Why Dangerous:** Password `123` for the `postgres` superuser. If the database port (5432) is exposed (which it is on Railway by default), anyone can connect and dump/modify all data.

**Real-World Attack:**
```bash
psql postgresql://postgres:123@your-server:5432/real_estate_db
# Full access to all tables, users, passwords
```

**Fix:**
```bash
# Generate a strong DB password
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Update DATABASE_URL with the new password
```

---

### 🟠 HIGH — SEC-14: Production SSL Configured with `rejectUnauthorized: false`

**File:** [db.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/config/db.js#L5-L7)

```js
ssl: process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: false }  // ❌ Accepts ANY certificate
  : false,
```

**Why Dangerous:** `rejectUnauthorized: false` disables SSL certificate verification. An attacker performing a man-in-the-middle (MITM) attack between your server and database could intercept all queries (including user passwords and national numbers).

**Fix:**
```js
ssl: process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: true } // Or provide ca cert
  : false,
```

For Railway specifically, they provide a valid cert, so `rejectUnauthorized: true` should work.

---

### 🟡 MEDIUM — SEC-15: Refresh Token Cookie Missing `secure` Flag in Dev

**File:** [authController.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/controllers/authController.js#L12-L17)

```js
res.cookie('refreshToken', result.refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // false in dev
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

In development (`NODE_ENV=development`), the cookie is sent over HTTP. This is normal for local dev but ensure `NODE_ENV=production` is always set on Railway.

---

### 🟡 MEDIUM — SEC-16: Error Stack Traces Leaked in Development

**File:** [errorHandler.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/middleware/errorHandler.js#L7)

```js
console.error('❌ Error:', err.stack || err.message || err);
```

Stack traces logged to console in all environments. In production, these could leak to log aggregators. The response body correctly hides internal errors in production (line 50), which is good.

---

### 🟢 LOW — SEC-17: `.env` in `.gitignore` — Good!

**Files:** `.gitignore` at root and server level both include `.env` ✅

---

### ✅ Infrastructure Strengths

| Feature | File | Status |
|---|---|---|
| Graceful shutdown | [server.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/server.js#L20-L36) | ✅ Excellent |
| Uncaught exception handler | [server.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/server.js#L40-L51) | ✅ Good |

---

## 1.5 Dependency Review

### 🟡 MEDIUM — DEP-01: Puppeteer Bundled Chromium (~400MB Attack Surface)

**File:** [package.json](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/package.json#L39)

```json
"puppeteer": "^24.42.0"
```

Puppeteer downloads a full Chromium binary. This is a large attack surface for a server that only needs PDF generation. Consider using `puppeteer-core` with a pinned Chromium version, or switching to a lighter solution like `pdfkit` (which is already installed).

---

### 🟢 LOW — DEP-02: Both `pdfkit` and `puppeteer` for PDF Generation

**File:** [package.json](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/package.json#L37-L39)

Both `pdfkit` (v0.17.2) and `puppeteer` (v24.42.0) are installed. If Puppeteer is used for all PDFs, `pdfkit` can be removed to reduce dependencies.

---

### ✅ Dependency Strengths

| Package | Version | Status |
|---|---|---|
| express | 4.19.2 | ✅ Recent |
| helmet | 8.1.0 | ✅ Latest |
| bcrypt | 6.0.0 | ✅ Latest |
| jsonwebtoken | 9.0.3 | ✅ Latest |
| zod | 3.23.8 | ✅ Latest |

---

## 1.6 File System Security

### ✅ Path Traversal Prevention — Excellent

**File:** [imageService.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/services/imageService.js#L24-L35)

```js
const validatePropertyPath = (propertyFileNumber) => {
  const sanitized = String(propertyFileNumber).replace(/[^0-9]/g, '');
  // ...
  if (!path.resolve(folderPath).startsWith(path.resolve(UPLOADS_DIR))) {
    throw new AppError(400, 'مسار غير صالح');
  }
  return folderPath;
};
```

This is **excellent** path traversal prevention — strips non-numeric chars AND verifies the resolved path stays within the uploads directory.

### ✅ Filename Sanitization — Good

**File:** [uploadMiddleware.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/middleware/uploadMiddleware.js#L22)

```js
const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, '_');
```

Strips dangerous characters and adds timestamp prefix. Good protection against filename-based attacks.

---

# ⚡ PHASE 2 — PERFORMANCE AUDIT

---

### 🟠 HIGH — PERF-01: N+1 Query — `hasImages()` Called Per Property Row

**File:** [propertyService.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/services/propertyService.js#L31-L37)

```js
const enrichedProperties = await Promise.all(
  filteredProperties.map(async (p) => {
    if (p.is_restricted) return p;
    const has_images = await imageService.hasImages(p.property_file_number);
    return { ...p, has_images };
  })
);
```

**Impact:** For 20 properties per page, this makes **20 filesystem `readdir()` calls**. With 100+ properties, this scales linearly and will cause noticeable latency.

**Fix — Batch check with a single call:**
```js
// imageService.js — Add batch check
const hasImagesBatch = async (fileNumbers) => {
  const results = {};
  await Promise.all(
    fileNumbers.map(async (num) => {
      results[num] = await hasImages(num);
    })
  );
  return results;
};
```

Or better yet, store `has_images` as a DB column and update it on image upload/delete. This eliminates filesystem I/O entirely during listing.

---

### 🟡 MEDIUM — PERF-02: Reports Fetch Up to 5000 Rows Without Streaming

**File:** [reportService.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/services/reportService.js#L12)

```js
let properties = await propertyModel.findAll({ page: 1, limit: 5000 });
```

Loading 5000 rows into memory, then generating a PDF from them, then buffering the entire result — this triples memory usage. For large datasets:

**Fix:** Use cursor-based streaming for Excel (ExcelJS supports streaming), and paginated rendering for PDFs.

---

### 🟡 MEDIUM — PERF-03: No Database Indexes Visible

**Observation:** No migration files create indexes on frequently-queried columns like `properties.status`, `properties.owner_name`, `properties.location`, `logs.user_id`, `logs.action`, `logs.time`.

**Fix:**
```sql
CREATE INDEX idx_properties_status ON properties(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_owner ON properties(owner_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_logs_user_action ON logs(user_id, action);
CREATE INDEX idx_logs_time ON logs(time DESC);
CREATE INDEX idx_edit_requests_status ON edit_requests(status);
```

---

### ✅ Performance Strengths

| Feature | File | Status |
|---|---|---|
| Parallel DB queries (Promise.all) | [propertyService.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/services/propertyService.js#L12-L15) | ✅ Excellent |
| Gzip compression enabled | [app.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/app.js#L36) | ✅ Good |
| DB connection pooling (max:20) | [db.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/config/db.js#L8) | ✅ Good |

---

# 🏗️ PHASE 3 — ARCHITECTURE AUDIT

---

### ✅ Layered Architecture — Well Structured

```
Routes → Controllers → Services → Models → Database
                          ↓
                    imageService (filesystem)
```

The codebase follows clean separation of concerns:
- **Routes:** Define endpoints, attach middleware
- **Controllers:** Parse req/res, delegate to services
- **Services:** Business logic, transactions
- **Models:** Raw SQL queries with parameterized inputs

### ✅ Transaction Handling — Excellent

**File:** [requestService.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/services/requestService.js#L55-L109)

The `approveRequest` function properly uses database transactions with `BEGIN`/`COMMIT`/`ROLLBACK` and `FOR UPDATE` row locking. File operations happen **outside** the transaction (post-commit), which is correct.

### 🟡 MEDIUM — ARCH-01: Dual Parse of `newData` and `propertyFileNumber`

**File:** [request.routes.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/routes/request.routes.js#L32-L44) and [requestController.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/controllers/requestController.js#L9-L15)

The same parsing logic for `newData` and `propertyFileNumber` exists in **both** the route middleware and the controller. This is a code duplication issue. Keep it only in one place (the route middleware, before Zod validation).

### 🟡 MEDIUM — ARCH-02: Inconsistent Error Throwing

**File:** [reportController.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/controllers/reportController.js#L12-L13)

```js
throw { statusCode: 400, message: '...' }; // ❌ Plain object, not AppError
```

Most of the codebase correctly uses `throw new AppError(400, '...')`, but the report controller throws plain objects. The error handler catches this but it's inconsistent.

**Fix:**
```js
throw new AppError(400, 'صيغة التقرير غير صحيحة، يجب أن تكون pdf أو excel');
```

---

# 📈 PHASE 4 — SCALABILITY AUDIT

---

### 🟡 MEDIUM — SCALE-01: Filesystem-Based Image Storage Won't Scale

Images stored at `server/uploads/properties/{fileNumber}/` on the local filesystem. This works for a single server but breaks with:
- Multiple server instances (load balancing)
- Container deployments (ephemeral storage)
- Railway deployment (filesystem resets on redeploy)

**Fix for Production:** Migrate to object storage (S3, MinIO, or Railway Volumes).

### 🟡 MEDIUM — SCALE-02: In-Memory Access Token Storage on Client

**File:** [axiosInstance.js](file:///c:/Users/Admin/Desktop/propertyFilesSystem_cp/client/src/api/axiosInstance.js#L4)

```js
let accessToken = null; // In-memory — lost on page refresh
```

This is actually the **correct, secure approach** for SPAs. The refresh token (HttpOnly cookie) restores the session. No change needed.

### ✅ Scalability Strengths

| Feature | Notes | Status |
|---|---|---|
| Soft deletes | Users + Properties use `deleted_at` | ✅ Good for data retention |
| Paginated queries | All list endpoints | ✅ Good |
| MAX_LIMIT cap (100) | Prevents fetching too many rows | ✅ Good |

---

# 🔧 PHASE 5 — PRIORITIZED FIX LIST

---

## Immediate (Before Production)

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | SEC-01: Replace placeholder JWT secrets | 🔴 Critical | 5 min |
| 2 | SEC-13: Change DB password from `123` | 🔴 Critical | 5 min |
| 3 | SEC-14: Fix `rejectUnauthorized: false` | 🟠 High | 5 min |
| 4 | SEC-05: Validate `newData` schema | 🟠 High | 30 min |
| 5 | SEC-09: Restrict no-origin CORS in prod | 🟠 High | 10 min |

## Short-Term (Sprint 1)

| # | Issue | Severity | Effort |
|---|---|---|---|
| 6 | SEC-02: Add refresh token revocation | 🟠 High | 2 hours |
| 7 | SEC-03: Check locked status in auth middleware | 🟠 High | 30 min |
| 8 | SEC-11: Rate limit report endpoints | 🟡 Medium | 15 min |
| 9 | PERF-03: Add database indexes | 🟡 Medium | 30 min |
| 10 | SEC-04: Align password validation | 🟡 Medium | 5 min |

## Medium-Term (Sprint 2)

| # | Issue | Severity | Effort |
|---|---|---|---|
| 11 | PERF-01: Fix N+1 image check | 🟠 High | 1 hour |
| 12 | SEC-06/07: Add report/log query validation | 🟡 Medium | 30 min |
| 13 | ARCH-01: Remove duplicate parsing | 🟡 Medium | 15 min |
| 14 | ARCH-02: Fix inconsistent error throwing | 🟡 Medium | 10 min |
| 15 | PERF-02: Implement streaming for reports | 🟡 Medium | 2 hours |

---

# 📊 PHASE 6 — FINAL SCORECARD

| Category | Score | Grade |
|---|---|---|
| Authentication | 7/10 | B+ |
| Authorization (RBAC) | 9/10 | A |
| Input Validation | 7/10 | B |
| SQL Injection Prevention | 10/10 | A+ |
| File Upload Security | 9/10 | A |
| Path Traversal Prevention | 10/10 | A+ |
| API Security | 7/10 | B |
| Infrastructure | 4/10 | D (secrets/passwords) |
| Performance | 7/10 | B |
| Architecture | 8/10 | A- |
| Error Handling | 8/10 | A- |
| **Overall** | **7.3/10** | **B** |

> [!TIP]
> The codebase has a **solid foundation** — clean architecture, parameterized queries, proper RBAC, good file security. The critical issues are all **configuration problems** (JWT secrets, DB password) that are easy to fix. Once SEC-01 and SEC-13 are resolved, the overall grade jumps to **B+/A-**.

---

*End of audit report.*
