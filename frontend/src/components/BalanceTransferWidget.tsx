import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, Zap, AlertCircle, 
  TrendingDown, Percent, Sparkles, Loader2, Lock, ChevronRight, RefreshCw, Briefcase
} from 'lucide-react';
import { connectPreVerifiedUser, fetchBalanceTransferLiabilities, submitBalanceTransfer } from '../utils/api';
import { DebugPanel } from './DebugPanel';

interface BalanceTransferWidgetProps {
  initialUserId?: string | null;
}

export const BalanceTransferWidget: React.FC<BalanceTransferWidgetProps> = ({ initialUserId }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phoneNumber, setPhoneNumber] = useState('+14155552671');
  const [dateOfBirth, setDateOfBirth] = useState('1998-03-08');
  const [userId, setUserId] = useState(initialUserId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);
  
  const [liabilitiesData, setLiabilitiesData] = useState<any | null>(null);
  const [selectedCards, setSelectedCards] = useState<Record<string, boolean>>({});
  const [transferAmounts, setTransferAmounts] = useState<Record<string, number>>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [rawResponse, setRawResponse] = useState<any | null>(null);
  const [showPmTakeaway, setShowPmTakeaway] = useState(false);

  useEffect(() => {
    if (initialUserId) {
      setUserId(initialUserId);
      loadLiabilities(initialUserId);
    }
  }, [initialUserId]);

  const handlePreVerifiedConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRawResponse(null);

    const res = await connectPreVerifiedUser(phoneNumber.trim(), dateOfBirth.trim());
    setRawResponse(res);
    setLoading(false);

    if (res.success && res.data?.userId) {
      setUserId(res.data.userId);
      await loadLiabilities(res.data.userId);
    } else if (!res.success) {
      setError(res.error);
    }
  };

  const loadLiabilities = async (targetUserId: string) => {
    setLoading(true);
    setError(null);
    const res = await fetchBalanceTransferLiabilities(targetUserId);
    setRawResponse(res);
    setLoading(false);

    if (res.success && res.data) {
      setLiabilitiesData(res.data);
      // Default select all cards
      const initialSelected: Record<string, boolean> = {};
      const initialAmounts: Record<string, number> = {};
      
      (res.data.eligibleCards || []).forEach((card: any) => {
        initialSelected[card.liabilityId] = true;
        initialAmounts[card.liabilityId] = card.outstandingBalance;
      });

      setSelectedCards(initialSelected);
      setTransferAmounts(initialAmounts);
      setStep(2);
    } else if (!res.success) {
      setError(res.error);
    }
  };

  const handleToggleCard = (liabilityId: string) => {
    setSelectedCards((prev) => ({
      ...prev,
      [liabilityId]: !prev[liabilityId]
    }));
  };

  const handleAmountChange = (liabilityId: string, amount: number) => {
    setTransferAmounts((prev) => ({
      ...prev,
      [liabilityId]: Math.max(0, amount)
    }));
  };

  const handleExecuteTransfer = async () => {
    if (!userId || !liabilitiesData) return;

    const paymentsToMake = (liabilitiesData.eligibleCards || [])
      .filter((card: any) => selectedCards[card.liabilityId])
      .map((card: any) => ({
        liabilityId: card.liabilityId,
        amountInCents: Math.round((transferAmounts[card.liabilityId] || card.outstandingBalance) * 100),
        payoffQuoteId: card.payoffQuoteId
      }));

    if (paymentsToMake.length === 0) {
      setError({ message: 'Please select at least one high-interest debt to consolidate.' });
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await submitBalanceTransfer({
      userId,
      payments: paymentsToMake
    });

    setRawResponse(res);
    setSubmitting(false);

    if (res.success && res.data) {
      setSubmissionResult(res.data);
      setStep(3);
    } else if (!res.success) {
      setError(res.error);
    }
  };


  const handleReset = () => {
    setStep(1);
    setLiabilitiesData(null);
    setSubmissionResult(null);
    setError(null);
    setRawResponse(null);
  };

  // Compute live calculations
  const calculateTotals = () => {
    if (!liabilitiesData || !liabilitiesData.eligibleCards) {
      return { totalSelected: 0, totalFee: 0, totalMonthlyInterestSaved: 0, total18moSavings: 0 };
    }

    let totalSelected = 0;
    let totalMonthlyInterestSaved = 0;
    let total18moSavings = 0;

    liabilitiesData.eligibleCards.forEach((card: any) => {
      if (selectedCards[card.liabilityId]) {
        const amt = transferAmounts[card.liabilityId] ?? card.outstandingBalance;
        totalSelected += amt;

        // Interest calculation
        const monthlyRate = (card.currentApr / 100) / 12;
        const currentMonthlyInterest = amt * monthlyRate;
        totalMonthlyInterestSaved += currentMonthlyInterest;

        const total18moInterestNoBT = currentMonthlyInterest * 18;
        const cardBtFee = amt * 0.03;
        total18moSavings += Math.max(0, total18moInterestNoBT - cardBtFee);
      }
    });

    const totalFee = totalSelected * 0.03;
    return {
      totalSelected: Math.round(totalSelected * 100) / 100,
      totalFee: Math.round(totalFee * 100) / 100,
      totalMonthlyInterestSaved: Math.round(totalMonthlyInterestSaved * 100) / 100,
      total18moSavings: Math.round(total18moSavings * 100) / 100
    };
  };

  const totals = calculateTotals();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner - White Label Credit Union Application context */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-2xl border border-violet-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 p-0.5 shadow-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Apex Horizon Credit Union</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-[10px] text-violet-300 font-mono">B2B Embedded Flow</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Horizon Platinum Cash Card</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-medium text-emerald-400">
            <Percent className="w-4 h-4 text-emerald-400" />
            <span>0% Intro APR for 18 Months</span>
          </div>
        </div>

        {/* PM Strategy Callout Box */}
        <div className="bg-slate-900/60 rounded-xl p-4 border border-violet-500/20 mb-6 text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-bold text-violet-300 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-violet-400" />
              <span>Spinwheel API Blueprint: B2B Instant Balance Transfer</span>
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
              <p><strong className="text-slate-200">Customer Drop-off Problem:</strong> Traditional balance transfers require manual 16-digit card entries & routing numbers with 7-10 day paper checks.</p>
              <p><strong className="text-slate-200">Spinwheel API Primitives Used:</strong> <code className="text-violet-300 bg-slate-950 px-1 py-0.5 rounded">Connect Pre-Verified</code> (1-Click Phone/DOB) $\rightarrow$ <code className="text-violet-300 bg-slate-950 px-1 py-0.5 rounded">Liability Payoff Quotes</code> $\rightarrow$ <code className="text-violet-300 bg-slate-950 px-1 py-0.5 rounded">Payment Request API</code>.</p>
              <p><strong className="text-slate-200">Business Impact & Metrics:</strong> Increases applicant BT completion rate by 40%, cuts processing times by 70%, and drives higher loan originations.</p>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          <div className={`p-2.5 rounded-xl border transition-all ${step === 1 ? 'bg-violet-600/20 border-violet-500 text-white shadow-md' : step > 1 ? 'bg-slate-900/60 border-slate-800 text-emerald-400' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
            1. Pre-Verified Identity
          </div>
          <div className={`p-2.5 rounded-xl border transition-all ${step === 2 ? 'bg-violet-600/20 border-violet-500 text-white shadow-md' : step > 2 ? 'bg-slate-900/60 border-slate-800 text-emerald-400' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
            2. Select Debts & Savings
          </div>
          <div className={`p-2.5 rounded-xl border transition-all ${step === 3 ? 'bg-violet-600/20 border-violet-500 text-white shadow-md' : 'bg-slate-900/30 border-slate-850 text-slate-500'}`}>
            3. Instant BT Confirmation
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-200">{error.code || 'Error'}</h4>
            <p className="mt-1 text-xs text-red-300/90">{error.message || 'An error occurred during balance transfer execution.'}</p>
          </div>
        </div>
      )}

      {/* STEP 1: Pre-Verified Connect */}
      {step === 1 && (
        <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">1-Click Instant Balance Transfer Eligibility</h3>
              <p className="text-xs text-slate-400">Authenticate using Phone + DOB to pull active liabilities via Spinwheel Connect Pre-Verified API.</p>
            </div>
          </div>

          <form onSubmit={handlePreVerifiedConnect} className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Mobile Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+14155552671"
                className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Date of Birth (YYYY-MM-DD)</label>
              <input
                type="text"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="1998-03-08"
                className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying & Pulling Liabilities...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate & Pull Cards Real-Time</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test User Shortcut */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400 mb-2">Or test directly with Spinwheel Sandbox Demo User ID:</p>
            <button
              onClick={() => {
                const demoId = 'c3cf91d9-21c8-413c-82bf-286d6e05593e';
                setUserId(demoId);
                loadLiabilities(demoId);
              }}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-violet-500/50 text-xs text-violet-300 font-mono transition-all"
            >
              Load Demo User (c3cf91d9-21c8-413c-82bf-286d6e05593e)
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Select High-Interest Debts & Live Savings Calculator */}
      {step === 2 && liabilitiesData && (
        <div className="space-y-6">
          {/* Real-time Debts List */}
          <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Select High-Interest Cards to Consolidate</span>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-normal">
                    {liabilitiesData.eligibleCards?.length || 0} Accounts Found
                  </span>
                </h3>
                <p className="text-xs text-slate-400">High-interest debts automatically identified from applicant credit profile.</p>
              </div>

              <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                User: <span className="text-slate-200">{liabilitiesData.fullName}</span> ({liabilitiesData.bureauScore} Bureau Score)
              </div>
            </div>

            {/* Cards List */}
            <div className="space-y-4">
              {liabilitiesData.eligibleCards?.map((card: any) => {
                const isSelected = !!selectedCards[card.liabilityId];
                const currentAmt = transferAmounts[card.liabilityId] ?? card.outstandingBalance;

                return (
                  <div
                    key={card.liabilityId}
                    className={`rounded-xl p-4 border transition-all ${
                      isSelected
                        ? 'bg-slate-900/90 border-violet-500/60 shadow-lg shadow-violet-950/40'
                        : 'bg-slate-900/40 border-slate-850 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Checkbox & Card Name */}
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCard(card.liabilityId)}
                          className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-950 text-violet-600 focus:ring-violet-500"
                        />
                        <div>
                          <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                            <span>{card.displayName}</span>
                            <span className="text-xs font-mono text-slate-400">({card.maskedAccount})</span>
                          </h4>
                          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                            <span>Current APR: <strong className="text-amber-400 font-semibold">{card.currentApr}%</strong></span>
                            <span>Est. Monthly Interest: <strong className="text-red-400 font-semibold">${card.estimatedMonthlyInterest}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Balance & Savings Badge */}
                      <div className="text-right">
                        <div className="text-sm font-bold text-white font-mono">
                          ${card.outstandingBalance.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium flex items-center justify-end space-x-1 mt-0.5">
                          <TrendingDown className="w-3 h-3" />
                          <span>Save ~${card.estimated18moSavings} (18 mo)</span>
                        </div>
                      </div>
                    </div>

                    {/* Transfer Amount Slider/Input if selected */}
                    {isSelected && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Transfer Amount:</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400">$</span>
                          <input
                            type="number"
                            value={currentAmt}
                            onChange={(e) => handleAmountChange(card.liabilityId, parseFloat(e.target.value) || 0)}
                            className="w-28 rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-right text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                            max={card.outstandingBalance}
                            min={0}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Interest Savings Summary Bar */}
          <div className="glass-premium rounded-2xl p-6 shadow-xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Total Selected BT</span>
                <span className="text-xl font-extrabold text-white font-mono">${totals.totalSelected.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">3% BT Fee</span>
                <span className="text-xl font-extrabold text-slate-300 font-mono">${totals.totalFee.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">Monthly Interest Saved</span>
                <span className="text-xl font-extrabold text-amber-400 font-mono">${totals.totalMonthlyInterestSaved.toLocaleString()}/mo</span>
              </div>

              <div className="bg-emerald-500/10 rounded-xl p-2 border border-emerald-500/30">
                <span className="text-xs text-emerald-300 font-semibold block mb-1">Est. 18-Mo Net Savings</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">${totals.total18moSavings.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Back / Choose Different Applicant
              </button>

              <button
                onClick={handleExecuteTransfer}
                disabled={submitting || totals.totalSelected === 0}
                className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Instant BT Payment Request...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Consolidate & Transfer ${totals.totalSelected.toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Instant Balance Transfer Confirmation */}
      {step === 3 && submissionResult && (
        <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-2xl border border-emerald-500/40 space-y-6 animate-in zoom-in-95 duration-300">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Balance Transfer Approved & Initiated!</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Spinwheel's Payment Request API has scheduled instant ACH disbursements directly to target card creditors.
            </p>
          </div>

          {/* Transaction Metadata Card */}
          <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Transaction ID:</span>
              <span className="text-violet-300 font-bold">{submissionResult.transactionId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Payment Status:</span>
              <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                {submissionResult.status}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Total Consolidated Volume:</span>
              <span className="text-white font-bold">${((submissionResult.totalAmountInCents || 0) / 100).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated 18-Month Net Interest Saved:</span>
              <span className="text-emerald-400 font-extrabold">${totals.total18moSavings.toLocaleString()}</span>
            </div>
          </div>

          {/* Individual Payment Disbursements */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Disbursement Payments Scheduled</h4>
            <div className="space-y-2">
              {(submissionResult.payments || []).map((pay: any) => (
                <div key={pay.paymentId} className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-medium">Liability Payment ({pay.liabilityId})</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-white font-bold">${((pay.amountInCents || 0) / 100).toLocaleString()}</span>
                    <span className="block text-[10px] text-slate-400">Disbursing: {pay.estimatedDisbursementDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold transition-all flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run Another Balance Transfer</span>
            </button>

            <button
              onClick={() => setShowPmTakeaway(true)}
              className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:text-white text-xs font-semibold transition-all"
            >
              Review PM Executive Impact
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Debug Panel */}
      <DebugPanel rawResponse={rawResponse} />
    </div>
  );
};
