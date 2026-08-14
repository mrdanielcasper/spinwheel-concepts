import React, { useState } from 'react';
import { 
  BookOpen, Search, Send, Check, 
  Copy, FileCode2, RotateCcw, AlertCircle
} from 'lucide-react';

interface EndpointItem {
  tag: string;
  method: 'GET' | 'POST';
  path: string;
  summary: string;
  description: string;
  requestBodyExample?: any;
  responseExample?: any;
  parametersDoc?: { name: string; type: string; required: boolean; description: string }[];
}

const ENDPOINTS: EndpointItem[] = [
  // 1. SECURE 2.0 QSLP Engine
  {
    tag: 'SECURE 2.0 QSLP Engine',
    method: 'POST',
    path: '/api/qslp/evaluate',
    summary: 'Evaluate Student Loan Payment for QSLP 401(k) Match',
    description: 'Evaluates IRS Notice 2024-63 5-point criteria (IRC 221(d)(1), settled amount, payment date window, payor identity match, and good standing status) and generates SHA-256 cryptographic audit hashes for ERISA Safe Harbor compliance.',
    requestBodyExample: {
      employeeId: "emp_acme_9941",
      planYear: 2026,
      paymentDetails: {
        servicerName: "Nelnet Servicing, LLC",
        loanAccountId: "ln_nelnet_8921",
        paymentAmount: 350.00,
        paymentDate: "2026-08-01",
        payorAccountOwner: "Alex Morgan",
        payorBankName: "Chase Bank, N.A.",
        settlementTransactionId: "tx_settled_nelnet_991823"
      },
      planMatchRules: {
        annualSalary: 95000,
        matchPercentage: 0.50,
        maxSalaryPercentage: 0.06
      },
      scenario: "COMPLIANT_MATCH"
    },
    parametersDoc: [
      { name: "employeeId", type: "string", required: true, description: "Unique employer HRIS employee identifier" },
      { name: "planYear", type: "integer", required: true, description: "Active 401(k) plan tax year (e.g. 2026)" },
      { name: "paymentDetails.paymentAmount", type: "number", required: true, description: "Exact dollar amount settled to student loan servicer" },
      { name: "paymentDetails.servicerName", type: "string", required: true, description: "Verified Department of Ed or private servicer name" },
      { name: "paymentDetails.payorAccountOwner", type: "string", required: true, description: "Account holder name on originating bank debit (must match employee)" },
      { name: "planMatchRules.matchPercentage", type: "number", required: false, description: "Plan matching rate (e.g. 0.50 for 50% match)" },
      { name: "scenario", type: "string", required: false, description: "Test persona: COMPLIANT_MATCH, THIRD_PARTY_PAYOR_REJECT, NON_QUALIFIED_DEBT_REJECT, CAP_REACHED" }
    ],
    responseExample: {
      success: true,
      data: {
        eventId: "qslp_evt_89230114",
        employeeId: "emp_acme_9941",
        planYear: 2026,
        complianceStatus: "VERIFIED_COMPLIANT",
        irsFivePointChecks: [
          { id: "RULE_1_LOAN_QUALIFICATION", name: "IRC Section 221(d)(1) Qualified Higher Education Loan", passed: true, score: 1.0 },
          { id: "RULE_2_PAYMENT_AMOUNT", name: "Payment Settlement Amount Verification", passed: true, score: 1.0 },
          { id: "RULE_3_PAYMENT_DATE_TIMESTAMP", name: "Payment Date Within Active Plan Year Window", passed: true, score: 1.0 },
          { id: "RULE_4_PAYOR_IDENTITY_MATCH", name: "Payor Identity & Direct Employee Ownership", passed: true, score: 1.0 },
          { id: "RULE_5_TRADELINE_GOOD_STANDING", name: "Servicer Tradeline In Good Standing", passed: true, score: 1.0 }
        ],
        matchCalculation: {
          eligibleQslpPortion: 350.00,
          employerMatchAmount: 175.00,
          cumulativePlanYearMatchDisbursed: 1400.00,
          annualMatchCeiling: 2850.00,
          remainingMatchAvailable: 1450.00
        },
        auditTrail: {
          verificationMethod: "DIRECT_SERVICER_API_SNAPSHOT",
          verificationTimestamp: "2026-08-01T14:22:18Z",
          dataHash: "fdd72c0a96e208527a92c4b8b6f71d5e",
          erisaFiduciarySafeHarbor: true
        },
        executiveSummary: "100% Compliant: Direct Subsidized Federal Stafford Loan verified with $175.00 401(k) match approved."
      }
    }
  },
  {
    tag: 'SECURE 2.0 QSLP Engine',
    method: 'POST',
    path: '/api/qslp/dispatch-match',
    summary: 'Dispatch 401(k) Match Ledger to Recordkeeper',
    description: 'Transmits verified QSLP employer matching contribution payload directly to target 401(k) Recordkeeper (Fidelity, Empower, Rippling, Schwab).',
    requestBodyExample: {
      eventId: "qslp_evt_89230114",
      recordkeeper: "Fidelity Investments",
      participantId: "part_fid_4819",
      matchAmount: 175.00,
      planId: "plan_401k_acme_2026"
    },
    parametersDoc: [
      { name: "eventId", type: "string", required: true, description: "Cryptographically verified QSLP event ID" },
      { name: "recordkeeper", type: "string", required: true, description: "Target 401(k) Recordkeeper (Fidelity, Empower, Rippling, Schwab)" },
      { name: "matchAmount", type: "number", required: false, description: "Calculated employer contribution dollar amount" }
    ],
    responseExample: {
      success: true,
      data: {
        eventId: "qslp_evt_89230114",
        ledgerConfirmationId: "rc_ack_1786675244985_g1xc",
        ledgerStatus: "MATCH_POSTED_TO_PARTICIPANT_ACCOUNT",
        taxYear: 2026,
        subAccount: "EMPLOYER_MATCH_QSLP_SUBLEDGER",
        fiduciaryAuditUrl: "https://api.spinwheel.io/v1/secure20/audit/qslp_evt_89230114"
      }
    }
  },
  {
    tag: 'SECURE 2.0 QSLP Engine',
    method: 'GET',
    path: '/api/qslp/kpis',
    summary: 'Get QSLP Commercial & TCO KPI Metrics',
    description: 'Returns comparative SaaS PEPM pricing models ($2.50 PEPM vs $0.20 API pulls), ARR expansion metrics (12.5x), and HR labor hours saved.',
    responseExample: {
      success: true,
      data: {
        rawApiFeePerPull: "$0.20 per API call",
        qslpSaaSRevenueModel: "$2.50 Per-Employee-Per-Month (PEPM)",
        annualRecurringRevenue15kCohort: "$450,000 ARR",
        arrMultiplierVsRawApi: "12.5x Revenue Expansion",
        hrManualReviewHoursSavedPerMonth: "160+ hours / 1,000 employees"
      }
    }
  },

  // 2. Identity Waterfall (Prove + Socure)
  {
    tag: 'Identity Waterfall (Prove + Socure)',
    method: 'POST',
    path: '/api/identity/waterfall/verify',
    summary: 'Execute Tiered Identity Waterfall Verification',
    description: 'Orchestrates carrier lookup (Prove) with automated middleware fallback to Socure RiskOS (ID+ and Sigma Fraud 3.0) and DocV step-up.',
    requestBodyExample: {
      userData: {
        phoneNumber: "+12149078770",
        firstName: "Alex",
        lastName: "Morgan",
        dateOfBirth: "1994-06-12",
        ssnLast4: "4819",
        address: {
          street: "123 Market St",
          city: "San Francisco",
          state: "CA",
          postalCode: "94105"
        }
      },
      scenarioOverride: "SOCURE_RESCUE"
    },
    parametersDoc: [
      { name: "userData.phoneNumber", type: "string", required: true, description: "E.164 formatted applicant phone number" },
      { name: "userData.dateOfBirth", type: "string", required: true, description: "YYYY-MM-DD format" },
      { name: "userData.ssnLast4", type: "string", required: false, description: "Last 4 digits of applicant SSN" },
      { name: "scenarioOverride", type: "string", required: false, description: "PROVE_MATCH, SOCURE_RESCUE, SYNTHETIC_FRAUD, DOCV_STEPUP" }
    ],
    responseExample: {
      success: true,
      data: {
        transactionId: "tx_wf_178667523190",
        evalId: "ce82f0e7-1b52-4586-b9f6-1aaba1726526",
        finalDecision: "RESCUED_APPROVE",
        spinwheelProfileProceed: true,
        proveResult: { status: "INCONCLUSIVE", lineType: "VOIP_PREPAID", score: 480 },
        socureResult: { decision: "ACCEPT", sigmaFraudScore: 142, syntheticFraudScore: 0.04 },
        tcoImpact: { costSavedVsKba: "$2.10", routingLatencyMs: 384 }
      }
    }
  },
  {
    tag: 'Identity Waterfall (Prove + Socure)',
    method: 'POST',
    path: '/api/identity/waterfall/docv-complete',
    summary: 'Finalize DocV ID Scan & Biometric Verification',
    description: 'Completes the 2-step government photo ID scan and 3D selfie biometric match verification, unlocking the Spinwheel Debt Profile.',
    requestBodyExample: {
      evalId: "ce82f0e7-1b52-4586-b9f6-1aaba1726526",
      passed: true
    },
    parametersDoc: [
      { name: "evalId", type: "string", required: true, description: "Socure RiskOS Evaluation UUID" },
      { name: "passed", type: "boolean", required: true, description: "Whether ID and 3D liveness scan passed" }
    ],
    responseExample: {
      success: true,
      data: {
        evalStatus: "evaluation_completed",
        decision: "ACCEPT",
        biometricMatchScore: 0.96,
        spinwheelProfileProceed: true
      }
    }
  },
  {
    tag: 'Identity Waterfall (Prove + Socure)',
    method: 'GET',
    path: '/api/identity/waterfall/kpis',
    summary: 'Get Identity Waterfall TCO & Pass Rate Metrics',
    description: 'Returns TCO metrics: $0.00 KBA spend (100% retired), +37% failure bucket recovery, and $0.38 blended cost per user.',
    responseExample: {
      success: true,
      data: {
        kbaVendorExpenditureProposed: "$0.00 (100% Retired)",
        proveFailedPassRateProposed: "82% (Socure ID+ Instant Match)",
        blendedIdentityCostProposed: "$0.38 / verified user"
      }
    }
  },

  // 3. Agentic Debt Co-Pilot
  {
    tag: 'Agentic Debt Co-Pilot',
    method: 'POST',
    path: '/api/copilot/analyze',
    summary: 'Generate Comprehensive Financial Health Analysis',
    description: 'Analyzes debt liabilities against checking balances and generates optimized payoff recommendations (Avalanche, Snowball, Balance Transfer Arbitrage).',
    requestBodyExample: {
      userId: "c3cf91d9-21c8-413c-82bf-286d6e05593e",
      checkingBalance: 350.00
    },
    parametersDoc: [
      { name: "userId", type: "string", required: true, description: "User ID with verified debt tradelines" },
      { name: "checkingBalance", type: "number", required: false, description: "Liquid checking account balance for safety buffer calculation" }
    ],
    responseExample: {
      success: true,
      data: {
        metrics: { totalDebt: 18450, totalMonthlyPayment: 620, weightedApr: 21.4 },
        strategies: [
          { name: "Debt Avalanche", totalInterestPaid: 3200, monthsToDebtFree: 28 },
          { name: "0% Balance Transfer Arbitrage", totalInterestPaid: 450, monthsToDebtFree: 18 }
        ]
      }
    }
  },
  {
    tag: 'Agentic Debt Co-Pilot',
    method: 'POST',
    path: '/api/copilot/chat',
    summary: 'Multi-Turn Conversational Debt Co-Pilot Advisor',
    description: 'Interactive AI financial advisor providing mathematical optimization, payment dispatch actions, and payoff timeline guidance.',
    requestBodyExample: {
      userId: "c3cf91d9-21c8-413c-82bf-286d6e05593e",
      message: "How much interest can I save by putting $200 extra toward my Chase card?",
      conversationHistory: []
    },
    parametersDoc: [
      { name: "userId", type: "string", required: true, description: "Connected user ID" },
      { name: "message", type: "string", required: true, description: "User natural language financial query" },
      { name: "conversationHistory", type: "array", required: false, description: "Previous conversational turns" }
    ],
    responseExample: {
      success: true,
      data: {
        reply: "Allocating an extra $200/month reduces your payoff time by 14 months and saves $1,840 in compounding interest.",
        actions: [{ type: "DISPATCH_PAYMENT", amount: 200, liabilityId: "liab_chase_441" }]
      }
    }
  },
  {
    tag: 'Agentic Debt Co-Pilot',
    method: 'POST',
    path: '/api/copilot/simulate',
    summary: 'Simulate Debt Payoff Strategies Instantly',
    description: 'Simulates Debt Avalanche, Debt Snowball, and 0% Balance Transfer Arbitrage based on extra monthly contribution amount.',
    requestBodyExample: {
      userId: "c3cf91d9-21c8-413c-82bf-286d6e05593e",
      extraMonthlyAmount: 200.00,
      checkingBalance: 350.00
    },
    parametersDoc: [
      { name: "userId", type: "string", required: true, description: "Connected user ID" },
      { name: "extraMonthlyAmount", type: "number", required: true, description: "Extra dollar allocation above minimum payments" }
    ],
    responseExample: {
      success: true,
      data: {
        strategies: [
          { strategy: "AVALANCHE", interestSaved: 2450.00, payoffMonths: 24 }
        ]
      }
    }
  },

  // 4. Instant Balance Transfer
  {
    tag: 'Instant Balance Transfer',
    method: 'POST',
    path: '/api/balance-transfer/connect-preverified',
    summary: 'Connect Pre-Verified User for Balance Transfer',
    description: 'Initiates balance transfer flow for an applicant who has already completed carrier authentication.',
    requestBodyExample: {
      phoneNumber: "+12149078770",
      dateOfBirth: "1988-11-14"
    },
    parametersDoc: [
      { name: "phoneNumber", type: "string", required: true, description: "Applicant phone number" },
      { name: "dateOfBirth", type: "string", required: true, description: "Applicant date of birth" }
    ],
    responseExample: {
      success: true,
      data: {
        userId: "c3cf91d9-21c8-413c-82bf-286d6e05593e",
        networkToken: "nt_17866_bt_verified",
        connectionStatus: "VERIFIED"
      }
    }
  },
  {
    tag: 'Instant Balance Transfer',
    method: 'POST',
    path: '/api/balance-transfer/liabilities',
    summary: 'Get Eligible Liabilities for Balance Transfer',
    description: 'Retrieves credit card liabilities with APR and balance transfer quote eligibility.',
    requestBodyExample: {
      userId: "c3cf91d9-21c8-413c-82bf-286d6e05593e"
    },
    parametersDoc: [
      { name: "userId", type: "string", required: true, description: "Verified user ID" }
    ],
    responseExample: {
      success: true,
      data: {
        liabilities: [
          { id: "liab_chase_01", accountName: "Chase Freedom", balance: 4250, apr: 24.99, minPayment: 110 }
        ]
      }
    }
  },
  {
    tag: 'Instant Balance Transfer',
    method: 'POST',
    path: '/api/balance-transfer/submit',
    summary: 'Submit Balance Transfer Request',
    description: 'Submits selected liability transfer requests to the receiving credit issuer.',
    requestBodyExample: {
      userId: "c3cf91d9-21c8-413c-82bf-286d6e05593e",
      transfers: [
        {
          sourceLiabilityId: "liab_chase_01",
          transferAmount: 2500.00,
          destinationCardId: "card_citi_simplicity_02"
        }
      ]
    },
    parametersDoc: [
      { name: "userId", type: "string", required: true, description: "Verified user ID" },
      { name: "transfers", type: "array", required: true, description: "List of transfers with source, amount, and destination card" }
    ],
    responseExample: {
      success: true,
      data: {
        batchId: "bt_batch_17866",
        status: "SUBMITTED",
        estimatedSavings: 680.00
      }
    }
  },

  // 5. Debt Profile & Liabilities
  {
    tag: 'Debt Profile & Liabilities',
    method: 'POST',
    path: '/api/users/c3cf91d9-21c8-413c-82bf-286d6e05593e/debt-profile',
    summary: 'Fetch User Debt Profile & Tradelines',
    description: 'Fetches user credit profile (VantageScore 3.0), credit card accounts, auto loans, and student loan balances.',
    requestBodyExample: {},
    responseExample: {
      success: true,
      data: {
        creditScore: { score: 720, model: "VantageScore 3.0" },
        liabilities: [
          { name: "Nelnet Student Loan", balance: 24350, type: "STUDENT_LOAN" },
          { name: "Chase Sapphire", balance: 3400, type: "CREDIT_CARD" }
        ]
      }
    }
  },

  // 6. Authentication & Connect
  {
    tag: 'Authentication & Connect',
    method: 'POST',
    path: '/api/connect-user',
    summary: 'Initiate Frictionless SMS Connect Flow',
    description: 'Takes user phone number and date of birth, connects to carrier lookup, and dispatches a 6-digit OTP code.',
    requestBodyExample: {
      phoneNumber: "+12149078770",
      dateOfBirth: "1988-11-14"
    },
    parametersDoc: [
      { name: "phoneNumber", type: "string", required: true, description: "User mobile phone number (E.164 format)" },
      { name: "dateOfBirth", type: "string", required: true, description: "User date of birth (YYYY-MM-DD)" }
    ],
    responseExample: {
      success: true,
      data: {
        userId: "usr_mock_12345",
        connectionStatus: "PENDING_OTP",
        sms: { codeTimeoutSeconds: 300 }
      }
    }
  },
  {
    tag: 'Authentication & Connect',
    method: 'POST',
    path: '/api/verify-user',
    summary: 'Verify OTP Code and Retrieve Profile',
    description: 'Verifies the 6-digit OTP SMS code and returns the verified user identity profile.',
    requestBodyExample: {
      userId: "usr_mock_12345",
      code: "123456"
    },
    parametersDoc: [
      { name: "userId", type: "string", required: true, description: "User ID returned from /api/connect-user" },
      { name: "code", type: "string", required: true, description: "6-digit OTP code (Sandbox default: 123456)" }
    ],
    responseExample: {
      success: true,
      data: {
        userId: "usr_mock_12345",
        connectionStatus: "VERIFIED",
        profile: { firstName: "Daniel", lastName: "Casper", ssnLastFourDigits: "6789" }
      }
    }
  },

  // 7. System & Health
  {
    tag: 'System & Health',
    method: 'GET',
    path: '/api/health',
    summary: 'Server Health Check',
    description: 'Returns operational health status and server timestamp.',
    responseExample: {
      status: "healthy",
      timestamp: "2026-08-13T21:45:00.000Z"
    }
  },
  {
    tag: 'System & Health',
    method: 'GET',
    path: '/api/docs/openapi.json',
    summary: 'Get OpenAPI 3.0 JSON Specification',
    description: 'Returns the raw OpenAPI 3.0.3 specification JSON file for importing into Postman or Insomnia.',
    responseExample: {
      openapi: "3.0.3",
      info: { title: "Spinwheel Developer Platform API", version: "2.0.0" }
    }
  }
];

export const SwaggerDocsViewer: React.FC = () => {
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointItem | null>(ENDPOINTS[0]);
  const [requestBodyText, setRequestBodyText] = useState<string>(
    ENDPOINTS[0].requestBodyExample ? JSON.stringify(ENDPOINTS[0].requestBodyExample, null, 2) : ''
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const tags = ['ALL', 'SECURE 2.0 QSLP Engine', 'Identity Waterfall (Prove + Socure)', 'Agentic Debt Co-Pilot', 'Instant Balance Transfer', 'Debt Profile & Liabilities', 'Authentication & Connect', 'System & Health'];

  const handleSelectEndpoint = (ep: EndpointItem) => {
    setActiveEndpoint(ep);
    setTestResponse(null);
    setJsonError(null);
    setRequestBodyText(ep.requestBodyExample ? JSON.stringify(ep.requestBodyExample, null, 2) : '');
  };

  const handleResetBody = () => {
    if (activeEndpoint?.requestBodyExample) {
      setRequestBodyText(JSON.stringify(activeEndpoint.requestBodyExample, null, 2));
      setJsonError(null);
    }
  };

  const filteredEndpoints = ENDPOINTS.filter(ep => {
    const matchesTag = selectedTag === 'ALL' || ep.tag === selectedTag;
    const matchesSearch = searchQuery === '' || 
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ep.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const handleTestEndpoint = async (ep: EndpointItem) => {
    setTestLoading(true);
    setTestResponse(null);
    setJsonError(null);

    let parsedBody: any = undefined;
    if (ep.method === 'POST') {
      try {
        parsedBody = requestBodyText ? JSON.parse(requestBodyText) : {};
      } catch (err: any) {
        setJsonError('Invalid JSON format in request body. Please fix syntax.');
        setTestLoading(false);
        return;
      }
    }

    const startTime = Date.now();
    try {
      const url = `http://localhost:3001${ep.path}`;
      const res = await fetch(url, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.method === 'POST' ? JSON.stringify(parsedBody) : undefined
      });
      const data = await res.json();
      const elapsed = Date.now() - startTime;
      setTestResponse({ status: res.status, ok: res.ok, elapsed, data });
    } catch (e: any) {
      setTestResponse({ status: 500, ok: false, error: e.message || 'Request failed' });
    }
    setTestLoading(false);
  };

  const copyCurl = (ep: EndpointItem) => {
    let curl = `curl -X ${ep.method} "http://localhost:3001${ep.path}"`;
    if (ep.method === 'POST') {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBodyText.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-2xl border border-sky-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-sky-600/20 via-cyan-600/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-600 to-indigo-600 p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">OpenAPI 3.0.3 Specification</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-[10px] text-sky-300 font-mono">Interactive Swagger Collection</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">API Documentation & Swagger UI</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="http://localhost:3001/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center space-x-1.5 transition-all"
            >
              <span>Open Standalone Swagger UI ↗</span>
            </a>
            <a
              href="http://localhost:3001/api/docs/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 font-mono text-xs transition-colors flex items-center space-x-1"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>openapi.json</span>
            </a>
          </div>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search endpoints (e.g. qslp, waterfall, copilot, liabilities)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-semibold ${
                  selectedTag === t
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-Column Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left List of Endpoints (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {filteredEndpoints.map((ep, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectEndpoint(ep)}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                activeEndpoint?.path === ep.path && activeEndpoint?.method === ep.method
                  ? 'bg-sky-950/40 border-sky-500/70 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/30'
                  : 'bg-slate-950/80 border-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'
                }`}>
                  {ep.method}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{ep.tag}</span>
              </div>
              <div className="font-mono text-xs text-white font-bold truncate">{ep.path}</div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{ep.summary}</p>
            </button>
          ))}
        </div>

        {/* Right Detail Pane (7 cols) */}
        <div className="lg:col-span-7">
          {activeEndpoint ? (
            <div className="glass-premium rounded-2xl p-6 sm:p-7 shadow-xl border border-white/10 space-y-6">
              
              {/* Endpoint Header */}
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      activeEndpoint.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'
                    }`}>
                      {activeEndpoint.method}
                    </span>
                    <span className="font-mono text-sm font-bold text-white">{activeEndpoint.path}</span>
                  </div>
                  <button
                    onClick={() => copyCurl(activeEndpoint)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center space-x-1.5 transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied cURL!' : 'Copy cURL'}</span>
                  </button>
                </div>
                <h3 className="text-base font-bold text-white">{activeEndpoint.summary}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{activeEndpoint.description}</p>
              </div>

              {/* Interactive Request Body Editor Section */}
              {activeEndpoint.method === 'POST' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="font-bold text-slate-300 flex items-center space-x-1">
                      <span>Editable Request Body (JSON):</span>
                      <span className="text-[10px] text-sky-400 font-normal">(Modify values to test live)</span>
                    </span>
                    <button
                      onClick={handleResetBody}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1 underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Sample</span>
                    </button>
                  </div>
                  <textarea
                    value={requestBodyText}
                    onChange={(e) => {
                      setRequestBodyText(e.target.value);
                      setJsonError(null);
                    }}
                    rows={10}
                    className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 focus:outline-none focus:border-sky-500 transition-colors leading-relaxed"
                  />
                  {jsonError && (
                    <div className="text-xs text-red-400 flex items-center space-x-1 font-mono">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{jsonError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Parameters / Schema Field Reference Table */}
              {activeEndpoint.parametersDoc && activeEndpoint.parametersDoc.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 font-mono block">Field Schema Definitions:</span>
                  <div className="border border-slate-850 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Field</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Required</th>
                          <th className="p-2.5 font-sans">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-950/40 text-slate-300">
                        {activeEndpoint.parametersDoc.map((p, pidx) => (
                          <tr key={pidx} className="hover:bg-slate-900/50">
                            <td className="p-2.5 font-bold text-sky-300">{p.name}</td>
                            <td className="p-2.5 text-slate-400">{p.type}</td>
                            <td className="p-2.5">{p.required ? <span className="text-amber-400">Yes</span> : <span className="text-slate-500">No</span>}</td>
                            <td className="p-2.5 font-sans text-slate-400 text-[11px]">{p.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Live Test Action Button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleTestEndpoint(activeEndpoint)}
                  disabled={testLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-indigo-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{testLoading ? 'Sending Live Request...' : 'Send Live Test Request'}</span>
                </button>

                <span className="text-xs text-slate-500 font-mono">Direct localhost:3001 execution</span>
              </div>

              {/* Live Test Response Display */}
              {testResponse && (
                <div className="space-y-2 pt-2 border-t border-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Response Status:</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        testResponse.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        HTTP {testResponse.status}
                      </span>
                    </div>
                    {testResponse.elapsed && (
                      <span className="text-slate-500 text-[11px]">Latency: {testResponse.elapsed}ms</span>
                    )}
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 max-h-[300px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(testResponse.data || testResponse, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Expected Response Schema Area */}
              {!testResponse && activeEndpoint.responseExample && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="font-bold text-slate-300">Expected 200 OK Response Schema:</span>
                  </div>
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-850 font-mono text-xs text-slate-400 overflow-x-auto max-h-[220px]">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(activeEndpoint.responseExample, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-premium rounded-2xl p-12 text-center text-slate-500">
              Select an endpoint to inspect documentation and execute live test requests.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
