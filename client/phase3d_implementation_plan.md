# Phase 3D — Frontend Modules Implementation Plan

> [!IMPORTANT]
> This plan builds on the Phase 3C foundation (React + Tailwind v4 + RTL + Auth).
> All text MUST be in Arabic. All layouts MUST be RTL.
> Every API call MUST go through the centralized Axios instance (`src/api/axiosInstance.js`).
> Show a `<Spinner />` for all async operations. Confirm destructive actions with `<Modal />`.

---

## Prerequisites

- Phase 3C complete (React project, auth flow, layout, common components)
- Backend running on port 5000 (Phase 3A + 3B complete)
- Vite proxy configured: `/api` → `http://127.0.0.1:5000`
- Seeded database with admin + employee users

## Existing Infrastructure (DO NOT recreate)

| Item | Path | Status |
|------|------|--------|
| Axios instance + interceptors | `src/api/axiosInstance.js` | ✅ Done |
| Auth API (login, logout, refresh) | `src/api/authApi.js` | ✅ Done |
| AuthContext + useAuth hook | `src/context/AuthContext.jsx` | ✅ Done |
| ProtectedRoute + RoleGuard | `src/guards/` | ✅ Done |
| Common components (Button, Input, Spinner, Modal) | `src/components/common/` | ✅ Done |
| Layout (Sidebar, Header, AppLayout) | `src/components/layout/` | ✅ Done |
| Constants (ROLES, STATUSES, API_BASE) | `src/constants/index.js` | ✅ Done |
| Login + NotFound pages | `src/pages/` | ✅ Done |

## Sidebar Navigation (already defined in `Sidebar.jsx`)

| Route | Label | Roles | Page to Create |
|-------|-------|-------|----------------|
| `/` | لوحة التحكم | Admin, Employee | `Dashboard.jsx` |
| `/properties` | العقارات | Admin, Employee | `Properties.jsx` |
| `/requests` | الطلبات | Admin, Employee | `Requests.jsx` |
| `/users` | المستخدمين | Admin only | `Users.jsx` |
| `/logs` | سجل التدقيق | Admin only | `Logs.jsx` |
| `/reports` | التقارير | Admin, Employee | `Reports.jsx` |

---

## Step 1: Create API Service Files

### [NEW] `src/api/propertyApi.js`

```javascript
import api from './axiosInstance';

export const getProperties = (params) => api.get('/properties', { params });
export const searchProperties = (params) => api.get('/properties/search', { params });
export const getProperty = (fileNumber) => api.get(`/properties/${fileNumber}`);
export const createProperty = (data) => api.post('/properties', data);
export const updateProperty = (fileNumber, data) => api.put(`/properties/${fileNumber}`, data);
export const deleteProperty = (fileNumber) => api.delete(`/properties/${fileNumber}`);
```

### [NEW] `src/api/requestApi.js`

```javascript
import api from './axiosInstance';

export const getRequests = (params) => api.get('/requests', { params });
export const getMyRequests = (params) => api.get('/requests/my', { params });
export const getRequest = (id) => api.get(`/requests/${id}`);
export const submitRequest = (data) => api.post('/requests', data);
export const approveRequest = (id) => api.patch(`/requests/${id}/approve`);
export const rejectRequest = (id) => api.patch(`/requests/${id}/reject`);
```

### [NEW] `src/api/userApi.js`

```javascript
import api from './axiosInstance';

export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const resetPassword = (id, data) => api.patch(`/users/${id}/reset-password`, data);
export const unlockAccount = (id) => api.patch(`/users/${id}/unlock`);
```

### [NEW] `src/api/logApi.js`

```javascript
import api from './axiosInstance';

export const getLogs = (params) => api.get('/logs', { params });
```

### [NEW] `src/api/reportApi.js`

```javascript
import api from './axiosInstance';

export const exportProperties = (format) =>
  api.get(`/reports/properties/${format}`, { responseType: 'blob' });
export const exportLogs = (format) =>
  api.get(`/reports/logs/${format}`, { responseType: 'blob' });
```

---

## Step 2: Create Shared Hooks and Utilities

### [NEW] `src/hooks/useFetch.js`

A reusable data-fetching hook:

```javascript
import { useState, useEffect, useCallback } from 'react';

const useFetch = (apiFn, params = {}, autoFetch = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(overrideParams || params);
      setData(res.data.data);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (autoFetch) fetch(); }, []);

  return { data, loading, error, refetch: fetch };
};

export default useFetch;
```

### [NEW] `src/hooks/usePagination.js`

```javascript
import { useState } from 'react';

const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  return { page, limit, setPage };
};

export default usePagination;
```

### [NEW] `src/utils/helpers.js`

```javascript
// Download blob response as file
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Format date for display (Arabic)
export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ar-JO', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
```

---

## Step 3: Create Reusable Table Components

### [NEW] `src/components/common/DataTable.jsx`

A generic, reusable Arabic table component:

- Props: `columns` (array of `{ key, label, render? }`), `data`, `loading`, `emptyMessage`
- Show `<Spinner />` when loading
- Show "لا توجد بيانات" when data is empty
- Style with Tailwind: RTL aligned, bordered rows, hover effect

### [NEW] `src/components/common/Pagination.jsx`

- Props: `currentPage`, `totalPages`, `onPageChange`
- Buttons: السابق / التالي (Previous / Next)
- Show page info: "صفحة X من Y"

### [NEW] `src/components/common/Badge.jsx`

Status indicator component:

- Uses the `STATUS_COLORS` mapping from `src/constants/index.js`
- Props: `status` (string)
- Returns a colored span like `<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{status}</span>`

### [NEW] `src/components/common/SearchBar.jsx`

- RTL input with search icon
- Props: `value`, `onChange`, `placeholder`
- Debounced input (300ms) to avoid excessive API calls

---

## Step 4: Create Page Components

### [NEW] `src/pages/Dashboard.jsx` (FE-06)

**Admin View:**
- Stats cards in a grid (4 cards):
  - إجمالي العقارات (Total Properties) — call `GET /properties?limit=1` for totalCount
  - الطلبات المعلقة (Pending Requests) — call `GET /requests?status=معلق&limit=1` for totalCount
  - المستخدمين (Users count) — call `GET /users?limit=1` for totalCount
  - آخر نشاط (Recent Activity) — call `GET /logs?limit=5` for recent log entries
- A recent activity table below the cards showing last 5 log entries

**Employee View:**
- Stats cards:
  - طلباتي المعلقة (My Pending Requests) — call `GET /requests/my?status=معلق&limit=1`
  - طلباتي المقبولة (My Approved Requests) — call `GET /requests/my?status=مقبول&limit=1`
- A list of the employee's recent requests

**Design:** Use colored cards with icons from `react-icons/fi`. Use subtle shadows and rounded corners.

---

### [NEW] `src/pages/Properties.jsx` (FE-07)

**Layout:**
- Header bar: title "العقارات" + search input + (Admin only) "إضافة عقار" button
- DataTable with columns:

| Column | Key | Notes |
|--------|-----|-------|
| رقم الملف | `property_file_number` | Bold, primary key |
| اسم المالك | `owner_name` | |
| الرقم الوطني | `national_number` | |
| الموقع | `location` | |
| المساحة | `area` | |
| الحالة | `status` | Use `<Badge />` component |
| إجراءات | — | Admin: Edit / Delete buttons. Employee: View button |

**Features:**
- Search: Use the `/properties/search` endpoint with query params
- Pagination: Use `usePagination` hook
- Click row → navigate to `/properties/:fileNumber`
- Admin "Add" button opens a modal with `PropertyForm`
- Admin "Edit" action opens same modal pre-filled
- Admin "Delete" action shows confirmation modal, calls `DELETE /properties/:fileNumber`
- Employee sees restricted view for `محجوز` properties (backend already handles data filtering)

### [NEW] `src/pages/PropertyDetail.jsx` (FE-07)

- Route: `/properties/:fileNumber`
- Fetch property data via `GET /properties/:fileNumber`
- Display all property fields in a styled card
- Show status badge
- Admin: Show edit/delete action buttons
- Employee: Read-only view. If `محجوز`, show restricted message

### [NEW] `src/components/forms/PropertyForm.jsx` (FE-07)

- Reusable form for add/edit property
- Fields: رقم الملف, اسم المالك, الرقم الوطني, الموقع, المساحة, الحالة (dropdown)
- Used inside a `<Modal />` or as a standalone page
- Client-side validation matching backend Zod schema:
  - `propertyFileNumber`: required, positive integer
  - `ownerName`: required, string 3-200 chars
  - `nationalNumber`: required, 10-digit number
  - `location`: required, string
  - `area`: required, string
  - `status`: one of `مؤقت`, `مصدق`, `محجوز`

---

### [NEW] `src/pages/Requests.jsx` (FE-08)

**Admin View:**
- Page title: "جميع الطلبات"
- DataTable showing all requests from `GET /requests`
- Columns: رقم الطلب, رقم الملف, المقدم, نوع الطلب, الحالة (Badge), التاريخ, إجراءات
- Actions: "عرض التفاصيل" button → navigate to `/requests/:id`
- Filter by status dropdown (معلق, مقبول, مرفوض, الكل)

**Employee View:**
- Page title: "طلباتي"
- DataTable showing own requests from `GET /requests/my`
- Same columns minus the "المقدم" column
- "تقديم طلب جديد" button opens request form

### [NEW] `src/pages/RequestDetail.jsx` (FE-08)

- Route: `/requests/:id`
- Fetch via `GET /requests/:id`
- Display request metadata (requester, date, type, status)
- Side-by-side comparison of `old_data` vs `new_data` in a diff-style view:
  - Show each changed field with old value (red/strikethrough) and new value (green)
- Admin actions: "موافقة" (Approve) and "رفض" (Reject) buttons
  - Each shows a confirmation modal before calling the API
  - On success, show toast and redirect back to requests list

### [NEW] `src/components/forms/RequestForm.jsx` (FE-08)

- Employee-only form to submit a new request
- Fields:
  - رقم الملف العقاري (property file number input — can search/autocomplete)
  - نوع الطلب (dropdown: إضافة, تعديل, حذف)
  - وصف الطلب (textarea)
  - البيانات المقترحة (dynamic fields based on request type)
- Calls `POST /requests` with `{ propertyFileNumber, requestType, requestDescription, newData }`

---

### [NEW] `src/pages/Users.jsx` (FE-09)

- Admin only (protected by RoleGuard in router)
- DataTable with columns: الاسم الكامل, اسم المستخدم, الدور (Badge), الحالة (مقفل/نشط), تاريخ الإنشاء, إجراءات
- Actions per row:
  - "تعديل" → open user edit modal
  - "إعادة تعيين كلمة المرور" → confirmation modal → `PATCH /users/:id/reset-password`
  - "فتح القفل" (only if locked) → `PATCH /users/:id/unlock`
  - "حذف" → confirmation modal → `DELETE /users/:id`
- "إضافة مستخدم" button → opens `UserForm` modal

### [NEW] `src/components/forms/UserForm.jsx` (FE-09)

- Fields: الاسم الأول, الاسم الأخير, اسم المستخدم, كلمة المرور (create only), الدور (dropdown: مدير, موظف)
- Client-side validation:
  - `username`: required, 3-100 chars
  - `password`: required on create, min 8 chars, at least one uppercase + number + special char
  - `firstName`, `lastName`: required
  - `role`: one of `مدير`, `موظف`

---

### [NEW] `src/pages/Logs.jsx` (FE-10)

- Admin only
- DataTable with columns: المستخدم, الإجراء, الهدف, التاريخ
- Filters: dropdown for action type, date range picker, search by username
- Pagination
- No edit/delete actions (append-only, read-only table)
- Data from `GET /logs?page=X&limit=Y&action=Z`

---

### [NEW] `src/pages/Reports.jsx` (FE-11)

- Page with export cards/buttons:
  - **تقرير العقارات** section:
    - "تصدير PDF" button → calls `GET /reports/properties/pdf` → download blob
    - "تصدير Excel" button → calls `GET /reports/properties/excel` → download blob
  - **تقرير سجل التدقيق** section (Admin only):
    - "تصدير PDF" → `GET /reports/logs/pdf`
    - "تصدير Excel" → `GET /reports/logs/excel`
- Use the `downloadBlob` helper from `src/utils/helpers.js`
- Show loading spinner on each button during download

---

## Step 5: Update Routing (`App.jsx`)

### [MODIFY] `src/App.jsx`

Add all new page routes inside the protected layout:

```jsx
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Requests from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import Users from './pages/Users';
import Logs from './pages/Logs';
import Reports from './pages/Reports';
import RoleGuard from './guards/RoleGuard';
import { ROLES } from './constants';

// Inside the protected <Route element={...}> block:
<Route index element={<Dashboard />} />
<Route path="properties" element={<Properties />} />
<Route path="properties/:fileNumber" element={<PropertyDetail />} />
<Route path="requests" element={<Requests />} />
<Route path="requests/:id" element={<RequestDetail />} />
<Route path="users" element={
  <RoleGuard allowedRoles={[ROLES.ADMIN]}>
    <Users />
  </RoleGuard>
} />
<Route path="logs" element={
  <RoleGuard allowedRoles={[ROLES.ADMIN]}>
    <Logs />
  </RoleGuard>
} />
<Route path="reports" element={<Reports />} />
```

---

## Step 6: UX Polish (FE-12)

- Ensure all async operations show `<Spinner />` placeholders
- All destructive actions (delete, approve, reject) use `<Modal />` confirmation
- Toast notifications via `react-hot-toast`:
  - `toast.success('تم بنجاح')` on create/update/delete
  - `toast.error(message)` on API errors
- Loading states on buttons (pass `loading` prop to `<Button />`)
- Empty states: show a message + icon when tables have no data

---

## File Creation Summary

| # | File | Type |
|---|------|------|
| 1 | `src/api/propertyApi.js` | API Service |
| 2 | `src/api/requestApi.js` | API Service |
| 3 | `src/api/userApi.js` | API Service |
| 4 | `src/api/logApi.js` | API Service |
| 5 | `src/api/reportApi.js` | API Service |
| 6 | `src/hooks/useFetch.js` | Custom Hook |
| 7 | `src/hooks/usePagination.js` | Custom Hook |
| 8 | `src/utils/helpers.js` | Utility |
| 9 | `src/components/common/DataTable.jsx` | Component |
| 10 | `src/components/common/Pagination.jsx` | Component |
| 11 | `src/components/common/Badge.jsx` | Component |
| 12 | `src/components/common/SearchBar.jsx` | Component |
| 13 | `src/pages/Dashboard.jsx` | Page |
| 14 | `src/pages/Properties.jsx` | Page |
| 15 | `src/pages/PropertyDetail.jsx` | Page |
| 16 | `src/pages/Requests.jsx` | Page |
| 17 | `src/pages/RequestDetail.jsx` | Page |
| 18 | `src/pages/Users.jsx` | Page |
| 19 | `src/pages/Logs.jsx` | Page |
| 20 | `src/pages/Reports.jsx` | Page |
| 21 | `src/components/forms/PropertyForm.jsx` | Form |
| 22 | `src/components/forms/RequestForm.jsx` | Form |
| 23 | `src/components/forms/UserForm.jsx` | Form |
| 24 | `src/App.jsx` | Modified |

---

## Verification Plan

1. `npm run build` — must succeed with no errors
2. Login as Admin → verify all 6 sidebar links work
3. Login as Employee → verify only 4 sidebar links visible (no Users, no Logs)
4. Properties: verify list, search, add, edit, delete flow
5. Requests: verify submit (employee), approve/reject (admin)
6. Users: verify create, reset password, unlock, delete
7. Logs: verify list with filters
8. Reports: verify PDF and Excel downloads
