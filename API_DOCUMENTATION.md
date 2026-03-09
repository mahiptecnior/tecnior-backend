# Tecnior Backend API Documentation

**Base URL:** `https://api.tecnior.com`
**Version:** 1.0.0
**Auth:** JWT Bearer Token

---

## Response Format

All responses follow this structure:

```json
{ "success": true, "data": {} }
{ "success": false, "error": "message" }
```

---

## Authentication

Include this header on all protected routes:
```
Authorization: Bearer <token>
```

---

## 1. Auth

### POST `/api/auth/register`
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "min6chars",
  "display_name": "John Doe"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "avatar_url": null,
      "created_at": "2026-03-09T12:00:00.000Z"
    }
  }
}
```

---

### POST `/api/auth/login`
Login with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "roles": ["admin"]
    }
  }
}
```

---

### GET `/api/auth/me` 🔒
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "avatar_url": null,
    "created_at": "2026-03-09T12:00:00.000Z",
    "roles": ["admin"]
  }
}
```

---

## 2. Products

### GET `/api/products`
Get all products. Public.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| active | boolean | Filter active only: `?active=true` |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Web App",
      "slug": "web-app",
      "description": "Custom web apps",
      "short_description": null,
      "price": "999.00",
      "price_label": "Starting from",
      "category": "Development",
      "icon": "Package",
      "features": null,
      "image_url": null,
      "is_featured": 1,
      "is_active": 1,
      "sort_order": 0,
      "created_at": "2026-03-09T12:00:00.000Z",
      "updated_at": "2026-03-09T12:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/products/:id`
Get single product by ID. Public.

**Response `200`:** Single product object (same as above).

---

### POST `/api/products` 🔒 Admin
Create a new product.

**Body:**
```json
{
  "name": "Web App",
  "slug": "web-app",
  "description": "Full description",
  "short_description": "Short desc",
  "price": 999.00,
  "price_label": "Starting from",
  "category": "Development",
  "icon": "Package",
  "features": ["Feature 1", "Feature 2"],
  "image_url": "https://example.com/image.jpg",
  "is_featured": true,
  "is_active": true,
  "sort_order": 0
}
```

**Response `201`:** Created product object.

---

### PUT `/api/products/:id` 🔒 Admin
Update a product. Same body as POST.

**Response `200`:** Updated product object.

---

### DELETE `/api/products/:id` 🔒 Admin

**Response `200`:**
```json
{ "success": true, "data": { "message": "Product deleted" } }
```

---

## 3. Job Openings

### GET `/api/jobs`
Get all active job openings. Public.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Frontend Developer",
      "department": "Engineering",
      "location": "Remote",
      "type": "Full-time",
      "description": "Job description...",
      "icon": "Briefcase",
      "is_active": 1,
      "sort_order": 0,
      "created_at": "2026-03-09T12:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/jobs` 🔒 Admin
Create a job opening.

**Body:**
```json
{
  "title": "Frontend Developer",
  "department": "Engineering",
  "location": "Remote",
  "type": "Full-time",
  "description": "Job description...",
  "icon": "Briefcase",
  "is_active": true,
  "sort_order": 0
}
```

**Response `201`:** Created job object.

---

### PUT `/api/jobs/:id` 🔒 Admin
Update a job. Same body as POST.

---

### DELETE `/api/jobs/:id` 🔒 Admin

**Response `200`:**
```json
{ "success": true, "data": { "message": "Job deleted" } }
```

---

## 4. Job Applications

### POST `/api/applications`
Submit a job application. Public.
Accepts `multipart/form-data` for resume upload.

**Body (form-data):**
| Field | Type | Required |
|-------|------|----------|
| job_id | string | No |
| job_title | string | Yes |
| full_name | string | Yes |
| email | string | Yes |
| phone | string | No |
| resume | file (PDF/DOC/DOCX, max 5MB) | No |
| resume_url | string | No |
| cover_letter | string | No |
| portfolio_url | string | No |
| linkedin_url | string | No |

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "uuid",
    "job_title": "Frontend Developer",
    "full_name": "John Doe",
    "email": "john@example.com",
    "status": "pending",
    "created_at": "2026-03-09T12:00:00.000Z"
  }
}
```

---

### GET `/api/applications` 🔒 Admin
List all applications.

**Query Params:**
| Param | Description |
|-------|-------------|
| job_id | Filter by job |
| status | `pending` / `reviewing` / `shortlisted` / `rejected` |

---

### PUT `/api/applications/:id` 🔒 Admin
Update application status.

**Body:**
```json
{ "status": "shortlisted" }
```
Status values: `pending` | `reviewing` | `shortlisted` | `rejected`

---

### DELETE `/api/applications/:id` 🔒 Admin

---

## 5. Form Submissions

### POST `/api/submissions`
Submit a form. Public.

**Body:**
```json
{
  "form_type": "contact",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "subject": "Project Inquiry",
  "message": "I would like to discuss...",
  "budget": "$5000-$10000",
  "preferred_date": "2026-03-15",
  "preferred_time": "10:00 AM",
  "service_interest": "Web Development",
  "priority": "normal"
}
```

**`form_type` values:** `contact` | `consultation` | `support`
**`priority` values:** `low` | `normal` | `high` | `urgent`

**Response `201`:** Created submission object.

---

### GET `/api/submissions` 🔒 Admin
List all submissions.

**Query Params:**
| Param | Description |
|-------|-------------|
| type | `contact` / `consultation` / `support` |
| status | `new` / `in_progress` / `resolved` / `closed` |

---

### PUT `/api/submissions/:id` 🔒 Admin
Update submission status.

**Body:**
```json
{ "status": "in_progress" }
```
Status values: `new` | `in_progress` | `resolved` | `closed`

---

### DELETE `/api/submissions/:id` 🔒 Admin

---

## 6. Page SEO

### GET `/api/seo?path=/about`
Get SEO data for a specific page. Public.

**Query Params:**
| Param | Required | Description |
|-------|----------|-------------|
| path | Yes | Page path e.g. `/about` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "page_name": "About",
    "page_path": "/about",
    "meta_title": "About Us - Tecnior",
    "meta_description": "Learn about Tecnior...",
    "meta_keywords": "tecnior, about",
    "og_title": "About Us",
    "og_description": "Learn about Tecnior...",
    "og_image": "https://example.com/og.jpg",
    "og_type": "website",
    "canonical_url": null,
    "robots": "index, follow",
    "twitter_card": "summary_large_image",
    "json_ld": null,
    "is_active": 1
  }
}
```

---

### GET `/api/seo/all` 🔒 Admin
List all SEO entries.

---

### PUT `/api/seo/:id` 🔒 Admin
Update SEO entry.

**Body:**
```json
{
  "page_name": "About",
  "page_path": "/about",
  "meta_title": "About Us - Tecnior",
  "meta_description": "Learn about Tecnior...",
  "meta_keywords": "tecnior, about",
  "og_title": "About Us",
  "og_description": "Learn about Tecnior...",
  "og_image": "https://example.com/og.jpg",
  "og_type": "website",
  "canonical_url": null,
  "robots": "index, follow",
  "twitter_card": "summary_large_image",
  "json_ld": {},
  "is_active": true
}
```

---

## 7. Social Links

### GET `/api/socials`
Get all active social links. Public.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "platform": "Twitter",
      "url": "https://twitter.com/tecnior",
      "icon_svg": "<svg>...</svg>",
      "sort_order": 0,
      "is_active": 1
    }
  ]
}
```

---

### POST `/api/socials` 🔒 Admin

**Body:**
```json
{
  "platform": "Twitter",
  "url": "https://twitter.com/tecnior",
  "icon_svg": "<svg>...</svg>",
  "sort_order": 0,
  "is_active": true
}
```

---

### PUT `/api/socials/:id` 🔒 Admin
Same body as POST.

---

### DELETE `/api/socials/:id` 🔒 Admin

---

## 8. Site Settings

### GET `/api/settings` 🔒 Admin
Get all settings.

**Query Params:**
| Param | Description |
|-------|-------------|
| group | Filter by group: `?group=smtp` |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "setting_key": "smtp_host",
      "setting_value": "smtp.gmail.com",
      "setting_group": "smtp",
      "is_encrypted": false
    }
  ]
}
```

---

### PUT `/api/settings/:key` 🔒 Admin
Update or create a setting by key.

**Body:**
```json
{
  "setting_value": "smtp.gmail.com",
  "setting_group": "smtp",
  "is_encrypted": false
}
```

**Example keys:** `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `site_name`, `site_email`

---

## 9. Users & Roles

### GET `/api/users` 🔒 Admin
List all users with their roles.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "admin@tecnior.com",
      "display_name": "Admin",
      "avatar_url": null,
      "created_at": "2026-03-09T12:00:00.000Z",
      "roles": ["admin"]
    }
  ]
}
```

---

### POST `/api/users` 🔒 Admin
Create a new user with a role.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "John Doe",
  "role": "moderator"
}
```
**`role` values:** `admin` | `moderator` | `user`

---

### PUT `/api/users/:id/role` 🔒 Admin
Change a user's role.

**Body:**
```json
{ "role": "admin" }
```

---

### DELETE `/api/users/:id/role` 🔒 Admin
Remove a role from a user.

**Body (optional):**
```json
{ "role": "moderator" }
```
If `role` is omitted, all roles are removed.

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — admin access required |
| 404 | Resource not found |
| 409 | Conflict — e.g. duplicate email/slug |
| 500 | Internal server error |

---

## Quick Reference

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | User |
| GET | /api/products | Public |
| GET | /api/products/:id | Public |
| POST | /api/products | Admin |
| PUT | /api/products/:id | Admin |
| DELETE | /api/products/:id | Admin |
| GET | /api/jobs | Public |
| POST | /api/jobs | Admin |
| PUT | /api/jobs/:id | Admin |
| DELETE | /api/jobs/:id | Admin |
| POST | /api/applications | Public |
| GET | /api/applications | Admin |
| PUT | /api/applications/:id | Admin |
| DELETE | /api/applications/:id | Admin |
| POST | /api/submissions | Public |
| GET | /api/submissions | Admin |
| PUT | /api/submissions/:id | Admin |
| DELETE | /api/submissions/:id | Admin |
| GET | /api/seo | Public |
| GET | /api/seo/all | Admin |
| PUT | /api/seo/:id | Admin |
| GET | /api/socials | Public |
| POST | /api/socials | Admin |
| PUT | /api/socials/:id | Admin |
| DELETE | /api/socials/:id | Admin |
| GET | /api/settings | Admin |
| PUT | /api/settings/:key | Admin |
| GET | /api/users | Admin |
| POST | /api/users | Admin |
| PUT | /api/users/:id/role | Admin |
| DELETE | /api/users/:id/role | Admin |
