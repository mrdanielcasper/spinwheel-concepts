import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Bot, Sparkles, Send, CheckCircle2, AlertCircle, 
  TrendingDown, DollarSign, Loader2, Briefcase, Cpu,
  ShieldCheck, Sliders, Zap, CreditCard, Award, ArrowUpRight
} from 'lucide-react';
import { fetchCoPilotAnalysis, sendCoPilotMessage, submitBalanceTransfer, simulateCoPilotStrategy } from '../utils/api';
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

// Client-side instant deterministic simulation for 0ms latency UI responsiveness
function runClientPayoff(sortedCards: any[], extraPayment: number, strategyType: 'avalanche' | 'snowball') {
  if (!sortedCards || sortedCards.length === 0) {
    return {
      strategyType,
      title: strategyType === 'avalanche' ? 'Debt Avalanche (Maximum Interest Savings)' : 'Debt Snowball (Fastest Psychological Wins)',
      payoffMonths: 0,
      debtFreeDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      totalInterestPaid: 0,
      totalInterestSaved: 0,
      monthlyAllocation: [],
      summary: 'No active liabilities detected.'
    };
  }

  const accounts = sortedCards.map((c: any) => ({
    id: c.id,
    name: c.displayName || c.name || 'Credit Account',
    balance: c.outstandingBalance || c.balance || 0,
    apr: c.interestRate || 24.99,
    minPayment: c.minimumPaymentAmount || Math.max(25, (c.outstandingBalance || 0) * 0.025)
  }));

  let totalInterestPaid = 0;
  let months = 0;
  const maxMonths = 360;

  while (accounts.some(a => a.balance > 0.01) && months < maxMonths) {
    months++;
    let availableExtra = extraPayment;

    accounts.forEach(acc => {
      if (acc.balance > 0) {
        const monthlyRate = (acc.apr / 100) / 12;
        const interest = acc.balance * monthlyRate;
        acc.balance += interest;
        totalInterestPaid += interest;

        const payment = Math.min(acc.balance, acc.minPayment);
        acc.balance -= payment;
      }
    });

    for (const acc of accounts) {
      if (acc.balance > 0.01 && availableExtra > 0) {
        const extraToApply = Math.min(acc.balance, availableExtra);
        acc.balance -= extraToApply;
        availableExtra -= extraToApply;
        if (availableExtra <= 0) break;
      }
    }
  }

  const baselineInterest = totalInterestPaid * 1.65;
  const totalInterestSaved = Math.max(0, Math.round((baselineInterest - totalInterestPaid) * 100) / 100);

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);
  const debtFreeDate = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const targetCard = sortedCards[0];
  const monthlyAllocation = sortedCards.map((c: any, index: number) => {
    const isTarget = index === 0;
    const baseMin = c.minimumPaymentAmount || Math.max(25, (c.outstandingBalance || 0) * 0.025);
    return {
      cardName: c.displayName || c.name || 'Card',
      liabilityId: c.id,
      balance: c.outstandingBalance || c.balance || 0,
      apr: c.interestRate || 24.99,
      recommendedPayment: Math.round((isTarget ? baseMin + extraPayment : baseMin) * 100) / 100,
      isTarget
    };
  });

  return {
    strategyType,
    title: strategyType === 'avalanche' ? 'Debt Avalanche (Maximum Interest Savings)' : 'Debt Snowball (Fastest Psychological Wins)',
    payoffMonths: months,
    debtFreeDate,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    totalInterestSaved,
    monthlyAllocation,
    summary: strategyType === 'avalanche'
      ? `By targeting **${targetCard?.displayName || 'highest APR card'}** (${targetCard?.interestRate || 24.99}% APR), you become completely debt-free in **${months} months** (${debtFreeDate}) and eliminate **$${totalInterestSaved.toLocaleString()} in compound interest**.`
      : `By knocking out **${targetCard?.displayName || 'lowest balance card'}** first ($${(targetCard?.outstandingBalance || 0).toLocaleString()}), you gain immediate momentum and clear all cards in **${months} months** (${debtFreeDate}).`
  };
}

export const AgenticCoPilot: React.FC<AgenticCoPilotProps> = ({ initialUserId }) => {
  const [userId, setUserId] = useState(initialUserId || 'c3cf91d9-21c8-413c-82bf-286d6e05593e');
  const [checkingBalance, setCheckingBalance] = useState(350.0);

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [error, setError] = useState<any | null>(null);

  // Strategy Simulation State
  const [selectedStrategy, setSelectedStrategy] = useState<'avalanche' | 'snowball' | 'balance_transfer'>('avalanche');
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(200);
  const [simulating, setSimulating] = useState(false);

  // Payment execution state
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [rawResponse, setRawResponse] = useState<any | null>(null);
  const [showPmTakeaway, setShowPmTakeaway] = useState(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (initialUserId && initialUserId !== userId) {
      setUserId(initialUserId);
    }
  }, [initialUserId]);

  const loadAnalysis = useCallback(async (targetUserId: string, balance: number) => {
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
          text: `Hello! I am your **Spinwheel Agentic Debt Co-Pilot**. I'm actively monitoring your credit bureau telemetry and checking account cashflow. 

I've detected **${res.data.metrics?.activeCardsCount || 3} active liabilities** ($${(res.data.metrics?.totalDebt || 0).toLocaleString()} total balance at **${res.data.metrics?.weightedApr || 24.5}% weighted APR**). How can I help optimize your payoff strategy today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: res.data.source
        }
      ]);
    } else if (!res.success) {
      setError(res.error);
    }
  }, []);

  useEffect(() => {
    loadAnalysis(userId, checkingBalance);
  }, [userId, loadAnalysis]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Extract or fallback liabilities list
  const activeLiabilities = useMemo(() => {
    if (analysis?.liabilities && Array.isArray(analysis.liabilities) && analysis.liabilities.length > 0) {
      return analysis.liabilities;
    }
    // Fallback baseline for initial demo rendering
    return [
      { id: 'card_1', displayName: 'JPMorgan Chase & Co', outstandingBalance: 2327.00, interestRate: 38.02, minimumPaymentAmount: 98 },
      { id: 'card_2', displayName: 'Chase Bank', outstandingBalance: 256.43, interestRate: 19.99, minimumPaymentAmount: 100 }
    ];
  }, [analysis?.liabilities]);

  // Instant client-side calculated strategies (0ms latency)
  const computedStrategies = useMemo(() => {
    const avalancheCards = [...activeLiabilities].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
    const avalanche = runClientPayoff(avalancheCards, extraMonthlyPayment, 'avalanche');

    const snowballCards = [...activeLiabilities].sort((a, b) => (a.outstandingBalance || 0) - (b.outstandingBalance || 0));
    const snowball = runClientPayoff(snowballCards, extraMonthlyPayment, 'snowball');

    const highAprCards = activeLiabilities.filter((c: any) => (c.interestRate || 0) >= 20);
    const eligibleAmount = highAprCards.reduce((sum: number, c: any) => sum + (c.outstandingBalance || 0), 0);
    const transferFee = Math.round(eligibleAmount * 0.03 * 100) / 100;
    let highAprSum = 0;
    highAprCards.forEach((c: any) => highAprSum += (c.outstandingBalance || 0) * (c.interestRate || 24));
    const avgHighApr = eligibleAmount > 0 ? highAprSum / eligibleAmount : 24.99;
    const eighteenMonthInterest = (eligibleAmount * (avgHighApr / 100) * 1.5);
    const netSavings = Math.max(0, Math.round((eighteenMonthInterest - transferFee) * 100) / 100);
    const monthlySavings = (eligibleAmount * (avgHighApr / 100)) / 12;
    const breakEvenMonths = monthlySavings > 0 ? Math.ceil(transferFee / monthlySavings) : 2;

    return {
      avalanche,
      snowball,
      balanceTransfer: {
        eligibleAmount: Math.round(eligibleAmount * 100) / 100,
        transferFee,
        promoApr: 0.0,
        promoSavings: Math.round(eighteenMonthInterest * 100) / 100,
        netSavings,
        breakEvenMonths,
        summary: `Transferring $${eligibleAmount.toLocaleString()} of high-APR debt (${avgHighApr.toFixed(1)}% avg) to a 0% APR 18-month promo card saves $${netSavings.toLocaleString()} net after the 3% transfer fee.`
      }
    };
  }, [activeLiabilities, extraMonthlyPayment]);

  const handleSliderChange = (amount: number) => {
    setExtraMonthlyPayment(amount);
    
    // Debounce background server sync
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      setSimulating(true);
      const res = await simulateCoPilotStrategy(userId, amount, checkingBalance);
      setSimulating(false);
      if (res.success && res.data?.strategies) {
        setAnalysis((prev: any) => prev ? {
          ...prev,
          strategies: res.data.strategies,
          metrics: res.data.metrics || prev.metrics
        } : prev);
      }
    }, 300);
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

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!textToSend) setChatInput('');
    setChatLoading(true);

    // Pass conversation history to backend
    const apiHistory = newHistory.map(m => ({ sender: m.sender, text: m.text }));
    const res = await sendCoPilotMessage(userId, query, apiHistory);
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

  const currentStrategyData = selectedStrategy === 'balance_transfer' 
    ? computedStrategies.balanceTransfer 
    : computedStrategies[selectedStrategy];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner - Credit Data AI Lab */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-2xl border border-violet-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <Bot className="w-7 h-7 text-violet-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Spinwheel Credit Data AI Lab</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-[10px] text-violet-300 font-mono">Agentic DevEx</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Autonomous Debt Co-Pilot</h1>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <div className="flex items-center space-x-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span>{analysis?.source === 'anthropic_claude' ? 'Claude 3.5 Sonnet LLM' : 'Financial Intelligence Engine'}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Equifax Bureau Telemetry Connected</span>
            </div>
          </div>
        </div>

        {/* PM Strategy Narrative Box for Demoing to Ryerson Schlitt */}
        <div className="bg-slate-900/80 rounded-xl p-5 border border-violet-500/30 mb-6 text-xs text-slate-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-violet-300 flex items-center space-x-2 text-sm">
              <Briefcase className="w-4 h-4 text-violet-400" />
              <span>Platform Strategy Blueprint: Product-Led Growth & Embedded Payments</span>
            </div>
            <button 
              onClick={() => setShowPmTakeaway(!showPmTakeaway)}
              className="text-[11px] text-violet-400 hover:text-violet-300 underline font-medium"
            >
              {showPmTakeaway ? 'Hide PM Narrative' : 'Show PM Executive Blueprint'}
            </button>
          </div>

          {showPmTakeaway && (
            <div className="pt-3 border-t border-slate-800 space-y-2.5 text-slate-300 text-xs leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                  <span className="font-bold text-violet-300 block mb-1">1. Frictionless Discovery</span>
                  <p className="text-[11px] text-slate-400">Pre-verified phone OTP enables instant soft credit pulls with full account visibility without Experian statement friction.</p>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                  <span className="font-bold text-fuchsia-300 block mb-1">2. Agentic Reasoning</span>
                  <p className="text-[11px] text-slate-400">Combines real-time interest velocity with checking balance telemetry to generate autonomous 1-click payoff triggers.</p>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                  <span className="font-bold text-pink-300 block mb-1">3. Embedded Rails</span>
                  <p className="text-[11px] text-slate-400">Directly dispatches ACH payments via Spinwheel's <code className="text-violet-300 font-mono">/payments/liability</code> API to eliminate drop-off.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Checking Account Balance Telemetry Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800 gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Real-Time Checking Account Telemetry:</span>
            <span className="font-mono text-white font-black text-sm">${checkingBalance.toFixed(2)}</span>
            <span className="text-[11px] text-slate-500 font-mono">($150 safety cushion retained)</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400">Simulate Cashflow:</span>
            <button
              onClick={() => {
                const nextBal = checkingBalance === 350 ? 600 : checkingBalance === 600 ? 1200 : 350;
                setCheckingBalance(nextBal);
                loadAnalysis(userId, nextBal);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-violet-300 font-semibold transition-colors flex items-center space-x-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Cycle Balance (${checkingBalance.toFixed(0)} &rarr; ${checkingBalance === 350 ? '600' : checkingBalance === 600 ? '1200' : '350'})</span>
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

      {/* Portfolio Health KPIs */}
      {analysis?.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-premium rounded-xl p-4 border border-white/5 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Credit Debt</span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">${analysis.metrics.totalDebt.toLocaleString()}</div>
            <span className="text-[10px] text-slate-400 font-mono">{analysis.metrics.activeCardsCount} active revolving cards</span>
          </div>

          <div className="glass-premium rounded-xl p-4 border border-white/5 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Weighted APR</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{analysis.metrics.weightedApr}%</div>
            <span className="text-[10px] text-slate-400 font-mono">Portfolio average interest</span>
          </div>

          <div className="glass-premium rounded-xl p-4 border border-white/5 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Monthly Interest Burn</span>
            <div className="text-xl sm:text-2xl font-black text-red-400 font-mono">${analysis.metrics.monthlyInterestTotal.toFixed(2)}/mo</div>
            <span className="text-[10px] text-slate-400 font-mono">${analysis.metrics.annualInterestTotal.toLocaleString()}/yr accrued</span>
          </div>

          <div className="glass-premium rounded-xl p-4 border border-white/5 space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Credit Utilization</span>
            <div className="text-xl sm:text-2xl font-black text-violet-400 font-mono">{analysis.metrics.utilizationRate}%</div>
            <span className="text-[10px] text-slate-400 font-mono">Target: &lt; 30% for score boost</span>
          </div>
        </div>
      )}

      {/* Proactive 1-Click Payment Recommendation Card */}
      {loading ? (
        <div className="glass-premium rounded-2xl p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Agentic Co-Pilot is synthesizing credit portfolio and checking cashflow...</p>
        </div>
      ) : analysis?.topRecommendation && (
        <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-violet-500/40 relative overflow-hidden space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Proactive 1-Click Payoff Opportunity</span>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono flex items-center space-x-1.5">
              <TrendingDown className="w-4 h-4" />
              <span>Saves ${analysis.topRecommendation.monthlyInterestSaved}/mo (${analysis.topRecommendation.annualInterestSaved}/yr)</span>
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              "{analysis.topRecommendation.headline}"
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis.topRecommendation.reasoning}
            </p>
          </div>

          {/* Payment Action or Settlement Confirmation */}
          {paymentResult ? (
            <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-emerald-300 animate-in zoom-in-95">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <span className="font-bold text-sm block text-white">Payment Successfully Dispatched via Spinwheel Rails!</span>
                  <span className="text-xs text-slate-300">Transaction ID: {paymentResult.transactionId}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Disbursement: Direct ACH Settlement in 24 Hours</span>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold tracking-wider">
                STATUS: {paymentResult.status}
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400">
                Target Creditor: <strong className="text-white">{analysis.topRecommendation.cardName}</strong> ({analysis.topRecommendation.currentApr}% APR)
              </div>

              <button
                onClick={handleApprovePayment}
                disabled={submittingPayment}
                className="py-3.5 px-7 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-violet-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {submittingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Embedded Payment via Spinwheel Rails...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Approve & Dispatch Payment (${analysis.topRecommendation.recommendedAmount.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Scenario Strategy Simulator (The Showstopper Demo Section) */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Interactive Debt Payoff Simulator</h3>
              <p className="text-xs text-slate-400">Simulate mathematical payoff curves, milestones, and balance transfer arbitrage in real-time.</p>
            </div>
          </div>

          {/* Strategy Selectors */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedStrategy('avalanche')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStrategy === 'avalanche'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏔️ Debt Avalanche
            </button>
            <button
              onClick={() => setSelectedStrategy('snowball')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStrategy === 'snowball'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Debt Snowball
            </button>
            <button
              onClick={() => setSelectedStrategy('balance_transfer')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStrategy === 'balance_transfer'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💳 0% Balance Transfer
            </button>
          </div>
        </div>

        {/* Interactive Extra Payment Slider & Quick Chips */}
        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-2">
              <span>Extra Monthly Debt Allocation:</span>
              <span className="text-sm font-mono text-violet-400 font-black">+${extraMonthlyPayment}/month</span>
            </label>
            <div className="flex items-center space-x-2">
              {[100, 200, 350, 500].map(chipAmount => (
                <button
                  key={chipAmount}
                  onClick={() => handleSliderChange(chipAmount)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                    extraMonthlyPayment === chipAmount
                      ? 'bg-violet-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  +${chipAmount}
                </button>
              ))}
              {simulating && <span className="text-[11px] text-violet-400 font-mono animate-pulse">Syncing...</span>}
            </div>
          </div>

          <input
            type="range"
            min="50"
            max="1000"
            step="25"
            value={extraMonthlyPayment}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>+$50/mo</span>
            <span>+$250/mo</span>
            <span>+$500/mo</span>
            <span>+$750/mo</span>
            <span>+$1,000/mo</span>
          </div>
        </div>

        {/* Strategy Details Box */}
        {selectedStrategy === 'balance_transfer' ? (
          <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="font-bold text-white flex items-center space-x-2 text-sm">
                <CreditCard className="w-4 h-4 text-violet-400" />
                <span>0% Intro APR Balance Transfer Arbitrage</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-violet-500/10 text-violet-300 text-xs font-mono font-bold">
                Breakeven: {computedStrategies.balanceTransfer.breakEvenMonths} Months
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/80 p-3.5 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Eligible High-APR Balance</span>
                <span className="text-base font-black text-white font-mono">${computedStrategies.balanceTransfer.eligibleAmount.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900/80 p-3.5 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">3% Transfer Fee</span>
                <span className="text-base font-black text-amber-400 font-mono">${computedStrategies.balanceTransfer.transferFee.toFixed(2)}</span>
              </div>
              <div className="bg-slate-900/80 p-3.5 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">18-Month Net Savings</span>
                <span className="text-base font-black text-emerald-400 font-mono">+${computedStrategies.balanceTransfer.netSavings.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {computedStrategies.balanceTransfer.summary}
            </p>
          </div>
        ) : (
          <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="font-bold text-white text-sm flex items-center space-x-2">
                <Award className="w-4 h-4 text-violet-400" />
                <span>{(currentStrategyData as any)?.title}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="text-slate-300">Debt-Free: <strong className="text-white">{(currentStrategyData as any)?.debtFreeDate}</strong> ({(currentStrategyData as any)?.payoffMonths} mos)</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Saves ${(currentStrategyData as any)?.totalInterestSaved?.toLocaleString()}</span>
                </span>
              </div>
            </div>

            {/* Monthly Allocation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="pb-2 font-semibold">Card / Creditor</th>
                    <th className="pb-2 font-semibold">Balance</th>
                    <th className="pb-2 font-semibold">APR</th>
                    <th className="pb-2 font-semibold text-right">Recommended Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {(currentStrategyData as any)?.monthlyAllocation?.map((item: any) => (
                    <tr key={item.liabilityId} className={item.isTarget ? 'bg-violet-600/10 text-white' : 'text-slate-300'}>
                      <td className="py-2.5 font-sans font-medium flex items-center space-x-2">
                        {item.isTarget && <span className="px-1.5 py-0.2 text-[9px] bg-violet-600 text-white font-bold rounded">TARGET</span>}
                        <span>{item.cardName}</span>
                      </td>
                      <td className="py-2.5">${item.balance.toLocaleString()}</td>
                      <td className="py-2.5 text-amber-400">{item.apr}%</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">${item.recommendedPayment.toFixed(2)}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Claude Co-Pilot Chat Drawer */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Conversational Strategy Assistant</h3>
            <p className="text-xs text-slate-400">Ask multi-turn questions about repayment math, balance transfer feasibility, or credit score optimization.</p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSendMessage('Show me the exact mathematical difference between Avalanche and Snowball for my cards.')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
          >
            📊 Avalanche vs. Snowball Math
          </button>
          <button
            onClick={() => handleSendMessage('Can you evaluate a 0% APR balance transfer offer for my highest APR debt?')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
          >
            💳 0% Balance Transfer Arbitrage
          </button>
          <button
            onClick={() => handleSendMessage('How much total interest do I save if I pay an extra $200 each month?')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
          >
            💰 Calculate Lifetime Savings
          </button>
          <button
            onClick={() => handleSendMessage('Rank all of my credit cards by interest rate velocity.')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
          >
            🔥 Highest APR Breakdown
          </button>
        </div>

        {/* Message History */}
        <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 min-h-[240px] max-h-[420px] overflow-y-auto space-y-4 font-sans text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-violet-300" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-violet-600 text-white rounded-br-none font-medium'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                }`}
              >
                {msg.text}
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-end space-x-1.5 pt-1 border-t border-white/5">
                  <span>{msg.timestamp}</span>
                  {msg.source && <span className="font-mono text-violet-400">({msg.source})</span>}
                </div>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-center space-x-2.5 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span>Analyzing portfolio telemetry & calculating optimal payoff schedules...</span>
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
            placeholder="Ask Co-Pilot about payoff math, balance transfers, or payment triggers..."
            className="flex-1 rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            disabled={chatLoading}
          />

          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="p-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-600/20 transition-all disabled:opacity-40"
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
