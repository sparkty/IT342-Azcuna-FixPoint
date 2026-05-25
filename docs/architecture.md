# FixPoint System Architecture Analysis

This document provides a comprehensive overview of the architecture, folder structure, module design, and conventions of the **FixPoint** application, an issue-tracking and management platform supporting web and mobile platforms.

---

## 1. System Overview

FixPoint is a multi-platform system composed of:
1. **Backend**: A Java Spring Boot REST API backed by a PostgreSQL database (Supabase in local environments), featuring JWT-based authentication, async email dispatching, and file attachment handling.
2. **Frontend**: A React Single Page Application (SPA) built on Vite. It utilizes custom CSS for styling, implements responsive dashboards, and handles token-based auth state.
3. **Mobile**: An Android native application built in Kotlin/Gradle, leveraging Retrofit for backend communication.

---

## 2. Directory Structure & Module Breakdown

```text
IT342-Azcuna-FixPoint/
├── backend/                       # Maven-based Spring Boot API
│   ├── src/main/java/edu/cit/azcuna/fixpoint/
│   │   ├── auth/                  # Authentication endpoints, logic, DTOs
│   │   ├── deleterequest/         # Issue deletion requests (Admin approval workflow)
│   │   ├── email/                 # SMTP Mail service (Thymeleaf-templated)
│   │   ├── file/                  # File upload storage & serving service
│   │   ├── issue/                 # Core issues & comment management
│   │   ├── notification/          # Notification dispatching system
│   │   ├── shared/                # Common config (SecurityConfig) and security (JWT, UserDetails)
│   │   └── user/                  # User entities & persistence
│   └── src/main/resources/        # YML configuration & templates
│
├── web/                           # Web Frontend
│   └── fixpoint-frontend/         # React SPA
│       ├── src/
│       │   ├── shared/            # Common layout components (Sidebar, TopNav) & API client (api.js)
│       │   └── features/          # Screen-based feature modules:
│       │       ├── auth/          # Login and registration screens
│       │       ├── issues/        # Dashboard, create, and detail screens
│       │       └── notifications/ # Notifications inbox screen
│
└── mobile/                        # Native Android Application (Kotlin)
    └── app/src/main/java/com/azcuna/fixpoint/
        ├── api/                   # Retrofit API clients & configuration
        ├── model/                 # Data classes mapping API response structures
        └── ui/                    # Native UI screens (Login, Register, Home)
```

---

## 3. Backend Architecture (Spring Boot)

The backend follows a layered MVC-like pattern separated into Controllers, Services, and Repositories with structured Data Transfer Objects (DTOs).

### 3.1 Database Entities & Relationships
- **User**: Represents system users. Roles: `USER` and `ADMIN`. Handled via standard password authentication or Google OAuth.
- **Issue**: Core domain model. Features attributes such as `Category` (TECHNICAL, BILLING, GENERAL, OTHER), `Status` (PENDING, IN_PROGRESS, RESOLVED), `Priority` (LOW, MEDIUM, HIGH), and file attachment mapping.
- **IssueComment**: Represents comments attached to a specific issue. One-to-many relationship with `Issue`.
- **Notification**: User-specific notification records. Used to alert users of status changes on their issues or admins of pending deletion requests.
- **DeleteRequest**: Workflow for standard users to request the deletion of an issue, subject to administrative approval/rejection.

### 3.2 Dynamic Route IDs & Scoping (Crucial Architecture Pattern)
A key convention in the issue handling code is the distinction between a database primary key `id` and a user-facing scoped **`displayId`**:
- **For Admins**: Issues are queried directly by their database primary key `routeId` (maps to database `id`).
- **For Users**: Issue list queries fetch all issues belonging to the current user ordered by ID. The user-facing ID is sequential (`1`, `2`, `3`, ...) starting from their oldest issue.
- When retrieving an issue, a non-admin user queries `routeId`. The system translates `routeId` into the user's sequential index (`routeId - 1`) and retrieves that index from the user's issues.
- *Rationale*: This keeps URLs clean and scopes resource access naturally (e.g. `/issue/1` maps to the current user's first issue, while preventing enumeration of other users' database IDs).

### 3.3 Security & Middleware
- **SecurityConfig**: Formulates a stateless API security model using Spring Security.
- **JwtAuthFilter**: A servlet request filter intercepting requests, verifying `Authorization: Bearer <token>` headers, and establishing security context in standard Spring controllers.
- **BCryptPasswordEncoder**: Used for standard user password hashing (12 rounds).
- **CORS Configuration**: Supports origins such as `http://localhost:5173` and the deployed frontend environment.

### 3.4 Auxiliary Services
- **FileStorageService**: Saves file attachments to the filesystem (`uploads/` directory) with randomized UUID pre-fixes to prevent collision.
- **EmailService**: Employs `@EnableAsync` for async email dispatch. Leverages SMTP (configured for Gmail locally) to alert users of updates.

---

## 4. Frontend Architecture (React)

The frontend is an optimized SPA prioritizing modular design.

### 4.1 Global API & Auth Client (`api.js`)
- Configures a baseline Axios instance (`api`) with `withCredentials: true` and `/api/v1` prefix.
- **Interceptors**:
  - *Request Interceptor*: Appends standard token `Authorization: Bearer <token>` dynamically from `localStorage`.
  - *Response Interceptor*: Dynamically intercepts `401 Unauthorized` responses, flushes `localStorage` details, and redirects users back to the login (`/`) page.
- Exports granular service wrappers (`authService`, `issueService`, `commentService`, `notificationService`, `deleteRequestService`).

### 4.2 Application Flow & Routing
Managed by `react-router-dom`:
- `/` -> Login and registration panels.
- `/dashboard` -> Multi-paned list of active issues with advanced sorting/filters, global statistics cards, and links to notifications or issue detail views.
- `/create-issue` -> Form supports text metadata and optional multipart file uploads (attachment support).
- `/issue/:id` -> Focus details of a single issue, comment feed, and deletion workflow request.
- `/notifications` -> User notification tray.

---

## 5. Mobile Architecture (Android)

A simplified implementation designed in native Kotlin:
- Communicates with the Spring Boot backend using Retrofit + OkHttp clients (`ApiClient`).
- Direct activities handle authentication state:
  - `LoginActivity`: Accepts user credentials, issues login API calls, and saves session tokens.
  - `RegisterActivity`: Standard signup workflow.
  - `HomeActivity`: Serves as the post-login hub.

---

## 6. Development Conventions & Patterns

To maintain codebase health and consistency:
1. **Reuse Existing Services**: Direct modifications should build on existing services (e.g., `NotificationService`, `EmailService`, `FileStorageService`).
2. **DTO Mapping**: Avoid sending raw entity structures to the client. Keep controller endpoints clean by passing structured request/response objects (e.g., mapping models via `IssueResponse.from()`).
3. **No Database schema changes without justification**: Spring Data JPA's `ddl-auto=update` is enabled, but manual migrations/validations must respect existing structure constraints.
4. **Follow Scoped Route Conventions**: Respect the `displayId` lookup mechanism for user roles.
