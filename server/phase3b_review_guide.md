# Phase 3B — Code Review & Fix Guide

> [!IMPORTANT]
> This document lists all issues found during review of the Phase 3B backend modules.
> Each issue has its **severity**, **file**, **problem**, and **exact fix**.

---

## 🔴 CRITICAL Issues

### C1. Approval Transaction Not Fully Transactional

**File:** [requestService.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/services/requestService.js#L42-L82)

**Problem:** `approveRequest` uses `getClient()` for the transaction, but calls `propertyModel.create()`, `propertyModel.update()`, and `propertyModel.softDelete()` which all use the **pool's `query()`** — not the transaction client. Only the status update and audit log use the client. If the property mutation succeeds but the status update fails, ROLLBACK won't undo the property change.

**Fix:** Pass the `client` to all property model operations inside the transaction. Either:
- Add a `client` parameter to `propertyModel.create/update/softDelete` (like `requestModel.create` already does), OR
- Execute raw SQL through the client directly:

```diff
  // 2. Apply mutation to property
  if (request.request_type === 'إضافة') {
-   await propertyModel.create(request.new_data);
+   await client.query(
+     'INSERT INTO properties (property_file_number, owner_name, national_number, location, area, status) VALUES ($1, $2, $3, $4, $5, $6)',
+     [request.new_data.propertyFileNumber, request.new_data.ownerName, request.new_data.nationalNumber, request.new_data.location, request.new_data.area, request.new_data.status]
+   );
  } else if (request.request_type === 'تعديل') {
-   await propertyModel.update(request.property_file_number, request.new_data);
+   // Build dynamic SET from new_data using client
+   const entries = Object.entries(request.new_data);
+   const sets = entries.map((_, i) => `${_[0]} = $${i + 2}`).join(', ');
+   await client.query(
+     `UPDATE properties SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE property_file_number = $1`,
+     [request.property_file_number, ...entries.map(e => e[1])]
+   );
  } else if (request.request_type === 'حذف') {
-   await propertyModel.softDelete(request.property_file_number);
+   await client.query(
+     'UPDATE properties SET deleted_at = CURRENT_TIMESTAMP WHERE property_file_number = $1',
+     [request.property_file_number]
+   );
  }
```

**Best approach:** Refactor `propertyModel` functions to accept an optional `client` parameter, similar to `requestModel.create`.

---

### C2. Duplicate Auth Route Import in `app.js`

**File:** [app.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/app.js#L8-L24)

**Problem:** Line 8 imports `authRoutes` via `require('./routes/auth.routes')`, but line 24 uses `require('./routes/auth.routes.js')` inline. The variable `authRoutes` is imported but never used. The route works, but the dead import is messy.

**Fix:**
```diff
- const authRoutes = require('./routes/auth.routes');
  const errorHandler = require('./middleware/errorHandler');
```

---

### C3. JSONB Data Not Serialized Before INSERT

**File:** [requestModel.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/models/requestModel.js#L79-L85)

**Problem:** `old_data` and `new_data` are passed directly to the query. PostgreSQL's `pg` driver handles plain objects for JSONB automatically, **but** if `oldData` is a full row from `findByFileNumber`, it may contain Date objects or other non-JSON types. This could silently produce unexpected results.

**Fix:** Explicitly serialize:
```diff
- [propertyFileNumber, requestedBy, requestDescription, oldData, newData, requestType]
+ [propertyFileNumber, requestedBy, requestDescription,
+  oldData ? JSON.stringify(oldData) : null,
+  newData ? JSON.stringify(newData) : null,
+  requestType]
```

---

## 🟡 MEDIUM Issues

### M1. `softDelete` and `update` Don't Check `deleted_at IS NULL`

**File:** [propertyModel.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/models/propertyModel.js#L133-L146)

**Problem:** Both `update` and `softDelete` can operate on already-deleted properties because they filter by `property_file_number = $1` without checking `AND deleted_at IS NULL`.

**Fix:**
```diff
- WHERE property_file_number = $1 RETURNING *`;
+ WHERE property_file_number = $1 AND deleted_at IS NULL RETURNING *`;
```
Apply to both `update` (line 133) and `softDelete` (line 143).

---

### M2. Request Routes Allow Employees to See All Requests

**File:** [request.routes.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/routes/request.routes.js#L14)

**Problem:** `GET /` is accessible to both `ADMIN` and `EMPLOYEE`. The service-level filtering in `listRequests` does handle this correctly (employees only see their own), but the master plan specifies separate endpoints: `GET /` for Admin, `GET /my` for Employee. A dedicated `/my` route is missing.

**Fix:** Add `/my` route for clarity:
```diff
  router.get('/', authorize(ROLES.ADMIN), requestController.listRequests);
+ router.get('/my', authorize(ROLES.EMPLOYEE), requestController.listMyRequests);
  router.get('/:id', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), requestController.getRequest);
```
Then add `listMyRequests` to the controller to call the service with `user.userId`.

---

### M3. Zod `error_map` Is Not the Correct API

**File:** [propertyValidator.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/validators/propertyValidator.js#L25-L27), [requestValidator.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/validators/requestValidator.js#L11-L12), [userValidator.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/validators/userValidator.js#L23-L24)

**Problem:** Zod v3 uses `errorMap` (camelCase), not `error_map` (snake_case). This may silently be ignored, meaning no custom error message is shown for invalid enum values.

**Fix:** Change all occurrences:
```diff
- error_map: () => ({ message: '...' })
+ errorMap: () => ({ message: '...' })
```

---

### M4. Report Format Not Validated

**File:** [reportController.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/controllers/reportController.js#L8)

**Problem:** `req.params.format` accepts any value (e.g., `GET /reports/properties/json`). Invalid formats would pass through to the service and hit the Excel generator by default.

**Fix:** Add format validation:
```diff
  const format = req.params.format;
+ if (!['pdf', 'excel'].includes(format)) {
+   return res.status(400).json({ success: false, message: 'صيغة التقرير غير صحيحة، يجب أن تكون pdf أو excel' });
+ }
```

---

### M5. Leftover Dev Comment in Controller

**File:** [requestController.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/controllers/requestController.js#L42)

**Problem:** Line 42 has `// Note: I need to add this to service` — a leftover development comment that should be removed.

**Fix:**
```diff
- const result = await requestService.getRequest(req.params.id); // Note: I need to add this to service
+ const result = await requestService.getRequest(req.params.id);
```

---

## 🟢 LOW Issues

### L1. No Self-Delete Prevention for Admin

**File:** [userService.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/services/userService.js#L85)

**Problem:** An admin can delete their own account, which could lock everyone out of the system if they are the only admin.

**Fix:**
```diff
  const deleteUser = async (adminUserId, userId) => {
+   if (String(adminUserId) === String(userId)) {
+     throw { statusCode: 400, message: 'لا يمكنك حذف حسابك الخاص' };
+   }
    const user = await userModel.softDelete(userId);
```

---

### L2. Reject Doesn't Validate Current Status

**File:** [requestService.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/services/requestService.js#L88-L101)

**Problem:** `rejectRequest` doesn't check if the request is already approved/rejected. An admin could reject an already-approved request, creating a contradictory audit trail.

**Fix:**
```diff
  const rejectRequest = async (adminUserId, requestId) => {
+   const existing = await requestModel.findById(requestId);
+   if (!existing) throw { statusCode: 404, message: 'الطلب غير موجود' };
+   if (existing.status !== REQUEST_STATUS.PENDING) {
+     throw { statusCode: 400, message: 'هذا الطلب تم التعامل معه مسبقاً' };
+   }
    const request = await requestModel.updateStatus(null, requestId, REQUEST_STATUS.REJECTED);
```

---

### L3. `unlockAccount` Checks `rowCount` Instead of Return Value

**File:** [userService.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/services/userService.js#L127-L128)

**Problem:** `userModel.unlockAccount` returns the raw query result, while all other model functions return `result.rows[0]`. The service checks `result.rowCount === 0`, which works differently from the pattern used elsewhere.

**Fix:** Update `unlockAccount` in `userModel.js` to match pattern:
```diff
  const unlockAccount = async (userId) => {
    return await query(
      'UPDATE users SET is_locked = false, failed_login_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    );
  };
```
Change to:
```diff
  const unlockAccount = async (userId) => {
    const result = await query(
-     'UPDATE users SET is_locked = false, failed_login_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
+     'UPDATE users SET is_locked = false, failed_login_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING user_id',
      [userId]
    );
+   return result.rows[0];
  };
```
Then in service:
```diff
- if (result.rowCount === 0) {
+ if (!result) {
```

---

### L4. PDF Column Widths May Overflow Page

**File:** [pdfGenerator.js](file:///c:/Users/User/Desktop/IT_CAPSTONE_PROJECT/server/utils/pdfGenerator.js#L26-L30)

**Problem:** Column widths are defined in `reportService.js` (e.g., 80 + 120 + 100 + 150 + 70 + 80 + 100 = **700px**), but the PDF page width (A4) is only ~595 points with 50px margins = ~495 usable. Columns will overflow off-page.

**Fix:** Reduce column widths in `reportService.js`:
```diff
  const columns = [
-   { header: 'رقم الملف', key: 'property_file_number', width: 80 },
-   { header: 'اسم المالك', key: 'owner_name', width: 120 },
-   { header: 'الرقم الوطني', key: 'national_number', width: 100 },
-   { header: 'الموقع', key: 'location', width: 150 },
-   { header: 'المساحة', key: 'area', width: 70 },
-   { header: 'الحالة', key: 'status', width: 80 },
-   { header: 'تاريخ الإنشاء', key: 'created_at', width: 100 }
+   { header: 'رقم الملف', key: 'property_file_number', width: 60 },
+   { header: 'اسم المالك', key: 'owner_name', width: 80 },
+   { header: 'الرقم الوطني', key: 'national_number', width: 75 },
+   { header: 'الموقع', key: 'location', width: 80 },
+   { header: 'المساحة', key: 'area', width: 45 },
+   { header: 'الحالة', key: 'status', width: 55 },
+   { header: 'تاريخ الإنشاء', key: 'created_at', width: 75 }
  ];
```

---

## Summary Table

| ID | Severity | File | Issue |
|----|----------|------|-------|
| C1 | 🔴 Critical | `requestService.js` | Approval mutations bypass transaction client |
| C2 | 🔴 Critical | `app.js` | Duplicate/dead auth import |
| C3 | 🔴 Critical | `requestModel.js` | JSONB data not explicitly serialized |
| M1 | 🟡 Medium | `propertyModel.js` | `update`/`softDelete` missing `deleted_at IS NULL` |
| M2 | 🟡 Medium | `request.routes.js` | Missing `/my` route per master plan |
| M3 | 🟡 Medium | Validators (3 files) | `error_map` should be `errorMap` |
| M4 | 🟡 Medium | `reportController.js` | Report format param not validated |
| M5 | 🟡 Medium | `requestController.js` | Leftover dev comment |
| L1 | 🟢 Low | `userService.js` | Admin can self-delete |
| L2 | 🟢 Low | `requestService.js` | Reject doesn't validate current status |
| L3 | 🟢 Low | `userService.js` / `userModel.js` | Inconsistent `unlockAccount` return pattern |
| L4 | 🟢 Low | `reportService.js` | PDF column widths overflow page |
