# Phase 3B — Backend Modules Implementation Plan

> [!IMPORTANT]
> This plan is for **other agents** to execute. Every file, function, and rule is specified explicitly.
> All Phase 3A infrastructure is already in place (DB, Auth, Middleware). Build on top of it.

---

## Prerequisites (Already Done in Phase 3A)

| Component | Location |
|-----------|----------|
| DB pool + query helper | `config/db.js` → `query()`, `getClient()` |
| Constants (roles, statuses, actions) | `config/constants.js` |
| Auth middleware | `middleware/auth.js` → attaches `req.user` |
| RBAC middleware | `middleware/rbac.js` → `authorize(...roles)` |
| Validation middleware | `middleware/validate.js` → `validate(zodSchema)` |
| Error handler | `middleware/errorHandler.js` |
| Log model | `models/logModel.js` → `createLog({ userId, action, target })` |
| User model | `models/userModel.js` |
| App entry | `app.js` → register new routes here |

---

## Build Order

Execute modules in this exact sequence (each depends on the previous):

```
1. BE-06  Property CRUD          (core data, needed by everything)
2. BE-07  Request/Approval       (depends on properties)
3. BE-08  Search                 (depends on properties)
4. BE-09  Audit Log Viewer       (model exists, add listing endpoint)
5. BE-10  User Management        (admin only)
6. BE-11  Reports (PDF/Excel)    (depends on properties + logs)
```

---

## Agent Constraints (MUST follow)

- All queries **parameterized** (never string-concatenate user input)
- Every write operation **must call** `logModel.createLog()`
- Approval operations **must use DB transactions** via `getClient()`
- Validate **all inputs** with Zod; reject unknown fields
- Never return raw stack traces — use `next(err)` pattern
- Follow response format: `{ success, data, message }`
- National numbers must be validated as **exactly 10 digits**

---

## Module 1: Property CRUD (BE-06)

### Files to Create

#### [NEW] `validators/propertyValidator.js`

```js
// Zod schemas:
createPropertySchema = z.object({
  body: z.object({
    propertyFileNumber: z.number().int().positive(),
    ownerName: z.string().min(2).max(255),
    nationalNumber: z.number().int().refine(n => String(n).length === 10, 'الرقم الوطني يجب أن يكون 10 أرقام'),
    location: z.string().min(2).max(255),
    area: z.string().min(1).max(100),
    status: z.enum(['مؤقت', 'مصدق', 'محجوز'])
  })
})

updatePropertySchema = z.object({
  params: z.object({ fileNumber: z.string() }),
  body: z.object({
    ownerName: z.string().min(2).max(255).optional(),
    nationalNumber: z.number().int().refine(n => String(n).length === 10).optional(),
    location: z.string().min(2).max(255).optional(),
    area: z.string().min(1).max(100).optional(),
    status: z.enum(['مؤقت', 'مصدق', 'محجوز']).optional()
  })
})
```

#### [NEW] `models/propertyModel.js`

| Function | Query | Notes |
|----------|-------|-------|
| `findAll(page, limit, filters)` | `SELECT ... WHERE deleted_at IS NULL` | Paginated, filterable by status/location |
| `findByFileNumber(fileNumber)` | `WHERE property_file_number = $1 AND deleted_at IS NULL` | |
| `create(data)` | `INSERT INTO properties ...` | Returns created row |
| `update(fileNumber, data)` | `UPDATE properties SET ... WHERE property_file_number = $1` | Dynamic SET clause |
| `softDelete(fileNumber)` | `SET deleted_at = CURRENT_TIMESTAMP` | |
| `count(filters)` | `SELECT COUNT(*)` | For pagination metadata |

#### [NEW] `services/propertyService.js`

| Function | Logic |
|----------|-------|
| `listProperties(user, page, limit, filters)` | If employee: exclude `محجوز` details. Paginate. |
| `getProperty(user, fileNumber)` | If employee + status is `محجوز`: return 403. |
| `createProperty(userId, data)` | Insert + log `LOG_ACTIONS.ADD`. |
| `updateProperty(userId, fileNumber, data)` | Update + log `LOG_ACTIONS.EDIT`. |
| `deleteProperty(userId, fileNumber)` | Soft delete + log `LOG_ACTIONS.DELETE`. |

> [!WARNING]
> Employee role-based filtering happens at the **service level**, not middleware. The middleware allows both roles to access `GET /properties`, but the service filters data.

#### [NEW] `controllers/propertyController.js`

Thin controller — parse params, call service, return response. Use standard response format.

#### [NEW] `routes/property.routes.js`

| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| `GET` | `/` | `auth`, `authorize('مدير','موظف')` | `listProperties` |
| `GET` | `/:fileNumber` | `auth`, `authorize('مدير','موظف')` | `getProperty` |
| `POST` | `/` | `auth`, `authorize('مدير')`, `validate(createSchema)` | `createProperty` |
| `PUT` | `/:fileNumber` | `auth`, `authorize('مدير')`, `validate(updateSchema)` | `updateProperty` |
| `DELETE` | `/:fileNumber` | `auth`, `authorize('مدير')` | `deleteProperty` |

**Register in `app.js`:** `app.use('/api/v1/properties', propertyRoutes);`

---

## Module 2: Request/Approval Workflow (BE-07)

### Files to Create

#### [NEW] `validators/requestValidator.js`

```js
submitRequestSchema = z.object({
  body: z.object({
    propertyFileNumber: z.number().int().positive(),
    requestType: z.enum(['إضافة', 'تعديل', 'حذف']),
    requestDescription: z.string().min(5).max(255),
    newData: z.record(z.any()).optional()  // JSONB proposed changes
  })
})
```

#### [NEW] `models/requestModel.js`

| Function | Notes |
|----------|-------|
| `findAll(page, limit, filters)` | Admin: all requests. Paginated. |
| `findByUser(userId, page, limit)` | Employee: own requests only. |
| `findById(requestId)` | Join with user + property info. |
| `create(data)` | Insert with `old_data` snapshot from current property. |
| `updateStatus(requestId, status)` | Set status to `مقبول` or `مرفوض`. |

#### [NEW] `services/requestService.js`

| Function | Logic |
|----------|-------|
| `submitRequest(userId, data)` | 1. Fetch current property → snapshot as `old_data`. 2. Insert request. 3. Log `LOG_ACTIONS.REQUEST`. |
| `approveRequest(adminUserId, requestId)` | **TRANSACTION:** 1. Get request. 2. Apply mutation to property (add/edit/delete). 3. Update request status → `مقبول`. 4. Log `LOG_ACTIONS.APPROVE`. 5. COMMIT or ROLLBACK. |
| `rejectRequest(adminUserId, requestId)` | Update status → `مرفوض`. Log `LOG_ACTIONS.REJECT`. |

> [!CAUTION]
> The `approveRequest` function **MUST** use `getClient()` from `config/db.js` and wrap all operations in `BEGIN`/`COMMIT`/`ROLLBACK`. This is the most critical transactional operation in the system.

#### [NEW] `controllers/requestController.js` + `routes/request.routes.js`

| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| `GET` | `/` | `auth`, `authorize('مدير')` | `listAllRequests` |
| `GET` | `/my` | `auth`, `authorize('موظف')` | `listMyRequests` |
| `GET` | `/:id` | `auth` | `getRequest` |
| `POST` | `/` | `auth`, `authorize('موظف')`, `validate` | `submitRequest` |
| `PATCH` | `/:id/approve` | `auth`, `authorize('مدير')` | `approveRequest` |
| `PATCH` | `/:id/reject` | `auth`, `authorize('مدير')` | `rejectRequest` |

**Register in `app.js`:** `app.use('/api/v1/requests', requestRoutes);`

---

## Module 3: Search with Audit Logging (BE-08)

> [!IMPORTANT]
> Search is logged for **BOTH admin and employee** roles per the RBAC matrix.

### Add to `services/propertyService.js`

```js
searchProperties(userId, queryParams) {
  // 1. Build WHERE clause from: propertyFileNumber, ownerName, nationalNumber, location, status
  // 2. If employee: filter out محجوز details
  // 3. Log: createLog({ userId, action: LOG_ACTIONS.SEARCH, target: JSON.stringify(queryParams) })
  // 4. Return paginated results
}
```

### Add to `routes/property.routes.js`

| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| `GET` | `/search` | `auth`, `authorize('مدير','موظف')` | `searchProperties` |

> **IMPORTANT:** Place the `/search` route **BEFORE** `/:fileNumber` to avoid route conflicts.

---

## Module 4: Audit Log Viewer (BE-09)

### Files to Create

#### [MODIFY] `models/logModel.js`

Add function:
```js
findAll(page, limit, filters) {
  // SELECT l.*, u.username FROM logs l JOIN users u ON l.user_id = u.user_id
  // Filter by: userId, action, dateFrom, dateTo
  // ORDER BY time DESC
  // Paginated
}
```

#### [NEW] `controllers/logController.js` + `routes/log.routes.js`

| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| `GET` | `/` | `auth`, `authorize('مدير')` | `listLogs` |

**Register in `app.js`:** `app.use('/api/v1/logs', logRoutes);`

---

## Module 5: User Management (BE-10)

### Files to Create

#### [NEW] `validators/userValidator.js`

```js
createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    username: z.string().min(3).max(100),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
    role: z.enum(['مدير', 'موظف'])
  })
})

updateUserSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    firstName: z.string().min(2).max(100).optional(),
    lastName: z.string().min(2).max(100).optional(),
    role: z.enum(['مدير', 'موظف']).optional()
  })
})
```

#### [MODIFY] `models/userModel.js`

Add functions:
| Function | Notes |
|----------|-------|
| `findAll(page, limit)` | Paginated, exclude `password_hash`, filter `deleted_at IS NULL` |
| `create(data)` | Insert with hashed password |
| `update(userId, data)` | Dynamic SET |
| `softDelete(userId)` | `SET deleted_at = CURRENT_TIMESTAMP` |
| `resetPassword(userId, newHash)` | Update `password_hash` |

#### [NEW] `services/userService.js` + `controllers/userController.js` + `routes/user.routes.js`

| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| `GET` | `/` | `auth`, `authorize('مدير')` | `listUsers` |
| `GET` | `/:id` | `auth`, `authorize('مدير')` | `getUser` |
| `POST` | `/` | `auth`, `authorize('مدير')`, `validate` | `createUser` |
| `PUT` | `/:id` | `auth`, `authorize('مدير')`, `validate` | `updateUser` |
| `DELETE` | `/:id` | `auth`, `authorize('مدير')` | `deleteUser` |
| `PATCH` | `/:id/reset-password` | `auth`, `authorize('مدير')` | `resetPassword` |
| `PATCH` | `/:id/unlock` | `auth`, `authorize('مدير')` | `unlockAccount` |

**Register in `app.js`:** `app.use('/api/v1/users', userRoutes);`

---

## Module 6: Reports — PDF/Excel (BE-11)

### Files to Create

#### [NEW] `utils/pdfGenerator.js`

Use `pdfkit`. Create a reusable function:
```js
generatePropertyPDF(properties, title) → Buffer
generateLogsPDF(logs, title) → Buffer
```
- Arabic text support: use an Arabic-compatible font (embed a TTF font like Amiri or Cairo)
- Include headers, table rows, page numbers

#### [NEW] `utils/excelGenerator.js`

Use `exceljs`. Create:
```js
generatePropertyExcel(properties, title) → Buffer
generateLogsExcel(logs, title) → Buffer
```
- RTL worksheet direction
- Formatted headers, auto-width columns

#### [NEW] `services/reportService.js`

| Function | Logic |
|----------|-------|
| `getPropertyReport(user, format)` | If employee: exclude `محجوز` details. Generate PDF or Excel. |
| `getLogReport(format)` | Admin only. Generate PDF or Excel. |

#### [NEW] `controllers/reportController.js` + `routes/report.routes.js`

| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| `GET` | `/properties/pdf` | `auth` | `exportPropertiesPDF` |
| `GET` | `/properties/excel` | `auth` | `exportPropertiesExcel` |
| `GET` | `/logs/pdf` | `auth`, `authorize('مدير')` | `exportLogsPDF` |
| `GET` | `/logs/excel` | `auth`, `authorize('مدير')` | `exportLogsExcel` |

Set response headers: `Content-Type`, `Content-Disposition: attachment; filename="..."`.

**Register in `app.js`:** `app.use('/api/v1/reports', reportRoutes);`

---

## Final Step: Register All Routes in `app.js`

After all modules, `app.js` should have:
```js
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reports', reportRoutes);
```

---

## Verification Plan

### Automated Tests (run with Supertest)

| # | Test | Expected |
|---|------|----------|
| 1 | `POST /properties` as admin | 201, property created |
| 2 | `POST /properties` as employee | 403 |
| 3 | `GET /properties` as employee | 200, `محجوز` details hidden |
| 4 | `GET /properties/:fileNumber` (محجوز) as employee | 403 |
| 5 | `POST /requests` as employee | 201, request pending |
| 6 | `PATCH /requests/:id/approve` | Property mutated + request approved + log created (atomic) |
| 7 | `PATCH /requests/:id/reject` | Property unchanged, request rejected |
| 8 | `GET /properties/search?ownerName=أحمد` | Results + audit log created |
| 9 | `GET /logs` as admin | 200, paginated logs |
| 10 | `GET /logs` as employee | 403 |
| 11 | `POST /users` as admin | 201, user created |
| 12 | `DELETE /users/:id` as admin | Soft deleted |
| 13 | `GET /reports/properties/pdf` | PDF file downloaded |
| 14 | `GET /reports/properties/excel` | Excel file downloaded |

### Manual Checks
- Verify transactional integrity: kill server mid-approval → no partial writes
- Confirm Arabic rendering in PDF reports
- Check Excel RTL direction
