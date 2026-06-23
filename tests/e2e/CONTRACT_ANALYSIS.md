# FR-01 to FR-03 Integration Contract Analysis

Static analysis of frontend payloads vs backend expectations and response shapes.

---

## ✅ MATCHED contracts

### FR-01-01: Citizen Registration

| Direction | Details |
|-----------|---------|
| FE → BE | `POST /api/auth/register` sends `{ name, email, phone, state, lga, password, confirmPassword, terms }` |
| BE expects | `signUpSchema`: same fields, phone optional (Nigerian format), password complexity enforced |
| BE → FE | `{ success: true, message: string }` on 201 |
| FE reads | Redirects to `/verify-email?email=...` on success |
| **Result** | ✅ Match |

### FR-01-05: OTP Send

| Direction | Details |
|-----------|---------|
| FE → BE | `POST /api/otp/send` sends `{ identifier: email, purpose: "CITIZEN_LOGIN" }` (login page) |
| BE expects | `otpSendSchema`: `{ identifier: email, purpose: enum["CITIZEN_LOGIN","LGA_LOGIN","REGISTER","SENSITIVE"] }` |
| BE → FE | `{ success: true, message: string, expiresIn: 300 }` |
| FE reads | Redirects to `/verify-otp?email=...&purpose=...&next=...` |
| **Result** | ✅ Match |

### FR-01-05: OTP Verify

| Direction | Details |
|-----------|---------|
| FE → BE | `POST /api/otp/verify` sends `{ identifier: email, code: "6digits", purpose }` |
| BE expects | `otpVerifySchema`: same fields, code must be 6 numeric digits |
| BE → FE | `{ success: true, message: string }` on 200; `{ error, attemptsRemaining?, locked? }` on 400/429 |
| FE reads | Checks `res.ok`, reads `data.locked`, `data.error`, `data.attemptsRemaining` |
| **Result** | ✅ Match |

### FR-01-03: Comments

| Direction | Details |
|-----------|---------|
| FE → BE | `POST /api/comments` sends `{ contentId, contentType, content, parentId? }` |
| BE expects | Same fields, content 1–500 chars |
| GET FE → BE | `/api/comments?contentId=&contentType=&page=` |
| BE → FE | `{ comments: [...], total, page, pages }` |
| FE reads | `body.comments`, `body.total`, `body.pages` |
| **Result** | ✅ Match |

### FR-01-03: Feedback

| Direction | Details |
|-----------|---------|
| FE → BE | `POST /api/feedback` sends `{ postId, rating, category, message }` |
| BE expects | `{ postId, rating: int 1-5, category: enum, message: 10-1000 chars }` |
| BE → FE | `{ success: true }` on 201 |
| **Result** | ✅ Match |

### FR-01-03: Flag/Report

| Direction | Details |
|-----------|---------|
| FE → BE | `POST /api/flag` sends `{ postId, reason, details? }` |
| BE expects | `{ postId, reason: enum["INAPPROPRIATE","MISINFORMATION","SPAM","OFFENSIVE","OTHER"], details?: max 500 }` |
| BE → FE | `{ success: true }` on 201 |
| **Result** | ✅ Match |

### FR-02-01: LGA Registration

| Direction | Details |
|-----------|---------|
| FE → BE | `POST /api/lga/register` sends `{ lgaName, state, chairmanName, email, phone, officeAddress, population?, description?, sectors, password, confirmPassword, terms }` |
| BE expects | `lgaSignUpSchema`: same shape |
| BE → FE | `{ success: true, lgaId: string, message: string }` on 201 |
| **Result** | ✅ Match |

### FR-02-05: LGA Login

| Direction | Details |
|-----------|---------|
| FE → BE | `POST /api/lga/login` sends `{ email, password }` |
| BE expects | `lgaLoginSchema`: `{ email, password }` |
| **Result** | ✅ Match |

### FR-03: LGA Dashboard Overview

| Direction | Details |
|-----------|---------|
| FE → BE | `GET /api/lga-dashboard/overview` with header `x-lga-id` from `sessionStorage.getItem("lgaId")` |
| BE expects | `req.headers.get("x-lga-id")` |
| BE → FE | `{ lga: { id, lgaName, state, chairmanName, status, isVerified, tenureStatus, tenureEndDate, gracePeriodEndsAt, freeUntil, subscriptionEnd, subscriptionStatus, _count: { wards, endowments, staff } } }` |
| FE reads | `overviewJson.lga`, all fields used in dashboard page |
| **Result** | ✅ Match |

---

## ❌ MISMATCHED contracts

### FR-01-03: Reactions — PostCard vs /api/reactions

**Severity: HIGH** — Reactions do not work in the PostCard component.

#### Payload mismatch

| | Sent by FE | Expected by BE |
|---|---|---|
| Field 1 | `postId: post.id` | `contentId: string` |
| Field 2 | *(missing)* | `contentType: "post" \| "project"` |
| Field 3 | `type: "LIKE" \| "DISLIKE"` | `type: "LIKE" \| "DISLIKE" \| "SUPPORT" \| "QUESTION" \| "REPORT"` |

`PostCard.tsx:87`:
```ts
body: JSON.stringify({ postId: post.id, type }),
```
`/api/reactions` route:
```ts
const { contentId, contentType, type } = body;
if (!contentId || !contentType || !type) { return 422 }
```

**Effect**: Every reaction from PostCard returns **422 Unprocessable Entity**. The optimistic update shows the click, but it's immediately reverted (error path sets state back to `post.likes` / `post.dislikes`).

#### Response shape mismatch

| | FE reads | BE returns |
|---|---|---|
| Likes count | `data.likes` | `data.counts.LIKE` |
| Dislikes count | `data.dislikes` | `data.counts.DISLIKE` |
| My reaction | `data.myReaction` | `data.myReaction` ✅ |

`PostCard.tsx:91-93`:
```ts
setLikes(data.likes);        // undefined — BE sends data.counts.LIKE
setDislikes(data.dislikes);  // undefined — BE sends data.counts.DISLIKE
setMyReaction(data.myReaction); // ✅ correct
```

**Fix needed in `PostCard.tsx`**:

```ts
// Change payload:
body: JSON.stringify({ contentId: post.id, contentType: "post", type }),

// Change response reads:
setLikes(data.counts?.LIKE ?? 0);
setDislikes(data.counts?.DISLIKE ?? 0);
setMyReaction(data.myReaction);
```

---

## Summary

| Contract | Status |
|----------|--------|
| Citizen registration (POST /api/auth/register) | ✅ |
| Email verification flow | ✅ |
| Citizen login (NextAuth credentials) | ✅ |
| OTP send (POST /api/otp/send) | ✅ |
| OTP verify (POST /api/otp/verify) | ✅ |
| Comments GET + POST (/api/comments) | ✅ |
| Feedback POST (/api/feedback) | ✅ |
| Flag/report POST (/api/flag) | ✅ |
| **Reactions POST (/api/reactions)** | ❌ payload & response mismatch |
| LGA registration (POST /api/lga/register) | ✅ |
| LGA login (POST /api/lga/login) | ✅ |
| LGA dashboard overview (GET /api/lga-dashboard/overview) | ✅ |
| Admin LGA approval (PATCH /api/admin/lgas/:id/status) | ✅ |
