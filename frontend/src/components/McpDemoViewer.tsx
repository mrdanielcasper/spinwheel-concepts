import React, { useState } from 'react';
import { 
  Server, Terminal, Copy, Check, Play, Cpu, 
  Code2, Zap, Briefcase, FileCode2, Layers
} from 'lucide-react';
import { fetchDebtProfile, fetchBalanceTransferLiabilities, submitBalanceTransfer } from '../utils/api';
import { DebugPanel } from './DebugPanel';

interface McpDemoViewerProps {
  initialUserId?: string | null;
}

export const McpDemoViewer: React.FC<McpDemoViewerProps> = ({ initialUserId }) => {
  const [userId] = useState(initialUserId || 'c3cf91d9-21c8-413c-82bf-286d6e05593e');
  const [copied, setCopied] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [jsonRpcLog, setJsonRpcLog] = useState<any | null>(null);
  const [showPmTakeaway, setShowPmTakeaway] = useState(false);

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        spinwheel: {
          command: "node",
          args: ["c:\\Users\\Admin\\spinwheel\\backend\\dist\\mcp.js"]
        }
      }
    },
    null,
    2
  );

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(mcpConfigJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunMcpTool = async (toolName: string) => {
    setActiveTool(toolName);
    setExecuting(true);
    setJsonRpcLog(null);

    const requestId = Math.floor(Math.random() * 10000);
    let mockResult: any = null;

    if (toolName === 'get_user_debt_profile') {
      const res = await fetchDebtProfile(userId);
      if (res.success) mockResult = res.data;
      else mockResult = res.error;
    } else if (toolName === 'get_balance_transfer_savings') {
      const res = await fetchBalanceTransferLiabilities(userId);
      if (res.success) mockResult = res.data;
      else mockResult = res.error;
    } else if (toolName === 'execute_liability_payment') {
      const res = await submitBalanceTransfer({
        userId,
        payments: [{ liabilityId: 'l_chase_1001', amountInCents: 15000 }]
      });
      if (res.success) mockResult = res.data;
      else mockResult = res.error;
    }


    setExecuting(false);
    setJsonRpcLog({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: { userId, ...(toolName === 'execute_liability_payment' ? { liabilityId: 'l_chase_1001', amountInCents: 15000 } : {}) }
      },
      id: requestId,
      response: {
        jsonrpc: "2.0",
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(mockResult, null, 2)
            }
          ]
        },
        id: requestId
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner - Model Context Protocol */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-2xl border border-cyan-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-600/15 to-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-violet-600 p-0.5 shadow-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Open AI Standard</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono">Claude Desktop Ready</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Spinwheel MCP Server Protocol</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>backend/dist/mcp.js ACTIVE</span>
          </div>
        </div>

        {/* PM Strategy Callout Box */}
        <div className="bg-slate-900/60 rounded-xl p-4 border border-cyan-500/20 mb-6 text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-cyan-300 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Spinwheel API Blueprint: Model Context Protocol (MCP)</span>
            </div>
            <button 
              onClick={() => setShowPmTakeaway(!showPmTakeaway)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              {showPmTakeaway ? 'Hide PM Narrative' : 'Show PM Narrative Framework'}
            </button>
          </div>

          {showPmTakeaway && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2 text-slate-400 leading-relaxed text-[11px]">
              <p><strong className="text-slate-200">The Strategic Insight:</strong> AI Assistants (Claude Desktop, Cursor, ChatGPT) cannot interact with custom REST APIs unless exposed via standard protocols.</p>
              <p><strong className="text-slate-200">Spinwheel Advantage:</strong> Exposing Spinwheel as an MCP server turns Spinwheel into the default financial infrastructure layer for the entire AI agent ecosystem.</p>
              <p><strong className="text-slate-200">Claude Desktop Ready:</strong> Connects natively over <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">stdio</code> transport without needing proxy middleware.</p>
            </div>
          )}
        </div>

        {/* User ID Selector */}
        <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
          <span className="text-slate-400">Target Sandbox User ID:</span>
          <span className="font-mono text-white font-bold">{userId}</span>
        </div>
      </div>

      {/* Claude Desktop Config Snippet Card */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span>Claude Desktop Configuration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Add to <code className="text-cyan-300 font-mono bg-slate-900 px-1 py-0.5 rounded">%APPDATA%\Claude\claude_desktop_config.json</code>
            </p>
          </div>

          <button
            onClick={handleCopyConfig}
            className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center space-x-1.5 transition-all self-start sm:self-auto"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON Config</span>
              </>
            )}
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs text-cyan-300 overflow-x-auto">
          {mcpConfigJson}
        </pre>
      </div>

      {/* Registered MCP Tools Directory */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Registered MCP Protocol Tools</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Click any tool below to simulate an interactive JSON-RPC 2.0 tool execution over stdio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Tool 1 */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <Layers className="w-4 h-4 text-violet-400" />
                <h4 className="font-mono font-bold text-xs text-white">get_user_debt_profile</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Fetches credit scores, Vantage model, and full liability details for a user.
              </p>
            </div>
            <button
              onClick={() => handleRunMcpTool('get_user_debt_profile')}
              disabled={executing}
              className="w-full py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center justify-center space-x-1 transition-all"
            >
              <Play className="w-3 h-3 fill-cyan-400 text-cyan-400" />
              <span>Test MCP Call</span>
            </button>
          </div>

          {/* Tool 2 */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <Code2 className="w-4 h-4 text-fuchsia-400" />
                <h4 className="font-mono font-bold text-xs text-white">get_balance_transfer_savings</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Computes high-interest card APRs and calculated 0% Intro APR net savings.
              </p>
            </div>
            <button
              onClick={() => handleRunMcpTool('get_balance_transfer_savings')}
              disabled={executing}
              className="w-full py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center justify-center space-x-1 transition-all"
            >
              <Play className="w-3 h-3 fill-cyan-400 text-cyan-400" />
              <span>Test MCP Call</span>
            </button>
          </div>

          {/* Tool 3 */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h4 className="font-mono font-bold text-xs text-white">execute_liability_payment</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dispatches ACH payments to creditor accounts via Spinwheel Payment Request API.
              </p>
            </div>
            <button
              onClick={() => handleRunMcpTool('execute_liability_payment')}
              disabled={executing}
              className="w-full py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center justify-center space-x-1 transition-all"
            >
              <Play className="w-3 h-3 fill-cyan-400 text-cyan-400" />
              <span>Test MCP Call</span>
            </button>
          </div>

        </div>

        {/* Live JSON-RPC Log Output */}
        {jsonRpcLog && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center space-x-1.5 text-cyan-300 font-bold">
                <Terminal className="w-4 h-4" />
                <span>JSON-RPC 2.0 Response ({activeTool})</span>
              </span>
              <span>id: {jsonRpcLog.id}</span>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-80">
              {JSON.stringify(jsonRpcLog, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Collapsible Debug Panel */}
      <DebugPanel rawResponse={jsonRpcLog} />
    </div>
  );
};
