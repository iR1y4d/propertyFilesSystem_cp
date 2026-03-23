# Phase 3E — Integration Implementation Plan

> [!IMPORTANT]
> This phase connects the frontend to the backend and ensures all flows work end-to-end.
> It assumes Phase 3D (all frontend modules) and Phase 3B (all backend modules) are complete.

---

## Prerequisites

- Backend server running on port 5000 with seeded database
- Frontend dev server running on port 5173 with Vite proxy `/api` → `http://127.0.0.1:5000`
- All Phase 3D pages and components implemented

---

## Step 1: Verify API Connectivity for Every Module

Test each frontend page against the live backend. Open the browser console (F12 → Network tab) and verify:

| Page | API Endpoint | Expected Behavior |
|------|-------------|-------------------|
| Login | `POST /api/v1/auth/login` | Returns accessToken + sets HttpOnly cookie |
| Dashboard (Admin) | `GET /properties`, `GET /requests`, `GET /users`, `GET /logs` | Stats cards populated |
| Dashboard (Employee) | `GET /requests/my` | Employee's own request stats |
| Properties list | `GET /api/v1/properties?page=1&limit=10` | Table shows seeded properties |
| Property search | `GET /api/v1/properties/search?ownerName=أحمد` | Filtered results |
| Property detail | `GET /api/v1/properties/1001` | Full property data |
| Property create | `POST /api/v1/properties` | New property in DB |
| Property update | `PUT /api/v1/properties/1001` | Updated fields |
| Property delete | `DELETE /api/v1/properties/1005` | Soft deleted |
| Requests list (Admin) | `GET /api/v1/requests` | All requests |
| Requests list (Employee) | `GET /api/v1/requests/my` | Own requests |
| Submit request | `POST /api/v1/requests` | New pending request |
| Approve request | `PATCH /api/v1/requests/:id/approve` | Property updated, request status = مقبول |
| Reject request | `PATCH /api/v1/requests/:id/reject` | Request status = مرفوض |
| Users list | `GET /api/v1/users` | All users |
| Create user | `POST /api/v1/users` | New user in DB |
| Reset password | `PATCH /api/v1/users/:id/reset-password` | Password updated |
| Unlock account | `PATCH /api/v1/users/:id/unlock` | Account unlocked |
| Logs | `GET /api/v1/logs?page=1&limit=10` | Paginated log entries |
| Export PDF | `GET /api/v1/reports/properties/pdf` | PDF file downloads |
| Export Excel | `GET /api/v1/reports/properties/excel` | Excel file downloads |

---

## Step 2: Fix API Response Shape Mismatches

The backend returns responses in this format:
```json
{ "success": true, "data": { ... }, "message": "..." }
```

For paginated responses:
```json
{ "success": true, "data": { "rows": [...], "totalCount": 50, "totalPages": 5, "currentPage": 1 } }
```

**Verify** that each frontend API service correctly accesses `res.data.data` (not `res.data`). If the backend shape differs from what the frontend expects, fix the frontend API service or the backend controller.

Common mismatches to check:
1. Pagination metadata field names (`totalCount` vs `total`, `currentPage` vs `page`)
2. Property field names (`property_file_number` vs `propertyFileNumber` — snake_case vs camelCase)
3. User object shape from login vs from user list
4. Report blob content-type headers (`application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

---

## Step 3: Fix CORS and Cookie Issues

Common integration issues:

| Issue | Symptom | Fix |
|-------|---------|-----|
| CORS blocked | `Access-Control-Allow-Origin` error in console | Verify `server/.env` has `CORS_ORIGIN=http://localhost:5173` |
| Cookies not sent | Refresh token not in request | Verify `withCredentials: true` in Axios instance |
| Proxy not working | 404 on API calls | Verify `vite.config.js` proxy points to `http://127.0.0.1:5000` |
| Token refresh loop | Infinite 401 → refresh → 401 | Check interceptor `_retry` flag logic |

---

## Step 4: End-to-End Flow Testing

Test these complete user flows manually in the browser:

### Flow 1: Admin Login → Property CRUD
1. Login as `admin` / `Admin@2026`
2. Navigate to Properties → verify 5 seeded properties visible
3. Click "إضافة عقار" → fill form → submit → verify new row appears
4. Click "تعديل" on a property → change owner name → save → verify update
5. Click "حذف" → confirm → verify property disappears from list
6. Check Logs page → verify all 3 actions are logged

### Flow 2: Employee Request → Admin Approval
1. Login as `employee1` / `Employee@2026`
2. Navigate to Requests → click "تقديم طلب جديد"
3. Submit a request to edit property 1001's owner name
4. Verify request appears in "طلباتي" with status "معلق"
5. Logout → Login as `admin`
6. Navigate to Requests → find the pending request
7. Click "عرض التفاصيل" → verify old vs new data comparison
8. Click "موافقة" → confirm
9. Navigate to Properties → verify property 1001 has the new owner name
10. Navigate to Logs → verify approval action logged

### Flow 3: Account Lockout → Admin Unlock
1. Try logging in with `employee1` and wrong password 5 times
2. Verify "الحساب مقفل" error message after 5th attempt
3. Login as `admin` → navigate to Users
4. Find `employee1` → verify "مقفل" status shown
5. Click "فتح القفل" → confirm
6. Logout → Login as `employee1` with correct password → should succeed

### Flow 4: Report Export
1. Login as `admin`
2. Navigate to Reports
3. Click "تصدير PDF" for properties → verify PDF downloads
4. Click "تصدير Excel" for properties → verify Excel downloads
5. Click "تصدير PDF" for logs → verify PDF downloads
6. Open downloaded files → verify Arabic content is readable

### Flow 5: Employee Restrictions
1. Login as `employee1`
2. Navigate to Properties → verify no Add/Edit/Delete buttons visible
3. If a property has status `محجوز` → verify restricted view (only file number + status)
4. Navigate to sidebar → verify Users and Logs links are NOT visible
5. Try accessing `/users` directly in URL → verify redirect to dashboard or 403

---

## Step 5: Bug Fixes and Polish

After testing, fix any issues found:

- **UI inconsistencies:** RTL alignment issues, overlapping elements, font rendering
- **Error messages:** Ensure all API errors show user-friendly Arabic messages, not raw error objects
- **Loading states:** Verify spinners appear during all API calls
- **Empty states:** Tables show "لا توجد بيانات" when no records exist
- **Responsive:** Verify the layout doesn't break on common screen sizes (1024px, 1280px, 1440px)
- **Token expiry:** Let the access token expire (wait 15 min) → verify silent refresh works
- **Toast messages:** Verify success/error toasts appear for all mutations

---

## Verification Checklist

- [ ] All 24 API calls work without console errors
- [ ] Admin can perform full CRUD on properties
- [ ] Employee can submit requests and view own requests
- [ ] Admin can approve/reject requests with transactional integrity
- [ ] Account lockout + unlock flow works
- [ ] PDF and Excel reports download correctly with Arabic content
- [ ] All actions appear in audit logs
- [ ] Token refresh works silently
- [ ] No CORS or cookie errors in browser console
- [ ] All pages show loading states and empty states correctly
- [ ] `npm run build` succeeds with no errors
