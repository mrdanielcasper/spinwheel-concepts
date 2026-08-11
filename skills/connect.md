---
name: spinwheel-connect
description: Helps engineers integrate Spinwheel Connect end-to-end, including connect method selection (SMS, KBA, network token, preverified), secure vs standard API host usage, OTP/KBA lifecycle handling, and fallback/error strategy. Use this skill whenever the user mentions Spinwheel Connect, user linking, user authentication for Spinwheel APIs, SMS verification, KBA verification, preverified flows, or asks how to obtain a Spinwheel `userId` before Profile or Pay work.
---

# Spinwheel Connect Integration

Use this skill to guide implementation planning and troubleshooting for Spinwheel user connection flows.

## Outcome

Produce an integration-ready response that includes:
1. Recommended connect strategy for the scenario.
2. Step-by-step API workflow with required identifiers.
3. Error/fallback handling plan.
4. Sandbox-to-production readiness checklist.

## Workflow

### 1) Confirm integration context

Collect the minimum context:
- Environment (`sandbox` or `production`).
- Available user inputs (phone, DOB, identity data).
- Whether the user already has an internal external identifier (`extUserId`).
- Whether preverified or network token integrations are enabled by Spinwheel.

If context is missing, proceed with the SMS-first default and explicitly state assumptions.

### 2) Choose the connect path

Use this decision order:
1. **SMS** as default when a US mobile number and DOB are available.
2. **KBA** when SMS eligibility or identification fails.
3. **Network token** for partner-to-partner interoperability where token flow is available.
4. **Preverified user profile** only when Spinwheel support has enabled it.

### 3) Map the API sequence

Provide the concrete path sequence for the chosen method.

**SMS sequence**
- `POST /v1/users/connect/sms`
- `POST /v1/users/{userId}/connect/sms/verify`

**KBA sequence**
- `POST /v1/users/connect/kba` on secure host
- `PUT /v1/users/{userId}/connect/kba` to submit answers

**Network token sequence**
- `POST /v1/users/connect/network`

**Preverified profile sequence**
- `POST /v1/users/connect/preverified/userProfile` on secure host

Always call out the expected durable result: `userId` for downstream APIs.

### 3a) Pin the request/response contracts

Use these exact field names — do not paraphrase, rename, or pre-normalize.

**Request bodies**
- `POST /v1/users/connect/sms` → `phoneNumber` (string, E.164, e.g. `+14155552671`), `dateOfBirth` (ISO date string, e.g. `1990-01-15`), optional `extUserId` (string).
- `POST /v1/users/{userId}/connect/sms/verify` → `code` (6-digit string).

**Response envelope** — every Spinwheel response is wrapped:

```
{ "status": { "code": 200, "desc": "...", "messages": [...] },
  "data":   { "userId": "...", "connectionStatus": "...", ... } }
```

Read durable identifiers (`userId`, `connectionStatus`, etc.) from `response.data`, never from the root. Error details live in `response.status.messages[].desc`.

### 4) Add resilient error handling

Always include:
- SMS fallback to KBA when `UNSUPPORTED_NUMBER` or identification errors appear.
- OTP expiry and retry throttling handling.
- KBA expiration handling (restart flow when expired).
- Recovery guidance for rate limits (retry strategy + user messaging).

### 5) Provide handoff guidance

After a successful connection:
- Tell the user to persist `userId` and their own `extUserId` mapping.
- Explain that Profile and Pay workflows start from this identifier.
- Include the next likely endpoint suggestion (for example debt profile request).

## Host and auth guardrails

- Auth header is exactly `Authorization: Bearer <SPINWHEEL_API_KEY>` for every connect endpoint. Do not emit `x-api-key`, `X-API-Key`, or any other variant — the sandbox returns `401 No auth key provided` for those.
- Host is per-endpoint, not per-environment. Use this table:

| Endpoint | Host |
|---|---|
| `POST /v1/users/connect/sms` | standard (`sandbox-api` / `api`) |
| `POST /v1/users/{userId}/connect/sms/verify` | standard |
| `POST /v1/users/connect/kba` | **secure** (`secure-sandbox-api` / `secure-api`) |
| `PUT /v1/users/{userId}/connect/kba` | **secure** |
| `POST /v1/users/connect/network` | standard |
| `POST /v1/users/connect/preverified/userProfile` | **secure** (requires Spinwheel Support enablement) |

- Standard hosts: `https://sandbox-api.spinwheel.io` (sandbox), `https://api.spinwheel.io` (production).
- Secure hosts: `https://secure-sandbox-api.spinwheel.io` (sandbox), `https://secure-api.spinwheel.io` (production).
- Never assume an endpoint uses the secure host unless it's listed above.

## Response format

Use this structure:

### Recommended flow
### API steps
### Error and fallback handling
### Implementation checklist
### Open assumptions

## Quality bar

- Keep guidance grounded in public Spinwheel docs.
- Distinguish required steps from optional optimizations.
- Prefer concrete implementation actions over product marketing language.
- Documented sandbox test inputs (phone numbers, DOBs) come from `https://docs.spinwheel.io/docs/test-users`. Do not fabricate sandbox values that aren't on that page. In particular, there is no documented static sandbox OTP — never claim `000000`, `123456`, or any other constant works. If the OTP step needs to be exercised, instruct the user to obtain the live OTP delivered to the test number or contact Spinwheel Support; do not invent one.
