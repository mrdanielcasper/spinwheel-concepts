Build a sandbox-only internal micro-app that surfaces a user’s credit report using the Spinwheel Debt Profile API based on an input userId. This prompt is for Spinwheel sandbox use only and must not generate production deployment guidance, production endpoints, or production-readiness claims.

Before you start building:
1. First decide and document the userId input strategy.
2. If a userId input pattern has not already been decided, default to a basic text field input for userId.
3. Make the app explicitly state how userId is being provided.
4. The default/basic userId text input must start empty. Do not prefill it with sample, remembered, placeholder-realistic, or test values.
5. Structure the app so the input strategy can later be swapped for:
   - URL param
   - query param
   - authenticated session context
   - CRM-selected user
   - pasted value from an internal tool

Architecture requirement:
The API call must be generated from the backend, not directly from the frontend.
- Do not call the Spinwheel API directly from the browser
- Build a backend/server route that accepts the userId and optional liabilityType from the frontend
- The backend should call the Spinwheel Debt Profile API
- Keep API base URL, credentials, and auth headers on the server only
- Never expose secrets in client-side code
- The frontend must never supply or influence the upstream base URL, auth headers, or outbound destination
- The backend may call only the trusted Spinwheel API origin configured server-side
- The frontend should call the app’s own backend endpoint such as /api/credit-report

Critical error-handling architecture requirement:
Do not replace upstream API errors with generic backend or edge-function errors when the upstream response body contains a structured Spinwheel error.
The backend must preserve and return the real upstream API error details whenever possible.
Return only sanitized, normalized upstream error fields needed by the frontend. Do not return raw upstream bodies, stack traces, or backend internals to end users.

Security and data handling requirements:
- Apply secure coding best practices throughout.
- Enforce least privilege for backend routes and secret access.
- Validate, sanitize, type-check, and constrain all user inputs server-side before use. Reject unknown fields and invalid liabilityType values.
- Never hardcode secrets or credentials; use environment variables or other server-only configuration only.
- Keep sensitive credit report data in memory only for the active backend request and the active page session needed to render the UI.
- Do not persist sensitive credit report data to a database, filesystem, localStorage, sessionStorage, IndexedDB, service worker caches, cookies, downloadable files, or any other client/server storage unless explicitly required.
- Treat this as a read-only request/response app. Do not cache or store credit report payloads beyond what is required for immediate display.
- The backend must set Cache-Control: no-store, no-cache, must-revalidate, private on responses containing credit report data, and should also set Pragma: no-cache and Expires: 0 where supported by the runtime/platform.
- Do not expose sensitive response payloads in client logs, analytics, error trackers, session replay tools, or debug tools.
- Avoid logging PII, secrets, auth headers, full sensitive payloads, raw request bodies, or full upstream responses. Redact sensitive fields before any logging.
- Do not expose stack traces, raw upstream bodies, raw upstream internals, or sensitive debugging data to end users.
- Prevent injection and unsafe serialization; encode or safely render outputs.
- Add best-effort in-memory throttling and abuse protection on backend endpoints. This may be runtime-local only and is not required to be distributed or persistent across restarts/instances.
- If the app is deployed within an authenticated internal environment, preserve and respect that existing auth context. Do not invent login flows, session systems, or RBAC unless explicitly required.
- Enforce authorization checks on backend endpoints only when an authenticated internal environment or explicit auth context exists.
- If cookie-based auth or session state is used, implement CSRF protection and secure session handling.
- Use secure defaults to reduce misconfiguration risk and prevent SSRF or unsafe outbound requests.
- Apply OWASP-aligned secure coding practices relevant to this app, especially injection prevention, auth/session safety, sensitive data protection, security misconfiguration prevention, dependency hygiene, and safe logging.
- Validate imports, types, syntax, and references before finalizing code.
- The final code should build cleanly with no errors and no avoidable warnings.
- Do not modify unrelated routes, logic, or styles.

App goal:
Create a fully functioning micro-app that:
- accepts a userId
- requests that user’s debt profile
- pulls and displays the credit report
- pulls and displays the credit score
- pulls and displays credit score factors
- handles loading, empty, partial, and error states gracefully
- is robust against missing or inconsistent fields in the API response

Spinwheel environment requirement:
- Support Spinwheel sandbox only. Do not support or mention production Spinwheel environments in the generated app.
- The backend must call the fixed sandbox base URL: https://sandbox-api.spinwheel.io/v1
- Do not ask the user to provide a base URL or environment selector.
- Do not create UI or configuration that allows switching between sandbox and production.
- The frontend must never contain the Spinwheel base URL, auth headers, or secrets.

Spinwheel API requirements:
Use this endpoint:
POST /v1/users/{userId}/debtProfile

Path parameter:
- userId: required string

Optional query parameter:
- liabilityType
  Supported values:
  - STUDENT_LOAN
  - CREDIT_CARD
  - HOME_LOAN
  - AUTO_LOAN
  - PERSONAL_LOAN
  - MISCELLANEOUS_LIABILITY

Required request body:
Use the default request only:
{
  "creditReport": {
    "type": "1_BUREAU.FULL"
  },
  "creditScore": {
    "model": "VANTAGE_SCORE_3_0"
  }
}

Legal/compliance requirement:
Clearly display the following text before the user continues with the request, and require acknowledgement before enabling the fetch action:

“By continuing you agree to the Spinwheel End User Agreement. Further, you are providing ‘written instructions’ to Spinwheel Solutions, Inc. authorizing it to obtain your credit profile from any consumer reporting agency.”

Also render the Spinwheel End User Agreement as a clickable link.

Frontend/backend flow:
1. User enters userId in the frontend
2. User accepts required consent text
3. Frontend calls an internal backend endpoint such as /api/credit-report
4. Backend validates input
5. Backend sends POST request to /v1/users/{userId}/debtProfile using the default request body
6. Backend parses both success and error response bodies from the upstream API
7. Backend returns normalized response data or normalized upstream error data to frontend
8. Frontend renders the result safely

Important implementation rule:
Do not bind the UI directly to deeply nested raw fields everywhere.
Create a normalization layer on the backend or in a shared server-safe mapper that transforms the raw API response into a stable frontend shape.
Use raw JSON paths below as the source-of-truth mapping instructions.

Canonical parsing helpers:
- selectedCreditReport = $.data.creditReports[0] if present
- profile = $.data.creditReports[0].profile if present
- latestScoreDetail = the element in $.data.creditReports[0].creditScoreDetails with the most recent reportedDate
- currentAddress = first address in $.data.creditReports[0].profile.addresses where residencyType == "CURRENT"

UX requirements:
Build a polished but lightweight internal micro-app with:
- a clear title such as “Credit Report Viewer”
- a visible explanation of how userId is being entered
- userId input field
- optional liability type filter selector
- consent checkbox for the legal language
- “Fetch Credit Report” button
- loading state
- inline validation errors
- structured empty state if no report is available
- structured error state if the API call fails
- retry button on failure

Primary UI sections after successful fetch:

1. Top summary / hero section
Render these fields with the exact source mapping below:

- User ID
  - primary path: $.data.userId

- External User ID
  - primary path: $.data.extUserId

- Full name
  - primary paths:
    - $.data.creditReports[0].profile.firstName
    - $.data.creditReports[0].profile.middleName
    - $.data.creditReports[0].profile.lastName
  - render rule:
    - concatenate non-empty values with spaces

- Last 4 of SSN
  - primary path: $.data.creditReports[0].profile.ssn
  - render rule:
    - display only the masked/truncated value returned by the API
    - do not attempt to reconstruct or request a fuller SSN

- Date of birth
  - primary path: $.data.creditReports[0].profile.dateOfBirth

- Primary address
  - primary path:
    - first address in $.data.creditReports[0].profile.addresses where residencyType == "CURRENT"
  - fallback path:
    - first item in $.data.creditReports[0].profile.addresses
  - address field paths:
    - addressLine1: $.data.creditReports[0].profile.addresses[*].addressLine1
    - city: $.data.creditReports[0].profile.addresses[*].city
    - state: $.data.creditReports[0].profile.addresses[*].state
    - zip: $.data.creditReports[0].profile.addresses[*].zip

- Bureau
  - primary path: latestScoreDetail.sourceBureau
  - fallback path: $.data.creditReports[0].sourceBureau

- Score value
  - primary path: latestScoreDetail.creditScore
  - fallback path: $.data.creditReports[0].profile.creditScore

- Score model
  - primary path: latestScoreDetail.model
  - fallback paths:
    - $.data.creditReports[0].profile.model
    - $.data.creditReports[0].profile.modelName

- Score reported date
  - primary path: latestScoreDetail.reportedDate

- Report type
  - primary path: $.data.creditReports[0].type

- Status badge
  - primary paths:
    - $.status.code
    - $.status.desc
  - render rule:
    - show success, warning, or error badge based on status.code and data presence

2. Credit score factors
Render the latest score factors from the most recent creditScoreDetails entry.

- Source collection:
  - $.data.creditReports[0].creditScoreDetails[*]

- Sorting rule:
  - sort descending by reportedDate
  - use the first item after sorting as latestScoreDetail

- Factors list source:
  - latestScoreDetail.factors[*]

For each factor, render:
- Factor description
  - path: latestScoreDetail.factors[*].description

- Factor code
  - path: latestScoreDetail.factors[*].code

- Factor section reported date
  - path: latestScoreDetail.reportedDate

If no factors exist:
- show a clean fallback message
- do not error if creditScoreDetails is empty or absent

3. Consumer profile
Render profile data with these paths:

- First name
  - $.data.creditReports[0].profile.firstName

- Middle name
  - $.data.creditReports[0].profile.middleName

- Last name
  - $.data.creditReports[0].profile.lastName

- DOB
  - $.data.creditReports[0].profile.dateOfBirth

- SSN last 4 / masked SSN
  - $.data.creditReports[0].profile.ssn

- Former names collection
  - $.data.creditReports[0].profile.formerNames[*]
  For each former name:
  - firstName: $.data.creditReports[0].profile.formerNames[*].firstName
  - middleName: $.data.creditReports[0].profile.formerNames[*].middleName
  - lastName: $.data.creditReports[0].profile.formerNames[*].lastName

- Addresses collection
  - $.data.creditReports[0].profile.addresses[*]
  For each address:
  - addressLine1: $.data.creditReports[0].profile.addresses[*].addressLine1
  - city: $.data.creditReports[0].profile.addresses[*].city
  - state: $.data.creditReports[0].profile.addresses[*].state
  - zip: $.data.creditReports[0].profile.addresses[*].zip
  - residencyType: $.data.creditReports[0].profile.addresses[*].residencyType
  - addressOwnership: $.data.creditReports[0].profile.addresses[*].addressOwnership
  - addressSource: $.data.creditReports[0].profile.addresses[*].addressSource
  - residencyDurationInMonths: $.data.creditReports[0].profile.addresses[*].residencyDurationInMonths
  - reportedDate: $.data.creditReports[0].profile.addresses[*].reportedDate
  - reportedDate formatted value: $.data.creditReports[0].profile.addresses[*].reportedDateWithFormat.value
  - firstReportedDate formatted value: $.data.creditReports[0].profile.addresses[*].firstReportedDateWithFormat.value

- Employment history collection
  - $.data.creditReports[0].profile.employmentHistory[*]
  For each employment item:
  - employerName: $.data.creditReports[0].profile.employmentHistory[*].employerName
  - position: $.data.creditReports[0].profile.employmentHistory[*].position
  - startDate: $.data.creditReports[0].profile.employmentHistory[*].startDateWithFormat.value
  - reportedDate: $.data.creditReports[0].profile.employmentHistory[*].reportedDateWithFormat.value
  - employmentStatus: $.data.creditReports[0].profile.employmentHistory[*].employmentStatus

4. Credit report insights
Render the following:

A. Inquiries
- collection path: $.data.creditReports[0].inquiries[*]
For each inquiry:
- inquirerName: $.data.creditReports[0].inquiries[*].inquirerName
- inquiryDate: $.data.creditReports[0].inquiries[*].inquiryDate
- inquirerIndustryCode: $.data.creditReports[0].inquiries[*].inquirerIndustryCode
- purposeType: $.data.creditReports[0].inquiries[*].purposeType
- sourceBureau: $.data.creditReports[0].inquiries[*].sourceBureau
- bureauSubscriberCode: $.data.creditReports[0].inquiries[*].bureauSubscriberCode

B. Bankruptcies
- collection path: $.data.creditReports[0].bankruptcies[*]
For each bankruptcy:
- filedDate: $.data.creditReports[0].bankruptcies[*].filedDateWithFormat.value
- dispositionDate: $.data.creditReports[0].bankruptcies[*].dispositionDateWithFormat.value
- verifiedDate: $.data.creditReports[0].bankruptcies[*].verifiedDateWithFormat.value
- reportedDate: $.data.creditReports[0].bankruptcies[*].reportedDateWithFormat.value
- caseNumber: $.data.creditReports[0].bankruptcies[*].caseNumber
- type: $.data.creditReports[0].bankruptcies[*].type
- filer: $.data.creditReports[0].bankruptcies[*].filer
- disposition: $.data.creditReports[0].bankruptcies[*].disposition
- priorDisposition: $.data.creditReports[0].bankruptcies[*].priorDisposition
- liabilityAmount: $.data.creditReports[0].bankruptcies[*].liabilityAmount
- assetAmount: $.data.creditReports[0].bankruptcies[*].assetAmount
- exemptAmount: $.data.creditReports[0].bankruptcies[*].exemptAmount
- court industryType: $.data.creditReports[0].bankruptcies[*].court.industryType
- court industryCode: $.data.creditReports[0].bankruptcies[*].court.industryCode
- court bureauSubscriberCode: $.data.creditReports[0].bankruptcies[*].court.bureauSubscriberCode
- narratives: $.data.creditReports[0].bankruptcies[*].narratives[*].description
- narrative codes: $.data.creditReports[0].bankruptcies[*].narratives[*].code

C. Credit attributes
- collection path: $.data.creditReports[0].creditAttributes[*]
For each attribute:
- description: $.data.creditReports[0].creditAttributes[*].description
- value: $.data.creditReports[0].creditAttributes[*].value

D. Credit report summary
- Render the full object from $.data.creditReports[0].summary if present
- At minimum support:
  - totalSecuredDebtAmount
  - securedDebtLiabilitiesCount
  - totalUnsecuredDebtAmount
  - unsecuredDebtLiabilitiesCount
  - totalUnsecuredDebtAmountExcludingStudent
  - unsecuredDebtLiabilitiesCountExcludingStudent
  - totalUnknownDebtAmount
  - unknownDebtLiabilitiesCount

5. Liability sections
Render cards or tables for each category when present:
- $.data.creditCards[*]
- $.data.autoLoans[*]
- $.data.homeLoans[*]
- $.data.personalLoans[*]
- $.data.studentLoans[*]
- $.data.miscellaneousLiabilities[*]

Important normalization rule:
Do not keep separate frontend rendering models for each liability type.
Normalize all liability collections into one shared frontend card shape using:
- the category collection object
- cardProfile for credit cards
- liabilityProfile for all non-credit-card liabilities
- balanceDetails
- statementSummary
- creditor
- capabilities

Normalized liability card shape:
- id
- category
- displayName
- logoUrl
- institutionName
- institutionIndustryType
- institutionIndustryCode
- institutionPhone
- institutionSubscriberCode
- institutionAddress
- maskedAccount
- status
- subtype
- debtType
- outstandingBalance
- minimumPaymentAmount
- statementBalance
- principalBalance
- dueDate
- accountOriginationDate
- reportedDate
- lastActivityDate
- accountRating
- accountOwnershipType
- accountType
- termsFrequency
- utilization
- availableCredit
- interestRate
- loanOriginationAmount
- highCreditAmount
- loanTermInMonths
- pendingLoanTermInMonthsDerived
- derogatoryDataStatus
- collectionStatus
- chargeOffStatus
- adverseRatingCount
- paymentHistoryLastAssessedStatementDate
- paymentHistoryItems
- narratives
- liabilityTransferFrom
- liabilityTransferTo
- capabilities

Mapping rules:
- For credit cards, derive normalized fields from:
  - $.data.creditCards[*]
  - $.data.creditCards[*].cardProfile
  - $.data.creditCards[*].balanceDetails
  - $.data.creditCards[*].statementSummary
  - $.data.creditCards[*].creditor
  - $.data.creditCards[*].capabilities

- For auto, home, personal, student, and miscellaneous liabilities, derive normalized fields from:
  - the base liability object
  - liabilityProfile
  - balanceDetails
  - statementSummary
  - creditor
  - capabilities

- For all liability categories, support these presentation fields when available:
  - displayName
  - institution / creditor name
  - masked account details
  - status
  - subtype
  - debt type
  - outstanding balance
  - minimum payment
  - statement balance
  - principal balance
  - due date
  - account origination date
  - reported date
  - last activity date
  - account rating
  - account ownership type
  - utilization for cards
  - available credit for cards
  - interest rate where available
  - loan origination amount
  - high credit amount
  - loan term
  - derogatory / collection / charge-off indicators
  - payment history summary
  - narratives
  - liability transfer information
  - capability availability flags

- Student-loan-specific additions to preserve if present:
  - billingAddresses from creditor.billingAddresses
  - chargeOffDate
  - chargeOffAmount
  - firstDelinquencyDate
  - highestAdverseRating
  - highestAdverseRatingDate
  - mostRecentAdverseRating
  - mostRecentAdverseRatingDate
  - loanType
  - liabilityGroupPayoffQuote availability
  - liabilityGroupId from capabilities.data.liabilityGroupPayoffQuote.liabilityGroupId

- Miscellaneous-liability-specific additions to preserve if present:
  - collectionAccountStatus
  - secondMostRecentAdverseRating
  - secondMostRecentAdverseRatingDate

6. Summary cards
Render summary cards only if the corresponding object exists:
- $.data.autoLoanSummary
- $.data.homeLoanSummary
- $.data.creditCardSummary
- $.data.studentLoanSummary
- $.data.personalLoanSummary
- $.data.miscellaneousLiabilitySummary

For each summary object:
- render the most relevant numeric balances, counts, utilization, and payoff metadata present
- do not fail if some fields are missing
- for studentLoanSummary, also render liabilityGroupPayoffQuotes if present

Data handling rules:
- Be highly defensive when reading nested JSON
- The API may return missing arrays, null sections, or empty values
- Never crash if:
  - $.data.creditReports is empty
  - $.data.creditReports[0].profile is missing
  - $.data.creditReports[0].creditScoreDetails is empty
  - liability arrays are absent
  - summary objects are absent
- Use optional chaining / null checks everywhere
- Normalize arrays to [] when absent
- Show partial data if only part of the response is returned
- For every rendered section, hide that field or show a fallback placeholder if the source path is missing
- Use safe formatters for date, currency, percentages, and timestamps

Response parsing priorities:
- Primary score:
  1. latestScoreDetail.creditScore
  2. $.data.creditReports[0].profile.creditScore

- Score model:
  1. latestScoreDetail.model
  2. $.data.creditReports[0].profile.model
  3. $.data.creditReports[0].profile.modelName

- Bureau:
  1. latestScoreDetail.sourceBureau
  2. $.data.creditReports[0].sourceBureau

- Factors:
  1. latestScoreDetail.factors[*]
  2. fallback to empty array

Error handling requirements:
The backend and frontend must handle all documented 40x responses explicitly and present specific, user-friendly messaging for each case.

Critical backend error propagation rules:
- If the upstream Spinwheel API returns a non-2xx response with a JSON body, the backend must parse that JSON body and normalize it.
- Do not replace a structured upstream error with a generic transport error like:
  - "Edge Function returned a non-2xx status code"
  - "SERVER_ERROR"
  unless the upstream body is truly unavailable or unparsable.
- The backend must attempt to read and preserve:
  - HTTP status from the upstream response
  - $.status.code
  - $.status.desc
  - $.status.messages[*].desc
  - $.status.messages[*].type
- Only fall back to generic transport/server error handling when:
  - the upstream response body is empty
  - the upstream response body is not valid JSON
  - the request failed before receiving any upstream response
- If the backend receives both:
  - a transport-level error wrapper
  - and a valid upstream Spinwheel error body
  then the normalized error shown to the frontend must prefer the upstream Spinwheel error body.

Frontend error display rules:
- Prefer displaying normalized upstream API errors over backend wrapper errors.
- Do not show generic values like:
  - HTTP Status: 500
  - API Code: —
  - API Desc: —
  - Category: SERVER_ERROR
  - Messages: Edge Function returned a non-2xx status code
  if the backend has access to a real upstream 400/404/409/429 payload.
- The UI should only show the generic server/edge-function error state when no structured upstream error exists.

General error parsing rules:
- Parse all error responses from:
  - $.status.code
  - $.status.desc
  - $.status.messages[*].desc
  - $.status.messages[*].type
- Never show only a generic “Something went wrong” message when a documented status.desc or message is available.
- Always surface:
  - HTTP status code
  - API status.code
  - API status.desc
  - first message from $.status.messages[0].desc if present
  - all message rows from $.status.messages[*] in an expandable details area
- The frontend should render a normalized error object from the backend such as:
  {
    "httpStatus": number,
    "apiCode": number | null,
    "apiDesc": string | null,
    "messages": string[],
    "retryable": boolean,
    "category": string,
    "recommendedAction": string,
    "source": "upstream_api" | "backend_wrapper" | "network"
  }

Required backend normalization contract:
The backend must return normalized errors in a consistent shape.

For structured upstream API errors, return:
{
  "ok": false,
  "error": {
    "source": "upstream_api",
    "httpStatus": <upstream http status>,
    "apiCode": <$.status.code or null>,
    "apiDesc": <$.status.desc or null>,
    "messages": <array of $.status.messages[*].desc or []>,
    "rawMessageTypes": <array of $.status.messages[*].type or []>,
    "category": <mapped category>,
    "retryable": <boolean>,
    "recommendedAction": <string>
  }
}

For transport or wrapper errors where no upstream body exists, return:
{
  "ok": false,
  "error": {
    "source": "backend_wrapper",
    "httpStatus": <best available status>,
    "apiCode": null,
    "apiDesc": null,
    "messages": [<transport message>],
    "category": "SERVER_ERROR",
    "retryable": true,
    "recommendedAction": "Retry the request. If the problem persists, inspect backend logs and upstream availability."
  }
}

40x-specific handling:
Implement explicit UI behavior and copy for each documented 40x case below.

1. 400 Bad Request — invalid request payload
- Show message:
  "The request payload was invalid. The app could not generate a valid debt profile request."
- Show technical details in expandable debug panel:
  - status.desc
  - all status.messages[*]
- Mark retryable = false until request construction is fixed.

2. 400 USER_NOT_CONNECTED
- Show message:
  "This user is not connected to a credit bureau profile yet."
- Recommended action:
  "Verify the userId and confirm the user has completed the required connection or onboarding flow."
- Mark retryable = false unless the connection state changes.

3. 400 FRAUDULENT_REPORT
- Show message:
  "The credit report request was blocked because the report was flagged as fraudulent."
- Recommended action:
  "Do not auto-retry. Route this case to support or operations for review."
- Mark retryable = false.

4. 400 FROZEN_REPORT
- Show message:
  "The user’s credit file appears to be frozen."
- Recommended action:
  "Ask the user to unfreeze their credit report with the bureau, then retry."
- Mark retryable = false until external action is taken.

5. 400 LOCKED_REPORT
- Show message:
  "The user’s credit report is consumer-locked."
- Recommended action:
  "The user must unlock their credit file before this request can succeed."
- Mark retryable = false until the file is unlocked.

6. 400 MANUAL_FILE
- Show message:
  "This credit file is only available through a manual return process."
- Recommended action:
  "Escalate to the manual handling workflow instead of retrying through the app."
- Mark retryable = false.

7. 400 MANUAL_REVIEW_REQUIRED
- Show message:
  "This request requires manual review before a credit profile can be returned."
- Recommended action:
  "Escalate to support, operations, or the designated manual review queue."
- Mark retryable = false.

8. 400 INVALID_SCORE_MODEL — unsupported model for bureau
- Show message:
  "The requested score model is not supported for the configured bureau."
- Recommended action:
  "Retry using the default VANTAGE_SCORE_3_0 request configuration."
- Mark retryable = false unless configuration changes.

9. 400 Bad Request — standalone FICO score
- Show message:
  "The request attempted to fetch a FICO score without a required credit report."
- Recommended action:
  "Use the default combined debt profile plus Vantage 3.0 score request."
- Mark retryable = false until request generation is corrected.

10. 400 INVALID_SCORE_MODEL — FICO model not enabled
- Show message:
  "That score model is not enabled for this environment."
- Recommended action:
  "Use the default Vantage 3.0 flow or contact Spinwheel support if FICO access is required."
- Mark retryable = false unless product configuration changes.

11. 404 USER_NOT_FOUND
- Show message:
  "No user was found for that userId."
- Recommended action:
  "Verify the userId and try again."
- Mark retryable = false unless the userId changes.

12. 404 CREDIT_REPORT_NOT_FOUND
- Show message:
  "No credit report was found for this user."
- Recommended action:
  "Confirm the user has an available bureau profile and try again later if a report is expected."
- Mark retryable = conditionally true.

13. 409 REFERRED_FILE
- Show message:
  "This credit file is currently under review."
- Recommended action:
  "Do not auto-retry. Wait for the review process to complete or escalate to the operations team."
- Mark retryable = false.

14. 409 BUREAU_SOURCE_CONFLICT
- Show message:
  "This user is already connected to a different bureau source."
- Recommended action:
  "Do not attempt a refresh against a different bureau. Use the existing connected bureau or resolve the bureau connection first."
- Mark retryable = false until source selection is corrected.

15. 429 DAILY_USER_REQUEST_LIMIT_REACHED
- Show message:
  "This user has already reached the daily debt profile request limit."
- Recommended action:
  "Do not continue retrying today. Retry after the daily limit window resets."
- Mark retryable = false for same-day retries.
- Disable the retry button for this case.

Fallback error handling when no structured upstream error exists:
- Only for true backend/network/wrapper failures, show:
  - human-friendly title: "Request failed"
  - category: SERVER_ERROR or NETWORK_ERROR
  - message from transport layer
- Do not label a bad userId as SERVER_ERROR if the upstream API actually returned USER_NOT_FOUND.

UI behavior rules for error states:
- Use a dedicated error panel component with:
  - human-friendly title
  - specific reason
  - recommended action
  - technical details accordion
- For 400, 404, 409, and 429 responses:
  - do not render partial success UI as if the request succeeded
  - keep the input visible so the user can correct userId or try another supported path
- For non-retryable cases:
  - disable immediate retry button
  - instead show the recommended next action
- For retryable/not-found cases where a later report may exist:
  - allow retry
- Always preserve the last entered userId and selected liabilityType in the UI after failure

Backend normalization rules for error responses:
- The backend must normalize all non-200 responses into a consistent shape.
- Pull:
  - httpStatus from the upstream HTTP response
  - apiCode from $.status.code
  - apiDesc from $.status.desc
  - messages from $.status.messages[*].desc
- Determine category using the mappings above:
  - INVALID_REQUEST
  - USER_NOT_CONNECTED
  - FRAUD
  - FROZEN_FILE
  - LOCKED_FILE
  - MANUAL_FILE
  - MANUAL_REVIEW
  - INVALID_SCORE_MODEL
  - USER_NOT_FOUND
  - CREDIT_REPORT_NOT_FOUND
  - REFERRED_FILE
  - BUREAU_CONFLICT
  - RATE_LIMIT
- Include recommendedAction and retryable in the normalized response
- Include source = "upstream_api" when the upstream body was parsed successfully
- Include source = "backend_wrapper" or "network" only when no structured upstream body exists

Important instruction:
Do not invent undocumented 401 or 403 Debt Profile behaviors.
Only implement specific UX copy for documented 400, 404, 409, and 429 cases from the spec.
For any other undocumented 4xx response:
- show a generic fallback:
  "The request could not be completed."
- still render:
  - HTTP status code
  - API status.desc
  - available messages

Implementation guidance:
- Build with a modern frontend stack suitable for Lovable
- Use TypeScript
- Keep components clean and modular
- Use a dedicated backend API client module
- Use server-only configuration for sandbox auth configuration only
- Do not let the frontend influence the sandbox base URL or auth headers
- Add comments for where auth headers should be configured
- Keep server-only code clearly separated from client code

Expected backend behavior:
- Expose an internal endpoint such as /api/credit-report
- Accept:
  - userId
  - optional liabilityType
- Validate inputs server-side
- Construct URL as /v1/users/{userId}/debtProfile
- Append liabilityType query param only if selected
- Send POST request with JSON body:
  {
    "creditReport": {
      "type": "1_BUREAU.FULL"
    },
    "creditScore": {
      "model": "VANTAGE_SCORE_3_0"
    }
  }
- Set Content-Type: application/json
- Support server-side sandbox auth headers only
- Parse JSON safely for both 2xx and non-2xx responses
- If the upstream response is non-2xx, still read the response body before throwing or returning an error
- Normalize the returned payload into a frontend-friendly shape
- Return safe success or error objects to the frontend
- Do not collapse upstream 4xx API responses into a generic 500 response unless the backend truly failed before receiving/parsing the upstream body
- Set Cache-Control: no-store, no-cache, must-revalidate, private on sensitive backend responses, and also set Pragma: no-cache and Expires: 0 where supported by the framework/runtime
- Apply best-effort in-memory throttling and abuse protection to the internal endpoint

Recommended feature extras:
- copy userId button
- copy sanitized normalized response button
- timestamp for last successful fetch
- badge showing whether returned data includes report and score
- small note that credit report / score codes may map to glossary terms
- do not include any raw upstream payload viewer for sensitive report data

Non-production requirement:
- This app is for sandbox demonstration and internal testing only.
- Do not add production deployment instructions, production environment switching, or production-hardening claims beyond the sandbox-safe security requirements already listed.

Deliverable:
Produce a working micro-app, not just mock UI.
Include:
- frontend code
- backend/server route code
- server-side API integration code
- environment variable usage
- validation logic
- normalization logic based on the JSON paths above
- error handling
- loading states
- empty states
- successful data rendering
- consent gating
- polished UX

Success criteria:
A user can:
1. enter or otherwise provide a userId
2. acknowledge the required legal text
3. fetch the debt profile through the app backend
4. see the credit score, score model, bureau, and score factors
5. inspect the full credit report and liability sections
6. see specific backend-propagated API error messaging when a bad userId or other documented upstream error occurs
7. recover cleanly from errors without the app breaking