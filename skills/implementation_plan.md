# Spinwheel SMS Connect Sandbox App - Implementation Plan

This plan details the full-stack architecture, project structure, backend logic, frontend pages, security requirements, and verification plan for the Spinwheel Sandbox SMS connection and verification flow, adhering to `sms-full-prompt.md`.

---

## User Review Required

> [!IMPORTANT]
> - **Security Guardrails**:
>   - Frontend must **never** make direct requests to `https://sandbox-api.spinwheel.io`. All Spinwheel API calls must pass through our backend.
>   - Sensitive user verification data must **only** be kept in-memory (no `localStorage`, `sessionStorage`, cookies, etc.).
>   - The backend must return standardized HTTP cache control headers (`Cache-Control: no-store, no-cache, must-revalidate, private`, `Pragma: no-cache`, `Expires: 0`) on all sensitive response payloads.
>   - Raw request/response logging must redact all sensitive fields (e.g. phone numbers, DOBs, verification codes).
> - **Sandbox Credentials**: Use credentials and test numbers from the official Spinwheel [Sandbox Test Users Docs](https://docs.spinwheel.io/docs/test-users).

---

## Proposed Project Structure

We will implement a clean, lightweight monorepo containing distinct `frontend` and `backend` directories:

```text
spinwheel/
├── .gitignore
├── package.json               # Root scripts to orchestrate running both frontend & backend
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # Server entry point, middleware, health endpoint, & rate limits
│       ├── client.ts          # Centralized Spinwheel API client
│       ├── parser.ts          # Centralized error normalization utility
│       └── validation.ts      # Input sanitization and validators
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx            # Main layout and step state orchestrator
        ├── index.css          # Tailwind CSS and global styling tokens
        ├── components/
        │   ├── ConnectForm.tsx     # Step 1: User details & consent
        │   ├── VerifyForm.tsx      # Step 2: OTP submission
        │   ├── DebugPanel.tsx      # Collapsible JSON viewer and debugger
        │   └── UI/                 # UI primitives (Cards, Badges, Alert Banners, Buttons)
        └── utils/
            └── api.ts              # Fetch client communicating with backend
```

---

## Proposed Backend Implementation

The backend will be a Node.js Express server running on TypeScript.

### 1. Environment Configuration
- `SPINWHEEL_API_KEY`: API Key retrieved from the Spinwheel developer portal.
- `PORT`: Server port (defaults to `3001`).
- Upstream Base URL is hardcoded as `https://sandbox-api.spinwheel.io/v1`.

### 2. Endpoints
- **`GET /api/health`**
  - Lightweight server status check.
- **`POST /api/connect-user`**
  - **Inputs**: `phoneNumber` (E.164 format), `dateOfBirth` (YYYY-MM-DD).
  - **Action**: Generates a random UUID for `extUserId` and triggers Spinwheel's `POST /v1/users/connect/sms`.
- **`POST /api/verify-user`**
  - **Inputs**: `userId`, `code` (6-digit string).
  - **Action**: Triggers Spinwheel's `POST /v1/users/{userId}/connect/sms/verify`.

### 3. Error Normalization
All failures (including non-2xx status codes from Spinwheel) are transformed into a normalized JSON payload for safe frontend consumption:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_NUMBER",
    "message": "The provided phone number is invalid.",
    "details": [{ "desc": "The provided phone number is invalid." }],
    "httpStatus": 400,
    "source": "spinwheel"
  }
}
```

---

## Proposed Frontend Implementation

The frontend will be built using Vite + React + TypeScript + Tailwind CSS.

### 1. Step-by-Step Experience
- **Step 1: Connect User**
  - Inputs: Mobile Phone Number (empty by default) and DOB (prefilled with `1987-06-08`).
  - Contains the mandatory legal text and Hyperlink to the Spinwheel End User Agreement.
  - Submits to `/api/connect-user`. On success, saves `userId` and proceeds to Step 2.
- **Step 2: Verify Code**
  - Inputs: 6-digit OTP code. Stored `userId` is supplied programmatically.
  - Submits to `/api/verify-user`. On success, displays connection/profile details, SSN (masked), address, and raw response payloads.

### 2. Interactive Features
- **Progress Steps Indicator**: Highlights active, completed, or pending steps.
- **Error Mapping Alert Banners**: Formats known Spinwheel errors (e.g. `INVALID_NUMBER`, `EXPIRED`, `FAILED_ELIGIBILITY`) with descriptive messages and inline fields highlighting.
- **Collapsible Debugger & JSON Viewer**: Exposes the actual backend response payload for inspectability, with options to hide/mask sensitive values and copy sanitized JSON to clipboard.

---

## Verification Plan

### Automated Tests
- We will construct validation checks for input formats (e.g., E.164 regex, strict date format).
- Run server health check tests.

### Manual Verification
1. Boot the server and client using the root script (`npm run dev`).
2. Run connection flows using documented sandbox phone numbers and DOB combinations.
3. Test edge case errors (e.g., submitting an incorrect code, expired code, or invalid inputs) to check matching alert message banners.
4. Verify the responsive layouts on mobile and desktop viewports.
