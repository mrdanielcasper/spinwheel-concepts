import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { fetchDebtProfile, createLiabilityPayment } from "./client";
import { normalizeDebtProfile, normalizeBalanceTransferLiabilities } from "./mapper";
import { generateCoPilotAnalysis } from "./copilot";

const server = new Server(
  {
    name: "spinwheel-mcp-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

/**
 * Define available Spinwheel MCP Tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_user_debt_profile",
        description: "Fetch real-time credit report, Vantage score, and debt liabilities (credit cards, auto loans, personal loans) for a Spinwheel user.",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "Spinwheel sandbox User ID UUID (e.g. c3cf91d9-21c8-413c-82bf-286d6e05593e)"
            }
          },
          required: ["userId"]
        }
      },
      {
        name: "get_balance_transfer_savings",
        description: "Analyze user credit card liabilities and compute net interest savings under a 0% Intro APR balance transfer offer.",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "Spinwheel sandbox User ID UUID"
            }
          },
          required: ["userId"]
        }
      },
      {
        name: "execute_liability_payment",
        description: "Dispatch an instant payment to a creditor account via Spinwheel's Payment Request API.",
        inputSchema: {
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "Spinwheel sandbox User ID UUID"
            },
            liabilityId: {
              type: "string",
              description: "Target liability account ID"
            },
            amountInCents: {
              type: "number",
              description: "Payment amount in USD cents (e.g. 15000 for $150.00)"
            }
          },
          required: ["userId", "liabilityId", "amountInCents"]
        }
      }
    ]
  };
});

/**
 * Handle MCP Tool Execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const userId = (args?.userId as string) || "c3cf91d9-21c8-413c-82bf-286d6e05593e";

  try {
    if (name === "get_user_debt_profile") {
      const raw = await fetchDebtProfile(userId);
      const normalized = normalizeDebtProfile(raw);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(normalized, null, 2)
          }
        ]
      };
    }

    if (name === "get_balance_transfer_savings") {
      const raw = await fetchDebtProfile(userId);
      const normalized = normalizeDebtProfile(raw);
      const btSavings = normalizeBalanceTransferLiabilities(normalized);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(btSavings, null, 2)
          }
        ]
      };
    }

    if (name === "execute_liability_payment") {
      const liabilityId = (args?.liabilityId as string) || "l_12345";
      const amountInCents = Number(args?.amountInCents) || 15000;

      const result = await createLiabilityPayment({
        userId,
        payments: [
          {
            liabilityId,
            amountInCents,
            payoffQuoteId: `pq_mcp_${liabilityId}_${Date.now()}`
          }
        ]
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.data, null, 2)
          }
        ]
      };
    }

    throw new Error(`Unknown MCP Tool name: ${name}`);
  } catch (err: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Spinwheel MCP Error: ${err.message || String(err)}`
        }
      ]
    };
  }
});

/**
 * Start Stdio Server Transport for Claude Desktop
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Spinwheel MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal Error running Spinwheel MCP Server:", err);
  process.exit(1);
});
