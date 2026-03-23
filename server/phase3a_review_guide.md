# Phase 3A — Code Review & Fix Guide

> [!IMPORTANT]
> This document lists all issues found during review of the Phase 3A backend foundation.
> Each issue has its **severity**, **file**, **problem**, and **exact fix** so any agent can resolve it.

---

## 🔴 CRITICAL Issues

### C1. Express v5 Installed — Middleware Compatibility Risk

**File:** [package.json](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/package.json)

**Problem:** `express@5.2.1` was installed. Express v5 has breaking changes:
- Error-handling middleware signature changed (4-arg `(err, req, res, next)` may behave differently).
- `res.json()` and routing behavior changed.
- Many community middleware packages (helmet, morgan, express-rate-limit) may not yet fully support v5.

**Fix:** Downgrade to Express v4 (stable):
```bash
npm uninstall express && npm install express@4
```

---

### C2. Zod v4 Installed — API Breaking Changes

**File:** [package.json](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/package.json), [authValidator.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/validators/authValidator.js), [errorHandler.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/middleware/errorHandler.js)

**Problem:** `zod@4.3.6` was installed. Zod v4 has breaking changes from v3:
- Error structure changed: `err.errors` may not exist. In Zod v4 it uses `err.issues`.
- `required_error` option may not work the same way.

**Fix — Option A (Recommended):** Downgrade to Zod v3:
```bash
npm uninstall zod && npm install zod@3
```

**Fix — Option B:** If keeping v4, update the error handler:
```diff
  // In errorHandler.js
- if (err.name === 'ZodError') {
+ if (err.constructor?.name === 'ZodError' || err.issues) {
      return res.status(400).json({
        success: false,
        message: 'خطأ في التحقق من البيانات',
-       errors: err.errors.map(e => ({
+       errors: (err.issues || err.errors).map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
  }
```

---

### C3. edit_requests FK References Non-PK Column

**File:** [1710000000003_create-edit-requests.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/migrations/1710000000003_create-edit-requests.js#L4-L8)

**Problem:** The `property_file_number` FK references `properties(property_file_number)`, but the PK of `properties` is `property_id` (auto-generated serial). Although `property_file_number` has a UNIQUE constraint, PostgreSQL allows FK to unique columns, but `ON DELETE CASCADE` will cascade on deleting the row by `property_id`, which could be confusing. More critically, the FK syntax `'"properties"(property_file_number)'` may fail because `node-pg-migrate` expects the referenced column to be the PK unless explicitly configured.

**Fix:** Verify this works during migration. If it fails, change the reference:
```js
property_file_number: {
  type: 'integer',
  notNull: true,
  references: { name: 'properties', column: 'property_file_number' },
  onDelete: 'CASCADE',
},
```

---

## 🟡 MEDIUM Issues

### M1. Error Handler Crashes on Plain Object Errors

**File:** [errorHandler.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/middleware/errorHandler.js#L5)

**Problem:** Line 5 calls `err.stack`, but `authService.js` throws plain objects like `throw { statusCode: 401, message: '...' }`. Plain objects have no `.stack` property, so `console.error` will print `undefined`.

**Fix:** Add a guard:
```diff
- console.error('❌ Error:', err.stack);
+ console.error('❌ Error:', err.stack || err.message || err);
```

---

### M2. Rate Limiter Uses Wrong Constant

**File:** [rateLimiter.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/middleware/rateLimiter.js#L9)

**Problem:** `max` is set to `MAX_LOGIN_ATTEMPTS` (5). This means only 5 requests per 15 minutes per IP to the auth routes — but the rate limiter applies to ALL auth routes (login, logout, refresh-token), not just failed login attempts. The account lockout (`MAX_LOGIN_ATTEMPTS`) is a separate concept from the IP rate limit.

**Fix:** Use a separate, higher value for the rate limiter:
```diff
- const { MAX_LOGIN_ATTEMPTS } = require('../config/constants');
  module.exports = rateLimit({
    windowMs: 15 * 60 * 1000,
-   max: MAX_LOGIN_ATTEMPTS,
+   max: 30, // Allow reasonable number of auth requests per IP
```

Or add a dedicated constant like `RATE_LIMIT_AUTH_MAX: 30` to `constants.js`.

---

### M3. package.json `main` Field Mismatch

**File:** [package.json](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/package.json#L5)

**Problem:** `"main": "index.js"` but the entry point is `server.js`.

**Fix:**
```diff
- "main": "index.js",
+ "main": "server.js",
```

---

### M4. Migration Config Missing from package.json

**File:** [package.json](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/package.json)

**Problem:** `node-pg-migrate` needs to know the migrations directory and the database URL. Without config, `npm run migrate:up` will look for migrations in `./migrations` (which is correct) but will not find the database URL unless `DATABASE_URL` env var is set. The `.env` file is not auto-loaded by `node-pg-migrate`.

**Fix:** Add migration config to `package.json`:
```json
"node-pg-migrate": {
  "migrations-dir": "./migrations",
  "migration-filename-format": "utc"
}
```
And update the migration scripts to load `.env`:
```diff
- "migrate:up": "node-pg-migrate up",
- "migrate:down": "node-pg-migrate down",
+ "migrate:up": "node -r dotenv/config ./node_modules/.bin/node-pg-migrate up",
+ "migrate:down": "node -r dotenv/config ./node_modules/.bin/node-pg-migrate down",
```
Or use `dotenv` CLI: `npx dotenv -- node-pg-migrate up`.

---

### M5. `authService.login()` Returns `user.username` as `name`

**File:** [authService.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/services/authService.js#L50)

**Problem:** The returned user object uses `name: user.username` — but the user has `first_name` and `last_name`. The frontend will need the full name.

**Fix:**
```diff
- return { accessToken, refreshToken, user: { id: user.user_id, name: user.username, role: user.role } };
+ return {
+   accessToken,
+   refreshToken,
+   user: {
+     id: user.user_id,
+     username: user.username,
+     firstName: user.first_name,
+     lastName: user.last_name,
+     role: user.role
+   }
+ };
```

---

## 🟢 LOW Issues

### L1. Validation Middleware Doesn't Overwrite `req.body`

**File:** [validate.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/middleware/validate.js)

**Problem:** The middleware stores validated data in `req.validated`, but the controller reads from `req.body`. This works accidentally because `req.body` is still untouched, but the validated/sanitized output is ignored. Zod's `.parse()` strips unknown fields, so using `req.body` instead of `req.validated.body` defeats the mass-assignment protection.

**Fix:** Overwrite `req.body` with the validated output:
```diff
  const result = schema.parse({
    body: req.body,
    query: req.query,
    params: req.params
  });
- req.validated = result;
+ req.body = result.body;
+ req.query = result.query || req.query;
+ req.params = result.params || req.params;
  next();
```

---

### L2. Seed National Numbers May Be Too Short

**File:** [seed.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/seeds/seed.js#L29-L34)

**Problem:** Jordanian national ID numbers are 10 digits. Some seed values like `1234567890` are exactly 10 digits, which is fine. But verify that the `national_number` column (BIGINT) and frontend validation enforce exactly 10 digits for production.

**Fix:** No code change needed, but add a note to the property validator (Phase 3B) to enforce 10-digit national numbers.

---

### L3. No `created_at` Index on Properties Table

**File:** [1710000000002_create-properties.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/migrations/1710000000002_create-properties.js)

**Problem:** The master plan specifies an index on `created_at` for date-range queries, but the migration only creates indexes on `property_file_number`, `national_number`, and `status`.

**Fix:** Add the missing index:
```diff
  pgm.createIndex('properties', 'status');
+ pgm.createIndex('properties', 'created_at');
```

---

## Summary Table

| ID | Severity | File | Issue | Fixed? |
|----|----------|------|-------|:------:|
| C1 | 🔴 Critical | `package.json` | Express v5 — downgrade to v4 | ✅ `^4.19.2` |
| C2 | 🔴 Critical | `package.json` + validators | Zod v4 — downgrade to v3 | ✅ `^3.23.8` |
| C3 | 🔴 Critical | Migration 003 | FK reference syntax may fail | ✅ Object syntax |
| M1 | 🟡 Medium | `errorHandler.js` | Crashes on plain object errors | ✅ Fallback added |
| M2 | 🟡 Medium | `rateLimiter.js` | Uses wrong constant for max | ✅ `RATE_LIMIT_AUTH_MAX: 30` |
| M3 | 🟡 Medium | `package.json` | `main` field says `index.js` | ✅ `server.js` |
| M4 | 🟡 Medium | `package.json` | Migration scripts don't load `.env` | ✅ `dotenv/config` preloaded |
| M5 | 🟡 Medium | `authService.js` | Returns username as name, missing first/last | ✅ Full user object |
| L1 | 🟢 Low | `validate.js` | Validated output ignored, mass-assignment risk | ✅ Overwrites `req.body` |
| L2 | 🟢 Low | `seed.js` | National number length not enforced | ⏳ Phase 3B validator |
| L3 | 🟢 Low | Migration 002 | Missing `created_at` index | ✅ Index added |

