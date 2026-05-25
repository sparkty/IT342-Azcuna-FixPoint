# Project Progress & Current Plan

This document tracks the current task list, upcoming features, and the active progress status of modifications to the FixPoint system.

---

## Current Status

- [x] Initial codebase architecture analysis completed.
- [x] Folder structure, module flow, and conventions analyzed.
- [x] Created `docs/architecture.md` detailing architecture patterns.
- [x] Created `docs/decisions.md` capturing key design conventions.
- [x] Fixed issue attachment preview and download URLs in `IssueDetailScreen.jsx` using `api.defaults.baseURL`.
- [x] Build successfully verified with Vite (`npm run build` completed).

---

## Upcoming Backlog / Phase Plan

*Awaiting customer directions for specific features or bugs to address next.*

---

## Verification & Status Log

### Local Environment Verification
- **Vite Build**: Successfully executed production build bundle without compilation errors.
- **Attachment URLs**: Both file preview (`img src`) and download (`a href`) have been consolidated to reference the dynamic backend root URL `${api.defaults.baseURL}/files/{filename}`.
