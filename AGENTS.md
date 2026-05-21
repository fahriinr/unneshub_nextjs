# UnnesHub Development Guide

## 🎯 Project Core

- **App:** UnnesHub (Exclusive UNNES Community)
- **Scope:** Backend, API, DB Schema, UI, Middleware, Service.
- **Constraint:** NO new features, NO business flow changes, NO unauthorized role/auth modifications.

## ⚠️ Hard Rules

- **Email Validation:** MUST match `^[a-zA-Z0-9._%+-]+@students\.unnes\.ac\.id$`.
- **Anonymous Posting:** Real `user_id` MUST be stored in DB. Identity visible ONLY to Global Admin.
- **Community Approval:** ALL new communities MUST be approved by Global Admin before public view.
- **RBAC:** Strictly enforce Mahasiswa, Community Admin, and Global Admin permissions.

## 🏗️ RBAC & Access

- **Mahasiswa:** Profile management, join/leave, post (inc. anonymous), comment/reply, like, search.
- **Comm Admin:** Manage own community (desc, rules, cover), member moderation (approve/kick), events, broadcasts.
- **Global Admin:** Community approval, anonymous post moderation, user suspension, global role management.

## 🎨 UI Design System (Mobile First / APK Webview)

- **Layout:** Header (Logo+Nav), Main Content, Footer.
- **Colors:**
  - `--color-primary-dark`: #0A1D37 (BG, Header, High-contrast text)
  - `--color-accent-yellow`: #F4C41B (Primary buttons, FAB, Highlights)
  - `--color-bg-light`: #FFFFFF (Main content background)
  - `--color-surface-gray`: #D1D5DB (Cards, Borders, Inputs)
  - `--color-text-muted`: #6B7280 (Placeholders, Sub-headers)

## 🗄️ Database & Logic

- **Users:** `id, name, email, prodi, angkatan, role, is_verified`.
- **Communities:** `id, name, description, category (AKADEMIK, HOBI, KARIR, ORGANISASI, EVENT), status (PENDING_APPROVAL, APPROVED, REJECTED)`.
- **Posts:** `id, community_id, user_id, content, tag, is_anonymous`.
- **Comments:** `id, post_id, user_id, parent_comment_id (nested support), content`.
- **Membership:** `status (PENDING, APPROVED, REJECTED)`.

## 🚀 Execution Flow

1. **Auth:** Strict email validation + JWT/Session.
2. **Profile:** Management & Image uploads.
3. **Community:** Submission -> Global Admin Approval.
4. **Engagement:** Post creation, nested comments, real-time notifications.
5. **Security:** Auth & RBAC Middleware on all sensitive routes.

## ✅ Expected Output

Production-ready, patch-oriented, and concise code. Strict adherence to this spec is MANDATORY.

Rules:

- Be concise.
- Do not explain unless asked.
- Output code first.
- Avoid long markdown.
- Avoid repetition.
- Do not restate requirements.
- Minimize token usage.
- Never generate tutorial-style responses.
- Focus only on requested task.
- Skip greetings and conclusions.
