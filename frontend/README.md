# Spinwheel Sandbox Frontend

The frontend is a **React 18 + TypeScript + Tailwind CSS** single-page application built on **Vite**. It provides an interactive UI for exploring Spinwheel's APIs, debt profile discovery, identity waterfalls, student loan 401(k) matching, and AI copilot strategies.

---

## 📂 Component Directory

| Component | Purpose |
| :--- | :--- |
| [`src/components/ConnectForm.tsx`](file:///c:/Users/Admin/spinwheel/frontend/src/components/ConnectForm.tsx) | Step 1 interactive form for 1-Click user connection using phone number and date of birth. |
| [`src/components/VerifyForm.tsx`](file:///c:/Users/Admin/spinwheel/frontend/src/components/VerifyForm.tsx) | Step 2 OTP verification input for 6-digit SMS codes with timer and error states. |
| [`src/components/DebtProfileViewer.tsx`](file:///c:/Users/Admin/spinwheel/frontend/src/components/DebtProfileViewer.tsx) | Visual dashboard of VantageScore 3.0, score factors, debt utilization, and card tradelines. |
| [`src/components/BalanceTransferWidget.tsx`](file:///c:/Users/Admin/spinwheel/frontend/src/components/BalanceTransferWidget.tsx) | 0% APR intro offer calculator with interest savings breakdown, payoff quotes, and settlement dispatch. |
| [`src/components/RiskOSWaterfall.tsx`](file:///c:/Users/Admin/spinwheel/frontend/src/components/RiskOSWaterfall.tsx) | Multi-scenario simulator comparing Prove MNO vs. Socure RiskOS vs. Synthetic Fraud vs. Step-Up DocV. |
| [`src/components/QslpEngineViewer.tsx`](file:///c:/Users/Admin/spinwheel/frontend/src/components/QslpEngineViewer.tsx) | SECURE 2.0 §110 compliance evaluator, 5-point IRS check visualizer, recordkeeper dispatch, and certificate download. |
| [`src/components/AgenticCoPilot.tsx`](file:///c:/Users/Admin/spinwheel/frontend/src/components/AgenticCoPilot.tsx) | Conversational AI financial assistant comparing Avalanche vs. Snowball payoff strategies with 1-click execution. |
| [`src/components/McpDemoViewer.tsx`](file:///c:/Users/Admin/spinwheel/frontend/src/components/McpDemoViewer.tsx) | Interactive test bench for Model Context Protocol (MCP) tool schemas and live execution. |
| [`src/components/SwaggerDocsViewer.tsx`](file:///c:/Users/Admin/spinwheel/frontend/src/components/SwaggerDocsViewer.tsx) | Embedded interactive OpenAPI / Swagger UI reader. |
| [`src/components/DebugPanel.tsx`](file:///c:/Users/Admin/spinwheel/frontend/src/components/DebugPanel.tsx) | Live JSON inspector showing exact request/response payloads from backend and upstream APIs. |

---

## 🛠️ Commands

```bash
# Start Vite development server (http://localhost:5173)
npm run dev

# Typecheck and build for production
npm run build

# Preview production build locally
npm run preview
```
