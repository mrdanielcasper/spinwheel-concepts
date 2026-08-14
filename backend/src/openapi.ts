/**
 * OpenAPI 3.0.3 Specification for Spinwheel Developer Platform & Middleware Engine
 */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Spinwheel Developer Platform & Middleware API",
    version: "2.0.0",
    description: `Complete OpenAPI documentation for Spinwheel's core Connect & Debt APIs, Agentic Debt Co-Pilot, Tiered Identity Waterfall (Prove + Socure RiskOS & DocV), and SECURE 2.0 Section 110 QSLP Engine.`,
    contact: {
      name: "Spinwheel Developer Support",
      url: "https://spinwheel.io",
      email: "support@spinwheel.io"
    }
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local Development & Sandbox Server"
    }
  ],
  tags: [
    { name: "SECURE 2.0 QSLP Engine", description: "Section 110 & IRS Notice 2024-63 5-Point Rule compliance and 401(k) match ledger dispatch" },
    { name: "Identity Waterfall (Prove + Socure)", description: "Tiered fallback routing with Prove carrier lookup, Socure ID+, Sigma Fraud 3.0, and DocV" },
    { name: "Agentic Debt Co-Pilot", description: "Multi-turn debt payoff strategies, financial math simulations, and conversational advisor" },
    { name: "Instant Balance Transfer", description: "Pre-verified user connection, 0% balance transfer quote generation, and ledger dispatch" },
    { name: "Debt Profile & Liabilities", description: "VantageScore credit summaries, credit card liabilities, loan tradelines, and payment schedules" },
    { name: "Authentication & Connect", description: "Frictionless Phone + DOB onboarding and OTP SMS verification" },
    { name: "System & Health", description: "Platform health diagnostics and OpenAPI specifications" }
  ],
  paths: {
    "/api/qslp/evaluate": {
      post: {
        tags: ["SECURE 2.0 QSLP Engine"],
        summary: "Evaluate Student Loan Payment for QSLP 401(k) Match",
        description: "Executes the 5-point IRS Notice 2024-63 verification rule engine (Loan Qualification IRC 221(d)(1), Settled Amount, Date Window, Payor Identity Match, and Good Standing Status) and generates SHA-256 cryptographic audit hashes for ERISA Safe Harbor compliance.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  employeeId: {
                    type: "string",
                    example: "emp_acme_9941",
                    description: "Unique employer HRIS employee identifier"
                  },
                  planYear: {
                    type: "integer",
                    example: 2026,
                    description: "Active 401(k) plan tax year"
                  },
                  paymentDetails: {
                    type: "object",
                    properties: {
                      servicerName: { type: "string", example: "Nelnet Servicing, LLC" },
                      loanAccountId: { type: "string", example: "ln_nelnet_8921" },
                      paymentAmount: { type: "number", example: 350.00, description: "Settled payment amount" },
                      paymentDate: { type: "string", format: "date", example: "2026-08-01" },
                      payorAccountOwner: { type: "string", example: "Alex Morgan" },
                      payorBankName: { type: "string", example: "Chase Bank, N.A." },
                      settlementTransactionId: { type: "string", example: "tx_settled_nelnet_991823" }
                    },
                    required: ["paymentAmount", "paymentDate"]
                  },
                  planMatchRules: {
                    type: "object",
                    properties: {
                      annualSalary: { type: "number", example: 95000 },
                      matchPercentage: { type: "number", example: 0.50, description: "Employer match percentage (e.g. 0.50 = 50%)" },
                      maxSalaryPercentage: { type: "number", example: 0.06, description: "Max deferral ceiling (e.g. 0.06 = 6%)" }
                    }
                  },
                  scenario: {
                    type: "string",
                    enum: ["COMPLIANT_MATCH", "THIRD_PARTY_PAYOR_REJECT", "NON_QUALIFIED_DEBT_REJECT", "CAP_REACHED"],
                    example: "COMPLIANT_MATCH",
                    description: "Pre-configured test scenario persona"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "QSLP evaluation and match calculation completed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        eventId: { type: "string", example: "qslp_evt_89230114" },
                        employeeId: { type: "string", example: "emp_acme_9941" },
                        planYear: { type: "integer", example: 2026 },
                        complianceStatus: { type: "string", enum: ["VERIFIED_COMPLIANT", "COMPLIANCE_REJECTED", "MANUAL_AUDIT_REQUIRED"], example: "VERIFIED_COMPLIANT" },
                        irsFivePointChecks: { type: "array", items: { type: "object" } },
                        matchCalculation: {
                          type: "object",
                          properties: {
                            eligibleQslpPortion: { type: "number", example: 350.00 },
                            employerMatchAmount: { type: "number", example: 175.00 },
                            cumulativePlanYearMatchDisbursed: { type: "number", example: 1400.00 },
                            annualMatchCeiling: { type: "number", example: 2850.00 },
                            remainingMatchAvailable: { type: "number", example: 1450.00 }
                          }
                        },
                        auditTrail: {
                          type: "object",
                          properties: {
                            verificationMethod: { type: "string", example: "DIRECT_SERVICER_API_SNAPSHOT" },
                            verificationTimestamp: { type: "string", example: "2026-08-01T14:22:18Z" },
                            dataHash: { type: "string", example: "fdd72c0a96e208527a92c4b8b6f71d5e" },
                            erisaFiduciarySafeHarbor: { type: "boolean", example: true }
                          }
                        },
                        executiveSummary: { type: "string", example: "100% Compliant: Direct Subsidized Federal Stafford Loan verified with $175.00 401(k) match approved." }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/qslp/dispatch-match": {
      post: {
        tags: ["SECURE 2.0 QSLP Engine"],
        summary: "Dispatch 401(k) Match Ledger to Recordkeeper",
        description: "Transmits verified QSLP employer matching contribution payload directly to target 401(k) Recordkeeper (Fidelity Investments, Empower, Rippling, Schwab).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["eventId"],
                properties: {
                  eventId: { type: "string", example: "qslp_evt_89230114", description: "Verified QSLP event ID from /api/qslp/evaluate" },
                  recordkeeper: { 
                    type: "string", 
                    enum: ["Fidelity Investments", "Empower Retirement", "Rippling 401(k)", "Charles Schwab"],
                    example: "Fidelity Investments" 
                  },
                  participantId: { type: "string", example: "part_fid_4819" },
                  matchAmount: { type: "number", example: 175.00 },
                  planId: { type: "string", example: "plan_401k_acme_2026" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Match contribution posted to participant subledger",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        eventId: { type: "string", example: "qslp_evt_89230114" },
                        ledgerConfirmationId: { type: "string", example: "rc_ack_1786675244985_g1xc" },
                        ledgerStatus: { type: "string", example: "MATCH_POSTED_TO_PARTICIPANT_ACCOUNT" },
                        taxYear: { type: "integer", example: 2026 },
                        fiduciaryAuditUrl: { type: "string", example: "https://api.spinwheel.io/v1/secure20/audit/qslp_evt_89230114" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/qslp/certificate/{eventId}": {
      get: {
        tags: ["SECURE 2.0 QSLP Engine"],
        summary: "Get Official ERISA Fiduciary Safe Harbor Certificate",
        description: "Generates a printable, cryptographically sealed ERISA Fiduciary Compliance Certificate for plan audit readiness.",
        parameters: [
          {
            name: "eventId",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "qslp_evt_89230114"
          }
        ],
        responses: {
          "200": { description: "Compliance certificate generated" }
        }
      }
    },
    "/api/qslp/kpis": {
      get: {
        tags: ["SECURE 2.0 QSLP Engine"],
        summary: "Get QSLP Commercial & TCO KPI Metrics",
        description: "Returns comparative SaaS PEPM pricing models ($2.50 PEPM vs $0.20 API pulls), ARR expansion metrics (12.5x), and HR labor hours saved.",
        responses: {
          "200": { description: "QSLP commercial KPIs retrieved" }
        }
      }
    },
    "/api/identity/waterfall/verify": {
      post: {
        tags: ["Identity Waterfall (Prove + Socure)"],
        summary: "Execute Tiered Identity Waterfall Verification",
        description: "Orchestrates carrier lookup (Prove) with automated middleware fallback to Socure RiskOS (ID+ and Sigma Fraud 3.0) and DocV step-up.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userData: {
                    type: "object",
                    properties: {
                      phoneNumber: { type: "string", example: "+12149078770" },
                      firstName: { type: "string", example: "Alex" },
                      lastName: { type: "string", example: "Morgan" },
                      dateOfBirth: { type: "string", example: "1994-06-12" },
                      ssnLast4: { type: "string", example: "4819" },
                      address: {
                        type: "object",
                        properties: {
                          street: { type: "string", example: "123 Market St" },
                          city: { type: "string", example: "San Francisco" },
                          state: { type: "string", example: "CA" },
                          postalCode: { type: "string", example: "94105" }
                        }
                      }
                    }
                  },
                  scenarioOverride: {
                    type: "string",
                    enum: ["PROVE_MATCH", "SOCURE_RESCUE", "SYNTHETIC_FRAUD", "DOCV_STEPUP"],
                    example: "SOCURE_RESCUE"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Waterfall routing decision and enrichment telemetry"
          }
        }
      }
    },
    "/api/identity/waterfall/evaluation/{evalId}": {
      get: {
        tags: ["Identity Waterfall (Prove + Socure)"],
        summary: "Get Live Socure RiskOS Evaluation Status",
        description: "Polls live evaluation session state directly from Socure RiskOS Sandbox API by eval_id.",
        parameters: [
          {
            name: "evalId",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "ce82f0e7-1b52-4586-b9f6-1aaba1726526"
          }
        ],
        responses: {
          "200": { description: "Live evaluation record" }
        }
      }
    },
    "/api/identity/waterfall/docv-complete": {
      post: {
        tags: ["Identity Waterfall (Prove + Socure)"],
        summary: "Finalize DocV ID Scan & Biometric Verification",
        description: "Completes the 2-step government photo ID scan and 3D selfie biometric match verification, unlocking the Spinwheel Debt Profile.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["evalId"],
                properties: {
                  evalId: { type: "string", example: "eval_docv_17866" },
                  passed: { type: "boolean", example: true }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "DocV verification completed" }
        }
      }
    },
    "/api/identity/waterfall/kpis": {
      get: {
        tags: ["Identity Waterfall (Prove + Socure)"],
        summary: "Get Identity Waterfall TCO & Pass Rate Metrics",
        description: "Returns TCO metrics: $0.00 KBA spend (100% retired), +37% failure bucket recovery, and $0.38 blended cost per user.",
        responses: {
          "200": { description: "Identity waterfall KPIs" }
        }
      }
    },
    "/api/copilot/analyze": {
      post: {
        tags: ["Agentic Debt Co-Pilot"],
        summary: "Generate Comprehensive Financial Health Analysis",
        description: "Analyzes user's debt liabilities against liquid checking balances and generates optimized payoff recommendations (Avalanche, Snowball, Balance Transfer Arbitrage).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string", example: "c3cf91d9-21c8-413c-82bf-286d6e05593e" },
                  checkingBalance: { type: "number", example: 350.00 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Analysis and strategy projections" }
        }
      }
    },
    "/api/copilot/chat": {
      post: {
        tags: ["Agentic Debt Co-Pilot"],
        summary: "Multi-Turn Conversational Debt Co-Pilot Advisor",
        description: "Interactive AI financial advisor providing mathematical optimization, payment dispatch actions, and payoff timeline guidance with conversation memory.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "message"],
                properties: {
                  userId: { type: "string", example: "c3cf91d9-21c8-413c-82bf-286d6e05593e" },
                  message: { type: "string", example: "How can I save the most interest on my Chase Freedom card?" },
                  conversationHistory: { type: "array", items: { type: "object" } }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Co-Pilot response message and actions" }
        }
      }
    },
    "/api/copilot/simulate": {
      post: {
        tags: ["Agentic Debt Co-Pilot"],
        summary: "Simulate Debt Payoff Strategies Instantly",
        description: "Simulates Debt Avalanche, Debt Snowball, and 0% Balance Transfer Arbitrage based on extra monthly contribution amount.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string", example: "c3cf91d9-21c8-413c-82bf-286d6e05593e" },
                  extraMonthlyAmount: { type: "number", example: 200.00 },
                  checkingBalance: { type: "number", example: 350.00 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Payoff simulation schedules and interest savings" }
        }
      }
    },
    "/api/connect-user": {
      post: {
        tags: ["Authentication & Connect"],
        summary: "Initiate Frictionless SMS Connect Flow",
        description: "Takes user phone number and date of birth, connects to carrier lookup, and dispatches a 6-digit OTP code.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phoneNumber", "dateOfBirth"],
                properties: {
                  phoneNumber: { type: "string", example: "+12149078770" },
                  dateOfBirth: { type: "string", example: "1988-11-14" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "User connected and OTP sent" }
        }
      }
    },
    "/api/verify-user": {
      post: {
        tags: ["Authentication & Connect"],
        summary: "Verify OTP Code and Retrieve Profile",
        description: "Verifies the 6-digit OTP SMS code and returns the verified user identity profile.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "code"],
                properties: {
                  userId: { type: "string", example: "usr_mock_12345" },
                  code: { type: "string", example: "123456" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "User verified successfully" }
        }
      }
    },
    "/api/users/{userId}/debt-profile": {
      post: {
        tags: ["Debt Profile & Liabilities"],
        summary: "Fetch User Debt Profile & Tradelines",
        description: "Fetches user's credit profile (VantageScore 3.0), credit card accounts, auto loans, and student loan balances.",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "c3cf91d9-21c8-413c-82bf-286d6e05593e"
          }
        ],
        responses: {
          "200": { description: "Normalized debt profile" }
        }
      }
    },
    "/api/balance-transfer/connect-preverified": {
      post: {
        tags: ["Instant Balance Transfer"],
        summary: "Connect Pre-Verified User for Balance Transfer",
        description: "Initiates balance transfer flow for an applicant who has already completed carrier authentication.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phoneNumber", "dateOfBirth"],
                properties: {
                  phoneNumber: { type: "string", example: "+12149078770" },
                  dateOfBirth: { type: "string", example: "1988-11-14" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Pre-verified session established" }
        }
      }
    },
    "/api/balance-transfer/liabilities": {
      post: {
        tags: ["Instant Balance Transfer"],
        summary: "Get Eligible Liabilities for Balance Transfer",
        description: "Retrieves credit card liabilities with APR and balance transfer quote eligibility.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId"],
                properties: {
                  userId: { type: "string", example: "c3cf91d9-21c8-413c-82bf-286d6e05593e" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Eligible credit liabilities returned" }
        }
      }
    },
    "/api/balance-transfer/submit": {
      post: {
        tags: ["Instant Balance Transfer"],
        summary: "Submit Balance Transfer Request",
        description: "Submits selected liability transfer requests to the receiving credit issuer.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "transfers"],
                properties: {
                  userId: { type: "string", example: "c3cf91d9-21c8-413c-82bf-286d6e05593e" },
                  transfers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sourceLiabilityId: { type: "string", example: "liab_chase_01" },
                        transferAmount: { type: "number", example: 2500.00 },
                        destinationCardId: { type: "string", example: "card_citi_simplicity_02" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Balance transfer submitted" }
        }
      }
    },
    "/api/health": {
      get: {
        tags: ["System & Health"],
        summary: "Server Health Check",
        description: "Returns current server operational status and timestamp.",
        responses: {
          "200": {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "healthy" },
                    timestamp: { type: "string", example: "2026-08-13T21:45:00.000Z" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/docs/openapi.json": {
      get: {
        tags: ["System & Health"],
        summary: "Get OpenAPI 3.0 JSON Specification",
        description: "Returns the raw OpenAPI 3.0.3 specification JSON file for importing into Postman, Insomnia, or Swagger UI.",
        responses: {
          "200": { description: "OpenAPI JSON specification" }
        }
      }
    }
  }
};
