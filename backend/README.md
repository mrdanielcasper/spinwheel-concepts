# Spinwheel Express Backend API

The backend server is a **Node.js + TypeScript Express application** that orchestrates Spinwheel Sandbox APIs, Socure RiskOS / Prove identity verification, SECURE 2.0 §110 QSLP calculations, and AI agent integrations via the Model Context Protocol (MCP).

---

## 📂 Source Code Architecture

| File | Purpose |
| :--- | :--- |
| [`src/index.ts`](file:///c:/Users/Admin/spinwheel/backend/src/index.ts) | Express server initialization, security middlewares (rate limiting, strict CORS, CSP, no-cache PII headers), and REST route handlers. |
| [`src/client.ts`](file:///c:/Users/Admin/spinwheel/backend/src/client.ts) | Spinwheel Sandbox API HTTP client with 24-hour in-memory TTL caching and reference Equifax fallback for zero-downtime demo reliability. |
| [`src/validation.ts`](file:///c:/Users/Admin/spinwheel/backend/src/validation.ts) | Request payload validators (E.164 phone formats, strict ISO-8601 DOB `YYYY-MM-DD`, 6-digit OTPs, UUID parameters). |
| [`src/parser.ts`](file:///c:/Users/Admin/spinwheel/backend/src/parser.ts) | Error normalization into consistent `{ success: false, error: { code, message, details, httpStatus, source } }` contracts. |
| [`src/mapper.ts`](file:///c:/Users/Admin/spinwheel/backend/src/mapper.ts) | Normalization of multi-tradeline 1-Bureau credit bureau reports into unified liabilities and 0% intro APR balance transfer calculations. |
| [`src/socure.ts`](file:///c:/Users/Admin/spinwheel/backend/src/socure.ts) | 2-Tier Identity Waterfall: Tier 1 Prove MNO carrier verification $\to$ Tier 2 Socure RiskOS synthetic fraud scoring & DocV biometric step-up. |
| [`src/qslp.ts`](file:///c:/Users/Admin/spinwheel/backend/src/qslp.ts) | SECURE 2.0 Act §110 / IRS Notice 2024-63 student loan 401(k) compliance matching engine and SHA-256 audit certificate generator. |
| [`src/copilot.ts`](file:///c:/Users/Admin/spinwheel/backend/src/copilot.ts) | Multi-turn financial advice engine blending Anthropic Claude 3.5 with mathematical Avalanche, Snowball, and Balance Transfer simulations. |
| [`src/mcp.ts`](file:///c:/Users/Admin/spinwheel/backend/src/mcp.ts) | Model Context Protocol (MCP) server over stdio for Claude Desktop and agentic tools. |
| [`src/openapi.ts`](file:///c:/Users/Admin/spinwheel/backend/src/openapi.ts) | OpenAPI 3.0.3 spec generator and interactive Swagger UI provider. |

---

## 🛠️ Commands

```bash
# Run in development mode with auto-reload
npm run dev

# Build TypeScript to dist/
npm run build

# Run production server
npm start

# Run unit and integration tests with coverage report
npm run test:coverage
```
