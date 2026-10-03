# 📡 NagrikSeva API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require `Authorization: Bearer <token>`.

Response shape: `{ success, message, data }`

## Public — `/api/public`
GET /certificate-types · GET /certificate-types/:id · GET /announcements · GET /faqs · GET /stats
GET /states · GET /states/:stateId/districts · GET /districts/:districtId/taluks

## Citizen — `/api/citizen`
POST /register (multipart) · POST /login · GET /profile · PUT /profile (multipart) · PUT /change-password
GET /dashboard · POST /applications (multipart, field documents[]) · GET /applications
GET /applications/track/:application_number · GET /applications/:id · PUT /applications/:id/cancel
GET /applications/:id/download · GET /notifications · PUT /notifications/:id/read · PUT /notifications/read-all
POST /support · GET /support

## Employee — `/api/employee`
POST /login · GET /profile · GET /dashboard · GET /applications · GET /applications/:id
PUT /applications/:id/verify {remarks} · PUT /applications/:id/return {return_reason}
PUT /applications/:id/reject {rejection_reason} · GET /pension · POST /pension · GET /notifications

## Officer — `/api/officer`
POST /login · GET /profile · GET /dashboard · GET /applications/pending
PUT /applications/:id/approve {officer_remarks} · PUT /applications/:id/reject {rejection_reason, officer_remarks}
PUT /pension/:id/approve {stage, remarks} · GET /reports · GET /notifications

## Admin — `/api/admin`
POST /login · GET /profile · GET /dashboard
GET/POST /citizens · GET /citizens/:id · PUT /citizens/:id/toggle
GET/POST /employees · PUT /employees/:id · GET/POST /officers
GET/POST /departments · GET/POST /certificate-types · PUT /certificate-types/:id
GET /applications · GET /pension-applications · PUT /pension-applications/:id/approve
GET/POST/DELETE /announcements · GET/POST /faqs · GET /states, /districts, /taluks
GET /support-tickets · PUT /support-tickets/:id/resolve · GET /audit-logs · GET /notifications

## Application Status Lifecycle
```
submitted → under_verification → verified → completed
                ↓                    ↓
            returned/rejected    rejected
```

## Pension Status Lifecycle
```
submitted → hr_review → finance_review → admin_review → approved
```

## Error Codes
400 bad request · 401 unauthorized/expired · 403 wrong role · 404 not found · 409 conflict · 422 validation · 500 server error
