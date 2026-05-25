# Project Progress & Current Plan

This document tracks the current task list, upcoming features, and the active progress status of modifications to the FixPoint system.

---

## Current Status

- [x] Initial codebase architecture analysis completed.
- [x] Folder structure, module flow, and conventions analyzed.
- [x] Created `docs/architecture.md` detailing architecture patterns.
- [x] Created `docs/decisions.md` capturing key design conventions.
- [x] Fixed issue attachment preview and download URLs in `IssueDetailScreen.jsx` using `api.defaults.baseURL`.
- [x] Fixed CSS stacking/positioning overlap of the sidebar panels in `IssueDetailScreen`.
- [x] Implemented a robust React router `ProtectedRoute` routing security layer to shield secure routes and auto-redirect authenticated sessions.
- [x] Build successfully verified with Vite (`npm run build` completed).

---

## Upcoming Backlog / Phase Plan

*Awaiting customer directions for specific features or bugs to address next.*

---

## Verification & Status Log

### Local Environment Verification
- **Vite Build**: Successfully executed production build bundle without compilation errors.
- **Attachment URLs**: Both file preview (`img src`) and download (`a href`) have been consolidated to reference the dynamic backend root URL `${api.defaults.baseURL}/files/{filename}`.
- **Sidebar Stacking**: Shifted stickiness from the inner status card to the new `.detail-sidebar` column container. Panels stick and scroll together without overlapping.
- **Route Security & Flow**:
  - Direct deep links to secure routes (like `/dashboard` or `/issue/1`) are now guarded by `ProtectedRoute`. Unauthenticated deep links are automatically hijacked and redirected to `/`.
  - Manual navigation to the index login screen `/` by already-authenticated sessions is intercepted, redirecting active users back to `/dashboard`.
