# Architectural & Design Decisions

This document tracks core architectural design patterns, trade-offs, and critical conventions that must be adhered to when working with the FixPoint codebase.

---

## 1. Issue Route Resolution Scoping

### Context
A standard relational approach identifies resources globally by a unique incrementing integer (`id`), leading to URLs like `/issues/42`. However, this can leak internal state (e.g., total issues created across the platform) and expose the system to easy ID-enumeration attacks.

### Decision
FixPoint isolates issue routing logic by user roles:
- **Admin**: Views and modifies issues using the raw global database `id`.
- **User**: Views and modifies issues using a sequential, 1-based index local to their own set of created issues (`displayId`).

### Consequences
- When adding, updating, or reviewing issue details, any service endpoint must inspect the current user's role.
- If the role is `USER`, the incoming ID parameter represents the *user-scoped sequential index*. The service must resolve this to the database primary key by retrieving the user's issue list sorted by creation order and selecting `displayId - 1`.
- Any new features (e.g. searching, deleting, commenting) must preserve this scoping to prevent non-admin users from referencing internal database primary keys.

---

## 2. Stateless Auth and 401 Interception

### Context
To maintain responsive security, the application uses short-lived JWT tokens, but clients must handle token expiry or manual invalidation gracefully without corrupting UI state.

### Decision
- The frontend Axios instance `api` in `web/fixpoint-frontend/src/shared/api/api.js` captures `401 Unauthorized` responses automatically.
- Upon receiving a `401`, it immediately flushes `localStorage` token credentials and forces a hard redirect to the home login route `/`.

### Consequences
- Endpoints returning `401` from the Spring Boot API will trigger immediate logout on the client.
- Secure routes do not need duplicate client-side checks for expiry; they can rely on Axios intercepting the security barrier automatically.

---

## 3. Asynchronous Processes

### Context
Email notifications and file disk uploads can introduce network latency, degrading response times for core user actions (like updating status or posting comments).

### Decision
- **Emails**: Handled asynchronously using Spring Boot's `@EnableAsync` annotation on the Application configuration class and `@Async` on individual service triggers.
- **Files**: Stored directly in local system filesystems via `FileStorageService` instead of heavy database blobs. Stored files are prefixed with custom UUIDs to keep storage names completely collision-free.

### Consequences
- Do not make SMTP calls synchronous; always dispatch email messages on distinct execution threads.
- If storage scalability becomes a problem, the `FileStorageService` can be retrofitted (e.g. S3 uploads) without refactoring controllers because they are abstracted by the service layer.
