import React, { useState, useEffect } from 'react';
import { 
  FileText, Loader2, AlertCircle, 
  User, Calendar, CreditCard, Clock, Info, ExternalLink
} from 'lucide-react';
import { fetchDebtProfile } from '../utils/api';

import { DebugPanel } from './DebugPanel';

interface DebtProfileViewerProps {
  initialUserId?: string | null;
}

export const DebtProfileViewer: React.FC<DebtProfileViewerProps> = ({ initialUserId }) => {
  const [userId, setUserId] = useState('');
  const [liabilityType, setLiabilityType] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [rawResponse, setRawResponse] = useState<any | null>(null);

  // Prefill userId if passed from verification step
  useEffect(() => {
    if (initialUserId) {
      setUserId(initialUserId);
    }
  }, [initialUserId]);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    if (!consentChecked) return;

    setLoading(true);
    setError(null);
    setData(null);
    setRawResponse(null);

    const response = await fetchDebtProfile(userId.trim(), liabilityType || undefined);
    setRawResponse(response);
    setLoading(false);

    if (response.success) {
      setData(response.data);
    } else {
      setError(response.error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 740) return 'text-emerald-400 border-emerald-500/30';
    if (score >= 670) return 'text-cyan-400 border-cyan-500/30';
    if (score >= 580) return 'text-amber-400 border-amber-500/30';
    return 'text-red-400 border-red-500/30';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Input / Control Panel */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 p-0.5 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Fetch User Debt Profile</h2>
            <p className="text-xs text-slate-400">Fetch real-time credit reports, Vantage scores, and debt liability details.</p>
          </div>
        </div>

        <div className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-800/80 mb-6 text-xs text-slate-300 space-y-1.5">
          <div className="font-semibold text-slate-200 flex items-center">
            <Info className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
            User ID Strategy Notice
          </div>
          <p className="leading-relaxed">
            Provide a Spinwheel Sandbox User ID. If you completed Step 2 (Verify OTP), it is pre-populated here automatically. Otherwise, you can paste one manually below.
          </p>
        </div>

        <form onSubmit={handleFetch} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* User ID Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Spinwheel User ID (UUID)
              </label>
              <input
                type="text"
                placeholder="e.g. c3cf91d9-21c8-413c-82bf-286d6e05593e"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-xl bg-slate-900/80 border border-slate-800 focus:border-primary/80 focus:ring-primary/40 px-4 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                disabled={loading}
              />
            </div>

            {/* Optional Liability Type Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Filter by Liability Type (Optional)
              </label>
              <select
                value={liabilityType}
                onChange={(e) => setLiabilityType(e.target.value)}
                className="w-full rounded-xl bg-slate-900/80 border border-slate-800 focus:border-primary/80 focus:ring-primary/40 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 transition-all"
                disabled={loading}
              >
                <option value="">All Liabilities</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="STUDENT_LOAN">Student Loan</option>
                <option value="AUTO_LOAN">Auto Loan</option>
                <option value="HOME_LOAN">Home Loan</option>
                <option value="PERSONAL_LOAN">Personal Loan</option>
                <option value="MISCELLANEOUS_LIABILITY">Miscellaneous Liability</option>
              </select>
            </div>
          </div>

          {/* Consent Text Checkbox */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 h-4.5 w-4.5 rounded border-slate-800 bg-slate-950 text-primary focus:ring-primary/30"
                disabled={loading}
              />
              <span className="text-xs text-slate-400 leading-normal select-none">
                By continuing you agree to the{' '}
                <a
                  href="https://spinwheel.io/legal/end-user-agreement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80 inline-flex items-center"
                >
                  Spinwheel End User Agreement <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
                . Further, you are providing “written instructions” to Spinwheel Solutions, Inc. authorizing it to obtain your credit profile from any consumer reporting agency.
              </span>
            </label>
          </div>

          {/* Fetch Button */}
          <button
            type="submit"
            disabled={loading || !userId.trim() || !consentChecked}
            className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-0.5 font-semibold text-sm text-white shadow-lg transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-40 disabled:hover:scale-100"
          >
            <div className="flex items-center justify-center space-x-2 rounded-[10px] bg-slate-950/45 px-6 py-3 transition-colors group-hover:bg-transparent">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Retrieving Debt Profile...</span>
                </>
              ) : (
                <>
                  <span>Fetch Debt Profile</span>
                </>
              )}
            </div>
          </button>
        </form>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-5 flex items-start space-x-3 text-destructive">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" />
          <div className="text-sm">
            <span className="font-semibold block mb-0.5 text-red-300">
              Debt Profile Fetch Error ({error.code || 'API_ERROR'})
            </span>
            <p className="text-red-200/85 mb-2">{error.message || 'Unable to retrieve profile details.'}</p>
            {error.details && error.details.length > 0 && (
              <ul className="list-disc pl-4 text-xs text-red-300/80 space-y-1">
                {error.details.map((d: any, i: number) => (
                  <li key={i}>{d.desc || d.message || JSON.stringify(d)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Success Output Report View */}
      {data && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Hero Section & Credit Score Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Visual Vantage Gauge */}
            <div className="glass-premium rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center text-center">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4">VantageScore® 3.0</span>
              <div className={`relative w-36 h-36 rounded-full border-8 flex flex-col items-center justify-center ${getScoreColor(data.scoreValue || 0)}`}>
                <span className="text-4xl font-extrabold tracking-tight text-white">{data.scoreValue || 'N/A'}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">300 - 850</span>
              </div>
              <div className="mt-4 text-xs text-slate-400">
                Reported: {data.scoreReportedDate || 'N/A'}
              </div>
              <div className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded mt-2">
                Bureau: {data.bureau}
              </div>
            </div>

            {/* Profile Overview */}
            <div className="glass-premium rounded-2xl p-6 border border-white/10 md:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <User className="w-4 h-4 mr-1.5 text-primary" /> Consumer Profile Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Full Name</span>
                  <span className="text-white font-semibold text-sm">{data.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">SSN (Last 4)</span>
                  <span className="text-white font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                    ***-**-{data.ssnLastFour || '****'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                  <span className="text-white font-medium flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    {data.dateOfBirth || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Report Type</span>
                  <span className="text-white font-medium">{data.reportType}</span>
                </div>
              </div>

              {data.currentAddress && (
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-slate-400 block mb-1 text-xs">Current Address</span>
                  <p className="text-xs text-slate-300 font-medium bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50">
                    {data.currentAddress.addressLine1}, {data.currentAddress.city}, {data.currentAddress.state} {data.currentAddress.zip}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Credit Score Factors */}
          {data.factors && data.factors.length > 0 && (
            <div className="glass-premium rounded-2xl p-6 border border-white/10 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <Info className="w-4 h-4 mr-1.5 text-amber-400" /> Credit Score Factors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.factors.map((f: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-850 p-3.5 rounded-xl flex items-start space-x-3">
                    <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded font-bold mt-0.5">
                      {f.code}
                    </span>
                    <p className="text-xs text-slate-300 leading-normal">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Unsecured Debt</span>
              <span className="text-lg font-bold text-white font-mono">${(data.summary.totalUnsecuredDebtAmount || 0).toLocaleString()}</span>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Secured Debt</span>
              <span className="text-lg font-bold text-white font-mono">${(data.summary.totalSecuredDebtAmount || 0).toLocaleString()}</span>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Unsecured Trades</span>
              <span className="text-lg font-bold text-white font-mono">{data.summary.unsecuredDebtLiabilitiesCount || 0}</span>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Secured Trades</span>
              <span className="text-lg font-bold text-white font-mono">{data.summary.securedDebtLiabilitiesCount || 0}</span>
            </div>
          </div>

          {/* Tradelines & Liabilities List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <CreditCard className="w-4 h-4 mr-1.5 text-violet-400" /> Active Tradelines ({data.liabilities.length})
              </h3>
            </div>

            {data.liabilities.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/20 border border-slate-800/60 rounded-2xl text-slate-400 text-xs">
                No active tradelines or liabilities found matching current filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.liabilities.map((l: any) => (
                  <div key={l.id} className="glass-premium rounded-xl border border-white/5 p-5 space-y-4 relative overflow-hidden flex flex-col justify-between">
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{l.displayName}</h4>
                          <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 mt-1 inline-block">
                            {l.subtype} ({l.category})
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          l.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {l.status}
                        </span>
                      </div>

                      {/* Balances */}
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/60 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Outstanding Balance</span>
                          <span className="text-white font-bold font-mono">${l.outstandingBalance.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Minimum Payment</span>
                          <span className="text-white font-medium font-mono">${l.minimumPaymentAmount}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Interest Rate</span>
                          <span className="text-white font-mono">{l.interestRate}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Due Date</span>
                          <span className="text-white flex items-center font-mono">
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            {l.dueDate ? new Date(l.dueDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Details */}
                    <div className="mt-4 pt-3 border-t border-slate-850 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Account: {l.maskedAccount}</span>
                      <span>Reported: {l.reportedDate || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inquiries and Bankruptcies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Inquiries Panel */}
            <div className="glass-premium rounded-xl border border-white/5 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hard Inquiries</h4>
              {data.inquiries.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No hard inquiries reported.</p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {data.inquiries.map((inq: any, idx: number) => (
                    <div key={idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-200">{inq.inquirerName}</p>
                        <span className="text-[10px] text-slate-450">{inq.sourceBureau} • {inq.purposeType}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">{inq.inquiryDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bankruptcies Panel */}
            <div className="glass-premium rounded-xl border border-white/5 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Public Bankruptcies</h4>
              {data.bankruptcies.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No public bankruptcy files reported.</p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {data.bankruptcies.map((bank: any, idx: number) => (
                    <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-red-400">{bank.disposition}</span>
                        <span className="font-mono text-[10px] text-slate-400">Case: {bank.caseNumber}</span>
                      </div>
                      <p className="text-[11px] text-slate-350">
                        Filed: {bank.filedDate} • Type: {bank.type}
                      </p>
                      {bank.narratives && bank.narratives.length > 0 && (
                        <p className="text-[10px] text-slate-450 italic mt-1">
                          Note: {bank.narratives.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Raw Response Debugger Panel */}
      <DebugPanel rawResponse={rawResponse} />
      
    </div>
  );
};
