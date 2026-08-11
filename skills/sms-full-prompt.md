Build a complete, production-style full-stack web application for Spinwheel’s sandbox SMS connection and verification flow.

This must be a real working implementation, not a mockup, static prototype, or frontend-only app.

Core architecture:

* The frontend must only communicate with the backend.
* All Spinwheel API calls must be made by the backend.
* The Spinwheel API key must only exist in backend environment variables.
* The frontend must never contain Spinwheel credentials, Authorization headers, or direct requests to Spinwheel endpoints.

Goal:
Create a polished, modern, mobile-friendly 2-step experience that:

1. connects a user via SMS
2. verifies the SMS code
3. displays returned connection and profile data
4. shows real Spinwheel error messages to the user
5. is secure, maintainable, and easy to run locally

Tech stack:
Frontend:

* React
* TypeScript
* Tailwind CSS
* shadcn/ui style components if available
* Accessible and responsive UI

Backend:

* Backend/server-side functions or routes
* Node.js-compatible runtime
* TypeScript
* REST-style backend endpoints
* Centralized Spinwheel client
* Centralized error normalization
* Backend request validation

Project requirements:

* Generate the full project
* Include frontend and backend folders, or a clean monorepo structure
* Include package.json files
* Include clear run instructions
* Include .env.example for backend
* Use reusable components and utilities
* Do not leave API integration as pseudocode
* Do not stub the backend

Security and data handling requirements:

Secrets and API access:

* Never store, expose, log, or return the Spinwheel API key anywhere outside backend environment variables
* The frontend must never send direct requests to Spinwheel endpoints
* The backend must use the Spinwheel API key only when calling Spinwheel from the server

Sensitive data storage and caching:

* Do not persist sensitive user data in localStorage, sessionStorage, IndexedDB, cookies, URL params, local files, browser persistence layers, or debug persistence mechanisms
* Keep connection, verification, and profile data only in transient in-memory application state for the active session
* Do not implement client-side request caching, offline persistence, service-worker caching for API responses, or any storage layer that retains sensitive response data beyond the current in-memory session
* The backend must set Cache-Control: no-store, no-cache, must-revalidate, private on sensitive API responses, and should also set Pragma: no-cache and Expires: 0
* Do not cache sensitive endpoints at the framework, proxy, or CDN layer

Logging, telemetry, and monitoring:

* Do not log raw request bodies for /api/connect-user or /api/verify-user
* Do not log phone numbers, dates of birth, verification codes, SSN fragments, addresses, userId values, extUserId values, connectionId values, or full Spinwheel API responses
* If request or error logging is implemented, sensitive fields must be redacted before logging
* Do not send sensitive payloads or full API responses to analytics, telemetry, session replay, or third-party error monitoring tools

Transport and backend hardening:

* Local development may use localhost HTTP, but any deployed environment must use HTTPS end-to-end
* Restrict CORS to the intended frontend origin or local development origin only; do not use wildcard CORS on sensitive endpoints
* Use backend-platform security headers or middleware equivalents where supported
* Do not create login or session state for this demo unless explicitly required
* If any cookie is introduced, it must not contain PII and must be HttpOnly, Secure, and SameSite=Strict

Abuse protection and validation:

* Because Lovable does not provide established backend rate-limiting primitives, implement best-effort in-memory throttling and basic abuse protection for /api/connect-user and /api/verify-user within the backend runtime
* Use per-IP throttling and add per-phone-number or equivalent anti-abuse controls where practical
* Return structured JSON for locally enforced throttling events as well
* Treat this throttling as best-effort abuse reduction only; it is not a guaranteed distributed or persistent rate-limiting system
* Validate request body presence, format, length, and allowed characters
* Enforce strict YYYY-MM-DD format for dateOfBirth
* Enforce expected formatting and length for phoneNumber, userId, and code
* Reject unknown extra fields
* Limit request body size

Error and debug safety:

* Even when upstream requests fail, the backend must return sanitized structured JSON that the frontend can safely read
* Do not return raw upstream error bodies directly to the frontend
* Sanitize upstream error details before returning them
* The raw JSON viewer and debug panel may display current-session data, but must not persist it after refresh or restart
* Mask sensitive values in the debug panel and raw JSON viewer by default
* Any copy JSON action must copy a sanitized version by default unless the UI explicitly provides a reveal-sensitive-data action for local debugging

Spinwheel configuration:
Base URL:
https://sandbox-api.spinwheel.io/v1

Important base URL rule:

* The Spinwheel base URL is fixed and must always be https://sandbox-api.spinwheel.io/v1
* Do not ask the user to provide a base URL
* Do not create a form field, settings screen, prompt, or configuration input for the base URL
* Do not expose the base URL as a user-editable value in the frontend
* The backend should use this exact base URL internally
* If you include it in configuration, it may be a backend constant or defaulted internally, but the user must never be asked for it

Backend environment variables:
SPINWHEEL_API_KEY=your_key_here
PORT=3001

Spinwheel API 1: Connect user by SMS
POST /v1/users/connect/sms

Headers from backend to Spinwheel:

* Authorization: Bearer {SPINWHEEL_API_KEY}
* Content-Type: application/json

Request body:
{
  "extUserId": "randomly-generated-uuid",
  "dateOfBirth": "1987-06-08",
  "phoneNumber": "+1XXXXXXXXXX"
}

Rules:

* extUserId must always be randomly generated by the backend
* The frontend must not show or accept an external userId field
* The date of birth field must be editable
* Prefill DOB with 1987-06-08
* The backend must validate and use the DOB sent from the frontend

Connect success fields to support:

* userId
* extUserId
* connectionId
* connectionStatus
* sms.codeExpiresAt
* sms.codeTimeoutSeconds

Spinwheel API 2: Verify SMS code
POST /v1/users/{userId}/connect/sms/verify

Headers from backend to Spinwheel:

* Authorization: Bearer {SPINWHEEL_API_KEY}
* Content-Type: application/json

Request body:
{
  "code": "123456"
}

Verify success fields to support:

* userId
* extUserId
* connectionId
* connectionStatus
* profile.firstName
* profile.lastName
* profile.ssnLastFourDigits
* profile.phoneNumber
* profile.dateOfBirth
* profile.addresses

Backend API contract:

1. POST /api/connect-user

Request body:
{
  "phoneNumber": "<user-entered-e164-phone-number>",
  "dateOfBirth": "1987-06-08"
}

Behavior:

* Validate phoneNumber presence and basic format
* Validate dateOfBirth presence and YYYY-MM-DD format
* Generate extUserId on the backend
* Call Spinwheel POST /users/connect/sms
* Return normalized success JSON
* On failure, parse the Spinwheel error response and return normalized error JSON

Success response:
{
  "success": true,
  "data": {
    "userId": "string",
    "extUserId": "string",
    "connectionId": "string",
    "connectionStatus": "string",
    "sms": {
      "codeExpiresAt": "string",
      "codeTimeoutSeconds": 300
    }
  }
}

2. POST /api/verify-user

Request body:
{
  "userId": "string",
  "code": "123456"
}

Behavior:

* Validate userId presence
* Validate code presence
* Use the provided userId to call POST /v1/users/{userId}/connect/sms/verify
* Return normalized success JSON
* On failure, parse the Spinwheel error response and return normalized error JSON

Success response:
{
  "success": true,
  "data": {
    "userId": "string",
    "extUserId": "string",
    "connectionId": "string",
    "connectionStatus": "string",
    "profile": {
      "firstName": "string",
      "lastName": "string",
      "ssnLastFourDigits": "string",
      "phoneNumber": "string",
      "dateOfBirth": "string",
      "addresses": []
    }
  }
}

Normalized error response format:
{
  "success": false,
  "error": {
    "code": "INVALID_NUMBER",
    "message": "The provided phone number is invalid.",
    "details": [
      {
        "desc": "The provided phone number is invalid."
      }
    ],
    "httpStatus": 400,
    "source": "spinwheel"
  }
}

Critical backend error rule:
Even when Spinwheel returns a non-2xx status, the backend must still return structured JSON that the frontend can read. Do not allow the frontend to surface generic platform messages like “Edge Function returned a non-2xx status code” as the main user-facing message.

Error parsing requirements:

* Parse Spinwheel error responses from:
* status.code
* status.desc
* status.messages
* Preferred user-facing message order:

1. status.messages[0].desc
2. status.desc
3. safe fallback: "Unable to complete request. Please try again."

Backend implementation:

* routes
* controllers
* Spinwheel API client/service
* centralized error parser
* typed request/response models
* request validation
* timeout handling
* environment configuration
* GET /api/health endpoint
* best-effort in-memory throttling / abuse protection in the backend runtime
* security headers configuration using backend-platform-supported mechanisms
* CORS configuration restricted to the intended frontend origin(s)

Frontend experience:
Build a 2-step wizard.

Step 1: Connect User
Fields:

* Phone Number
* Date of Birth

Rules:

* Phone Number must start empty with no prefilled, default, placeholder test value, or sample number in the input
* DOB must be editable
* Prefill DOB with 1987-06-08
* Do not show external userId in the UX

Required agreement text:
Display this legal copy directly below the DOB field and above the Continue button as muted helper/legal text in a smaller font size. It should be readable, understated, and visually secondary to the form fields and primary CTA. Do not render it as a large paragraph block, hero text, or oversized alert.

Text:
"By clicking “Continue” you agree to the Spinwheel End User Agreement. Further, you are providing “written instructions” to Spinwheel Solutions, Inc. authorizing it to obtain your credit profile from any consumer reporting agency."

Make "Spinwheel End User Agreement" a hyperlink to:
https://spinwheel.io/legal/end-user-agreement

Behavior:

* Submit to POST /api/connect-user
* Send phoneNumber and dateOfBirth to the backend
* Show loading state
* Disable duplicate submission
* On success:
* store the returned userId in state
* store the connect response in state
* display connection metadata
* automatically advance to step 2

Step 2: Verify Code
Fields:

* SMS Verification Code

Rules:

* The user must not manually enter userId
* The verify request must automatically include the stored userId returned from the connect step
* The frontend must send this payload to the backend:

{
  "userId": "stored-user-id-from-connect",
  "code": "entered-code"
}

* The verify step must remain disabled unless connect succeeds and userId exists in state

Behavior:

* Submit to POST /api/verify-user
* On success, display profile data and connection metadata
* On failure, read backend JSON and display error.message to the user

Display requirements:

On connect success show:

* userId
* extUserId
* connectionId
* connectionStatus
* codeExpiresAt
* codeTimeoutSeconds

On verify success show:

* full name
* phone number
* DOB
* SSN last 4 masked appropriately
* addresses rendered clearly
* connection status

Also include:

* formatted timestamps
* status badges
* raw JSON response viewer
* collapsible debug panel
* copy JSON button
* start over button

UI requirements:

* step progress indicator
* clean card layout
* inline validation
* error banners
* toast notifications
* loading states
* responsive layout
* modern fintech/B2B SaaS visual style

State management:
Track:

* current step
* phone number
* date of birth
* stored userId from connect response
* connect response data
* verify response data
* loading states
* errors

Reset must clear all in-memory state and return to step 1.

Error handling:
Use the following Spinwheel errors and map them to clear UI messages.

Connect errors:

1. INVALID_NUMBER

Message: "The provided phone number is invalid."
UX:

* mark phone field invalid
* show inline error
* show alert/banner
* stay on step 1

1. UNSUPPORTED_COUNTRY_CODE

Message: "The region associated with the provided phone number is not supported."
UX:

* mark phone field invalid
* explain unsupported region
* stay on step 1

1. MAX_ATTEMPTS_REACHED

Message: "Exceeded 5 attempt maximum. Resend a new code in 5 minutes"
UX:

* show warning state
* disable immediate retry
* explain cooldown

1. TOO_MANY_VERIFICATIONS

Message: "Too many verification attempts - this phone number is disabled for 24hrs."
UX:

* show destructive alert
* explain temporary lockout
* allow reset/start over

Verify errors:

1. EXPIRED

Message: "Code Expired. Please create a new connection."
UX:

* show expired state
* disable current verify attempt
* primary CTA: Create new connection

1. INCORRECT

Message: "Incorrect Code"
UX:

* show inline code error
* allow retry unless throttled

1. FAILED_ELIGIBILITY

Message: "User failed to meet eligibility requirements. Please continue with challenge questions."
UX:

* show warning panel
* explain SMS verification could not complete
* show placeholder CTA for challenge questions

1. FAILED_IDENTIFICATION

Message: "Failed user identification. Please continue with challenge questions."
UX:

* same as above with distinct title/message

1. FAILED_IDENTIFICATION_INFO_MISMATCH

Message: "Failed user identification. Either the user’s DOB or Phone Number is incorrect - please check and try again."
UX:

* prompt review of DOB and phone number
* make it easy to restart/edit prior info

1. MAX_ATTEMPTS_REACHED

Message: "Exceeded 5 attempt maximum. Resend a new code in 5 minutes"
UX:

* show warning banner
* disable retry briefly
* explain cooldown

1. TOO_MANY_REQUESTS

Message: "Too many verification attempts in a short period of time for the given phone number."
UX:

* show throttling warning
* temporarily disable verify action
* suggest waiting before retrying

Unknown errors:
If a known Spinwheel error cannot be extracted, return:
{
  "success": false,
  "error": {
    "code": "UNKNOWN_ERROR",
    "message": "Unable to complete request. Please try again.",
    "details": [],
    "httpStatus": 500,
    "source": "backend"
  }
}

Frontend rule:
If backend JSON contains error.message, always show that message to the user instead of a generic transport or platform error string.

Quality bar:
The final result should feel like a real developer demo app that can be cloned, run locally, and used to demonstrate the Spinwheel SMS connect and verify flow securely.

Return the full implementation including:

* frontend
* backend
* file structure
* environment configuration
* run instructions