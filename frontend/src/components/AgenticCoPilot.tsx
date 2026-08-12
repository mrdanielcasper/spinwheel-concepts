import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Sparkles, Send, CheckCircle2, AlertCircle, 
  TrendingDown, DollarSign, Loader2, Briefcase, Cpu
} from 'lucide-react';
import { fetchCoPilotAnalysis, sendCoPilotMessage, submitBalanceTransfer } from '../utils/api';
import { DebugPanel } from './DebugPanel';

interface AgenticCoPilotProps {
  initialUserId?: string | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
}

export const AgenticCoPilot: React.FC<AgenticCoPilotProps> = ({ initialUserId }) => {
  const [userId] = useState(initialUserId || 'c3cf91d9-21c8-413c-82bf-286d6e05593e');
  const [checkingBalance, setCheckingBalance] = useState(350.0);

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [error, setError] = useState<any | null>(null);

  // Payment execution state
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [rawResponse, setRawResponse] = useState<any | null>(null);
  const [showPmTakeaway, setShowPmTakeaway] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAnalysis(userId, checkingBalance);
  }, [userId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const loadAnalysis = async (targetUserId: string, balance: number) => {
    setLoading(true);
    setError(null);

    const res = await fetchCoPilotAnalysis(targetUserId, balance);
    setRawResponse(res);
    setLoading(false);

    if (res.success && res.data) {
      setAnalysis(res.data);
      // Seed welcome chat message
      setMessages([
        {
          id: 'welcome_msg',
          sender: 'assistant',
          text: `Hello! I am your **Spinwheel Agentic Debt Co-Pilot**. I'm actively monitoring your credit profile and checking balance. How can I help optimize your debt payoff today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: res.data.source
        }
      ]);
    } else if (!res.success) {
      setError(res.error);
    }
  };

  const handleApprovePayment = async () => {
    if (!analysis?.topRecommendation) return;
    const rec = analysis.topRecommendation;

    setSubmittingPayment(true);
    setError(null);

    const res = await submitBalanceTransfer({
      userId,
      payments: [
        {
          liabilityId: rec.liabilityId,
          amountInCents: rec.recommendedAmountInCents,
          payoffQuoteId: rec.payoffQuoteId
        }
      ]
    });

    setRawResponse(res);
    setSubmittingPayment(false);

    if (res.success && res.data) {
      setPaymentResult(res.data);
    } else if (!res.success) {
      setError(res.error);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || chatInput.trim();
    if (!query || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);

    const res = await sendCoPilotMessage(userId, query);
    setRawResponse(res);
    setChatLoading(false);

    if (res.success && res.data) {
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: res.data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: res.data.source
      };
      setMessages((prev) => [...prev, botMsg]);
    } else if (!res.success) {
      setError(res.error);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner - Credit Data AI Lab */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-2xl border border-violet-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 p-0.5 shadow-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Spinwheel Credit Data AI Lab</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-[10px] text-violet-300 font-mono">Autonomous Co-Pilot</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Agentic Debt Co-Pilot</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>{analysis?.source === 'anthropic_claude' ? 'Anthropic Claude LLM' : 'AI Optimization Engine'}</span>
          </div>
        </div>

        {/* PM Strategy Narrative Box */}
        <div className="bg-slate-900/60 rounded-xl p-4 border border-violet-500/20 mb-6 text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-violet-300 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-violet-400" />
              <span>Spinwheel API Blueprint: Agentic AI Co-Pilot</span>
            </div>
            <button 
              onClick={() => setShowPmTakeaway(!showPmTakeaway)}
              className="text-[11px] text-violet-400 hover:text-violet-300 underline font-medium"
            >
              {showPmTakeaway ? 'Hide PM Narrative' : 'Show PM Narrative Framework'}
            </button>
          </div>

          {showPmTakeaway && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2 text-slate-400 leading-relaxed text-[11px]">
              <p><strong className="text-slate-200">The Problem:</strong> Consumers lack real-time visibility into compound interest loss and drop off when manually creating payment orders.</p>
              <p><strong className="text-slate-200">Spinwheel Solution:</strong> Combines <code className="text-violet-300 bg-slate-950 px-1 py-0.5 rounded">Debt Profile API</code> recurring telemetry with Anthropic Claude LLM reasoning to output 1-click actionable payment triggers via <code className="text-violet-300 bg-slate-950 px-1 py-0.5 rounded">Embedded Payments API</code>.</p>
              <p><strong className="text-slate-200">Executive Demo Value:</strong> Demonstrates high agency & product empathy aligned directly with Spinwheel's Credit Data AI Lab initiatives!</p>
            </div>
          )}
        </div>

        {/* Checking Account Balance Simulator */}
        <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Subscribed Checking Balance Telemetry:</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-white font-bold text-sm">${checkingBalance.toFixed(2)}</span>
            <button
              onClick={() => {
                const nextBal = checkingBalance === 350 ? 600 : 350;
                setCheckingBalance(nextBal);
                loadAnalysis(userId, nextBal);
              }}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-violet-300 transition-colors"
            >
              Toggle Balance ($350 vs $600)
            </button>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-200">{error.code || 'Error'}</h4>
            <p className="mt-1 text-xs text-red-300/90">{error.message || 'An error occurred during co-pilot analysis.'}</p>
          </div>
        </div>
      )}

      {/* Proactive Agent Alert Recommendation Card */}
      {loading ? (
        <div className="glass-premium rounded-2xl p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Agentic Co-Pilot is analyzing credit profile and checking telemetry...</p>
        </div>
      ) : analysis?.topRecommendation && (
        <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-violet-500/40 relative overflow-hidden space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Proactive Agentic Opportunity</span>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold font-mono flex items-center space-x-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Saves ${analysis.topRecommendation.monthlyInterestSaved}/mo</span>
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white leading-relaxed">
              "{analysis.topRecommendation.headline}"
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis.topRecommendation.reasoning}
            </p>
          </div>

          {/* Payment Action or Settlement Confirmation */}
          {paymentResult ? (
            <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between text-xs font-mono text-emerald-300 animate-in zoom-in-95">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block text-white">Payment Executed & Settled!</span>
                  <span className="text-[11px] text-slate-300">Transaction ID: {paymentResult.transactionId}</span>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">STATUS: {paymentResult.status}</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400">
                Target: <strong className="text-white">{analysis.topRecommendation.cardName}</strong> ({analysis.topRecommendation.currentApr}% APR)
              </div>

              <button
                onClick={handleApprovePayment}
                disabled={submittingPayment}
                className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-violet-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {submittingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Embedded Payment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Click to Approve Payment (${analysis.topRecommendation.recommendedAmount.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Insights & Interactive Chat Drawer */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Interactive Co-Pilot Assistant</h3>
            <p className="text-xs text-slate-400">Ask questions about debt payoff strategies, interest calculations, or loan consolidation.</p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickPrompt('Compare Debt Avalanche vs Debt Snowball for my active cards.')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 transition-colors"
          >
            📊 Avalanche vs Snowball
          </button>
          <button
            onClick={() => handleQuickPrompt('Which of my credit cards has the highest interest rate?')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 transition-colors"
          >
            🔥 Highest APR Card
          </button>
          <button
            onClick={() => handleQuickPrompt('How much interest can I save if I pay $150 extra each month?')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 transition-colors"
          >
            💰 Calculate 1-Year Savings
          </button>
        </div>

        {/* Message History */}
        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-850 min-h-[220px] max-h-[380px] overflow-y-auto space-y-4 font-sans text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-violet-300" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-violet-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}
                <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-end space-x-1">
                  <span>{msg.timestamp}</span>
                  {msg.source && <span className="font-mono text-violet-400">({msg.source})</span>}
                </div>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span>Claude LLM is thinking...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Chat Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Agentic Co-Pilot a debt question..."
            className="flex-1 rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            disabled={chatLoading}
          />

          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Collapsible Debug Panel */}
      <DebugPanel rawResponse={rawResponse} />
    </div>
  );
};
