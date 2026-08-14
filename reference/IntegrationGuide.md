# Integration Guide

## 

### Step 1: How it works

Use Hosted Flow UI to run identity verification end-to-end.

RiskOS™ hosts the entire onboarding experience — including identity collection, and Document Verification (DocV) when required.

Your application only:

- Creates a verification session via the Evaluation API
- Redirects the user to the Hosted Flow UI
- Handles the final decision via webhook

Your application **does not collect identity data directly** — RiskOS™ manages the full verification experience and returns control when the flow is complete.

### **Document Verification (DocV)**

If additional verification is required, the Hosted Flow automatically launches DocV to collect:

- Government-issued ID
- Selfie (biometric match)

### **Decision outcomes**

When the verification session completes, RiskOS™ sends the final decision via the `evaluation_completed` webhook with one of the following values:

- `ACCEPT` — Continue onboarding
- `REJECT` — Stop onboarding

---

### **Before you start**

You’ll need:

- **API key** — Server-side secret for Evaluation API requests
- **Workflow name** — Included in the `"workflow"` field of your request
- **Sandbox endpoint** — `https://riskos.sandbox.socure.com/api/evaluation`
- **Webhook endpoint** — Returns the final decision via the `evaluation_completed` webhook

### Step 2: Customize your Hosted Flow theme and copy

From the left navigation, select [Templates](https://riskos.sandbox.socure.com/templates) to configure your logo, brand colors, and hosted flow copy.

### Step 3: Create a verification session

Your server must initiate the hosted workflow by sending a `POST` request to the Evaluation endpoint. Include your workflow name and a `redirect_uri` where the user should return after completing the hosted flow.

### **API request**

> See the [RiskOS™ documentation](https://help.socure.com/riskos/docs/kyc-watchlist-screening-hosted-flow-start-an-evaluation) for the complete request schema.
> 

**Endpoint**

```
POST /api/evaluation
```

**Headers**

```
Authorization: Bearer <YOUR_API_KEY>
Content-Type: application/json
Accept: application/json
```

**Example request**

```json
{
  "id": "{{$randomUUID}}",
  "timestamp": "2022-07-28T06:10:54.298Z",
  "workflow": "consumer_onboarding",
  "data": {
    "individual": {
      "id": "{{$customerUUID}}"
    },
    "custom": {
      "redirect_uri": "https://xyz.co/"
    }
  }
}
```

**Required fields**

| Field | Description |
| --- | --- |
| `id` | Unique identifier for this evaluation (generate a UUID). |
| `timestamp` | RFC 3339 timestamp when the request is sent. |
| `workflow` | Hosted Flow workflow configured in RiskOS™. |
| `data.custom.redirect_uri` | URL where the user returns after completing the hosted flow. |

### **Verify the response**

RiskOS™ returns a `201 Created` response with:

- `eval_id`
- `decision: "REVIEW"`
- `eval_status: "evaluation_paused"`
- Hosted `redirect_uri`

Because this request initiates the Hosted Flow, the decision will be `REVIEW` and the evaluation remains paused while RiskOS™ collects identity data.

**Example response**

```json
{
  "eval_id": "1cc8f438-3c65-47ec-a1de-ad828dbcfa25",
  "decision": "REVIEW",
  "eval_status": "evaluation_paused",
  "redirect_uri": "https://riskos.sandbox.socure.com/hosted/27017931-f19b-4ae8-b7dc-d11e29331f51"
}
```

| Field | Description |
| --- | --- |
| `redirect_uri` | Present only when `decision = REVIEW`. Launch the hosted onboarding experience using this URL. |
| `eval_id` | RiskOS-generated identifier. Persist to correlate logs and webhooks. |
| `decision` | `REVIEW` — indicates the Hosted Flow has started. |
| `eval_status` | `evaluation_paused` while RiskOS™ collects identity data in the Hosted Flow. |

### Step 4: Launch the Hosted Flow

When you create the evaluation, RiskOS™ returns a hosted `redirect_uri`. Redirect the user to this URL to begin the Socure-hosted verification flow (PII collection + any required verification steps).

> RiskOS™ manages the end-to-end user experience inside the Hosted Flow UI. Your application only launches the URL and waits for the final webhook result. See the [Integration Guide](https://help.socure.com/riskos/docs/hosted-flows-integration-guide) for more information.
> 

### **Web**

```jsx
window.location.href = redirect_uri;
```

### **iOS**

```swift
import SafariServices

let hostedUXURL = URL(string: redirectUri)!
let safariVC = SFSafariViewController(url: hostedUXURL)
present(safariVC, animated: true)
```

### **Android**

```kotlin
import androidx.browser.customtabs.CustomTabsIntent

val customTabsIntent = CustomTabsIntent.Builder().build()
customTabsIntent.launchUrl(this, Uri.parse(redirectUri))
```

### Step 5: Receive the final decision (webhook)

Hosted flows complete asynchronously. When the verification session finishes, RiskOS™ sends the final outcome via the `evaluation_completed` webhook.

> See the [Webhooks documentation](https://help.socure.com/riskos/docs/webhooks) for setup instructions.
> 

### **Listen for `evaluation_completed`**

The final outcome is available in `data.decision`.

Your webhook endpoint should:

- Verify `event_type === "evaluation_completed"`
- Read `data.decision`
- Persist `data.eval_id` and your external `data.id`
- Return `200 OK`

**Minimal payload (truncated)**

```json
{
  "event_type": "evaluation_completed",
  "data": {
    "eval_id": "11111111-2222-3333-4444-555555555555",
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "decision": "ACCEPT",
    "eval_status": "evaluation_completed"
  }
}
```

### **Minimal webhook handler (server-side)**

Persist the final decision and identifiers so your frontend can route the user appropriately.

```tsx
export async function POST(request: Request) {
  const event = await request.json();

  if (event?.event_type !== "evaluation_completed") {
    return new Response("Ignored", { status: 200 });
  }

  const { id: externalId, eval_id: evalId, decision } = event.data || {};

  // Persist { externalId, evalId, decision }
  // Example: save to database keyed by externalId

  return new Response("OK", { status: 200 });
}
```

### **Route the user**

Route users based on the stored webhook decision:

- `ACCEPT` - Continue onboarding
- `REJECT` - Stop onboarding or route to fallback flow

A common approach is polling your backend until the stored decision changes.

### Step 6: Before going live

Confirm your integration is complete:

- Use the Sandbox base URL (`https://riskos.sandbox.socure.com`) during testing
- Create the hosted evaluation and redirect the user using the returned `redirect_uri`
- Register a webhook endpoint and process `evaluation_completed` events
- Persist `id` and `eval_id` to correlate API responses and webhooks
- Route users based on the final decision (`ACCEPT` or `REJECT`)
