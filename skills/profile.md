---
name: spinwheel-profile
description: Guides engineers integrating Spinwheel Profile, from prerequisite user connection to debt profile request design, credit report/score option selection, disclosure requirements, and refresh/webhook strategy. Use this skill whenever the user asks about Spinwheel debt profile, liability and credit data retrieval, bureau/score configuration, or building Profile-powered onboarding and decisioning flows.
---

# Spinwheel Profile Integration

Use this skill to design and implement Profile data retrieval with production-safe assumptions.

## Outcome

Produce a response that gives:
1. Correct prerequisite flow from user connect to profile calls.
2. Practical debt profile request design for the target use case.
3. Compliance/disclosure callouts required by public docs.
4. Snapshot and refresh architecture guidance.

## Workflow

### 1) Validate prerequisites

Before Profile guidance, verify:
- User is connected and `userId` is available.
- Integration environment is clear (`sandbox` or `production`).
- Desired liability scope is known (all liabilities or specific `liabilityType` values).

If prerequisites are missing, start with a short prerequisite section and unblock sequence.

### 2) Build the debt profile request plan

Anchor guidance to:
- `POST /v1/users/{userId}/debtProfile`
- Optional `liabilityType` filtering.
- Optional `creditReport` and `creditScore` request configuration.

When applicable, mention documented constraints (for example bureau/score combinations) and steer users away from unsupported assumptions.

### 2a) Pin the request/response contracts

Use these exact field names — do not paraphrase, rename, or pre-normalize.

**Path and query**
- Path: `POST /v1/users/{userId}/debtProfile`. `userId` comes from Connect — read it from `connectResponse.data.userId`, not from the root object.
- Optional query parameter: `liabilityType` (single value, not array). Allowed enums: `STUDENT_LOAN`, `CREDIT_CARD`, `HOME_LOAN`, `AUTO_LOAN`, `PERSONAL_LOAN`, `MISCELLANEOUS_LIABILITY`. Omit to retrieve the full liability mix.

**Request body** (the body is required by the published schema even when minimal; all fields below are optional):
- `creditReport` (object) → `type` (e.g. `"1_BUREAU.FULL"`), optional `sourceBureau` (`"Equifax"` | `"TransUnion"`).
- `creditScore` (object) → `model` (e.g. `"VANTAGE_SCORE_3_0"`, `"FICO_SCORE_4"`, `"FICO_SCORE_8"`), optional `sourceBureau`.
- **FICO constraint:** `FICO_SCORE_4` and `FICO_SCORE_8` require `sourceBureau: "TransUnion"` **and** a sibling `creditReport` block (also TransUnion). Vantage models do not carry this constraint.

**Response envelope** — every Spinwheel response is wrapped:

```
{ "status": { "code": 200, "desc": "...", "messages": [...] },
  "data":   { /* liabilities, creditReport, creditScore, ... */ } }
```

Read profile fields from `response.data`, never from the root. Error details live in `response.status.messages[].desc`.

### 3) Explain data semantics

Always clarify:
- Debt profile is a point-in-time snapshot.
- Ongoing freshness needs refresh/subscription strategy.
- Downstream user experiences should not assume immutable balances.

### 4) Add compliance and UX requirements

Always include:
- Required end-user terms and authorization language callouts from public docs.
- Recommendation to confirm returned profile details with the consumer where applicable.
- Separation between legal requirements and implementation suggestions.

### 5) Add operational recommendations

Include:
- Webhook adoption for async events and refresh-driven workflows.
- Environment-specific host and credential handling.
- Failure-mode handling (invalid request shape, unsupported combinations, transient API failures).

## Host and auth guardrails

- Auth header is exactly `Authorization: Bearer <SPINWHEEL_API_KEY>` on every Profile call. Do not emit `x-api-key`, `X-API-Key`, or any other variant — the sandbox returns `401 No auth key provided` for those.
- `POST /v1/users/{userId}/debtProfile` is on the **standard** host: `https://sandbox-api.spinwheel.io` (sandbox) or `https://api.spinwheel.io` (production). Do not use the `secure-sandbox-api` / `secure-api` subdomain for Profile calls unless Spinwheel docs explicitly direct you to.

## Response format

ALWAYS use this exact structure and heading text:

### Prerequisites
### Request design
### Data interpretation
### Compliance and UX checklist
### Refresh and operations plan
### Open assumptions

If the prompt asks for a checklist, keep the same headings and put checklist bullets under the most relevant section.

## Quality bar

- Keep every recommendation implementation-oriented.
- Prefer precise API language over generalized credit-domain advice.
- Stay within publicly documented behavior.
- Documented sandbox test inputs come from `https://docs.spinwheel.io/docs/test-users` and the Spinwheel reference pages. Do not fabricate sandbox values, bureau/model combinations, response field names, or test OTPs that aren't in the docs. If a value isn't documented, surface that gap and direct the user to Spinwheel Support rather than inventing one.
