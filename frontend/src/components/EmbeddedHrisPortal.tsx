import React, { useState } from 'react';
import {
  Building2, Award, CheckCircle2, ShieldCheck,
  Landmark, FileText,
  ArrowRight, Sparkles, RefreshCw,
  Lock, Check, Users,
  Briefcase, HeartHandshake
} from 'lucide-react';

interface EmbeddedHrisPortalProps {
  onBackToEngine?: () => void;
}

export const EmbeddedHrisPortal: React.FC<EmbeddedHrisPortalProps> = ({ onBackToEngine }) => {
  const [viewMode, setViewMode] = useState<'EMPLOYEE' | 'HR_ADMIN'>('EMPLOYEE');
  const [activeNav, setActiveNav] = useState<'benefits' | 'payroll' | 'dashboard'>('benefits');

  // Employee enrollment state
  const [isLinked, setIsLinked] = useState<boolean>(true);
  const [selectedServicer, setSelectedServicer] = useState<string>('Nelnet Servicing, LLC');
  const [monthlyPayment] = useState<number>(350);
  const [annualSalary] = useState<number>(95000);
  const [matchRate] = useState<number>(0.50); // 50% match
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [connectStep, setConnectStep] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Computed matching metrics
  const monthlyEmployerMatch = Math.round(monthlyPayment * matchRate * 100) / 100;
  const annualEmployerMatch = Math.round(monthlyEmployerMatch * 12 * 100) / 100;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSimulateConnect = () => {
    setConnectStep(2);
    setTimeout(() => {
      setConnectStep(3);
      setTimeout(() => {
        setIsLinked(true);
        setShowConnectModal(false);
        setConnectStep(1);
        showToast('Successfully linked student loan tradeline via Spinwheel Embedded Connect!');
      }, 1200);
    }, 1200);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500/95 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-sm font-medium border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top HRIS Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-2xl gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white tracking-tight text-base">Rippling HRIS / Benefits Portal</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                Customer View
              </span>
            </div>
            <p className="text-xs text-slate-400">Acme Technologies Inc. &bull; Enterprise Plan Year 2026</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Persona Switcher */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('EMPLOYEE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'EMPLOYEE'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Employee View (Alex Morgan)
            </button>
            <button
              onClick={() => setViewMode('HR_ADMIN')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'HR_ADMIN'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Plan Sponsor / HR Admin View
            </button>
          </div>

          {onBackToEngine && (
            <button
              onClick={onBackToEngine}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1"
            >
              <span>← Back to QSLP Engine</span>
            </button>
          )}
        </div>
      </div>

      {/* Main HRIS Interface Container */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Sub-header navigation */}
        <div className="border-b border-slate-800 px-6 py-3 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-6 text-xs font-medium">
            <button
              onClick={() => setActiveNav('benefits')}
              className={`pb-1 border-b-2 transition-all flex items-center space-x-1.5 ${
                activeNav === 'benefits'
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>401(k) & Retirement (SECURE 2.0)</span>
            </button>
            <button
              onClick={() => setActiveNav('payroll')}
              className={`pb-1 border-b-2 transition-all flex items-center space-x-1.5 ${
                activeNav === 'payroll'
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paystubs & Deductions</span>
            </button>
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`pb-1 border-b-2 transition-all flex items-center space-x-1.5 ${
                activeNav === 'dashboard'
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Company Benefits Overview</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Fidelity Investments 401(k) Connected</span>
          </div>
        </div>

        {/* VIEW 1: EMPLOYEE EXPERIENCE */}
        {viewMode === 'EMPLOYEE' ? (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Feature Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/30 p-6">
              <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
                <Award className="w-48 h-48 text-emerald-400" />
              </div>
              <div className="relative z-10 max-w-2xl space-y-2">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>SECURE 2.0 Act §110 Active Benefit</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Get 401(k) Matching While Paying Off Your Student Loans
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Acme Technologies will match <strong>50% of your student loan payments</strong> directly into your Fidelity 401(k) retirement account — even if you contribute $0 of elective salary deferrals. Powered seamlessly by Spinwheel's verified loan connect rails.
                </p>
              </div>
            </div>

            {/* Linked Status / Enrollment Card */}
            {isLinked ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Active Tradeline & Verification */}
                <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Active Verified Student Loan Tradeline</h3>
                        <p className="text-xs text-slate-400">Servicer: {selectedServicer} &bull; Account ending in ****7721</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>IRS § 221(d) Verified</span>
                    </span>
                  </div>

                  {/* 3 Metric Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Monthly Loan Payment</div>
                      <div className="text-base font-bold text-white mt-1">${monthlyPayment.toFixed(2)}/mo</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">Verified Nelnet API</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Company 401(k) Match</div>
                      <div className="text-base font-bold text-emerald-400 mt-1">+${monthlyEmployerMatch.toFixed(2)}/mo</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">50% Match Rate</div>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Annual 401(k) Growth</div>
                      <div className="text-base font-bold text-cyan-400 mt-1">+${annualEmployerMatch.toLocaleString()}/yr</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Free Wealth Accrual</div>
                    </div>
                  </div>

                  {/* IRS 5-Point Notice 2024-63 Audit Checkmarks */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">IRS Notice 2024-63 Automated Compliance Checklist</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80 text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Direct Loan Servicer verified (Nelnet API)</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80 text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Qualified Higher Education Debt (IRC § 221)</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80 text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Timely payment verified during 2026 Plan Year</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80 text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Employee primary payor verified (Alex Morgan)</span>
                      </div>
                    </div>
                  </div>

                  {/* Powered By Spinwheel Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/60">
                    <span className="flex items-center space-x-1.5">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Zero manual paperwork &bull; Direct API continuous monitoring</span>
                    </span>
                    <button
                      onClick={() => setShowConnectModal(true)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold underline text-xs"
                    >
                      Update Loan Details
                    </button>
                  </div>
                </div>

                {/* Right Col: Paystub Live Impact Simulation */}
                <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Paystub Preview</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Bi-Weekly</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Gross Earnings (Bi-Weekly)</span>
                      <span className="font-mono text-white">${(annualSalary / 26).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Elective 401(k) Deferral (0%)</span>
                      <span className="font-mono text-slate-400">$0.00</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <span className="flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>Employer QSLP Match</span>
                      </span>
                      <span className="font-mono">+${(monthlyEmployerMatch / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                      <span>Disbursement Target:</span>
                      <span className="text-slate-300">Fidelity 401(k) Sub-Account</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                    <div className="font-semibold text-slate-300 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Employee Advantage</span>
                    </div>
                    <p>
                      You are putting <strong>$0</strong> of salary deductions into 401(k), but receiving <strong>${annualEmployerMatch.toLocaleString()}</strong> in free retirement matching simply by making your regular student loan payments.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Unlinked State: Invitation to Link */
              <div className="bg-slate-950/60 border border-dashed border-slate-700 rounded-2xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                  <Landmark className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-white">Link Your Student Loans in 30 Seconds</h3>
                  <p className="text-xs text-slate-400">
                    Connect with Nelnet, MOHELA, Aidvantage, or Sallie Mae using Spinwheel's secure 1-click verification to activate your company 401(k) match.
                  </p>
                </div>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl text-xs shadow-lg hover:from-cyan-400 hover:to-blue-500 transition-all inline-flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Connect Student Loans via Spinwheel</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: HR ADMIN / PLAN SPONSOR VIEW */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs text-slate-400 font-medium">Eligible Workforce Cohort</div>
                <div className="text-xl font-bold text-white">412 Employees</div>
                <div className="text-[11px] text-cyan-400">Millennial & Gen-Z Talent</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs text-slate-400 font-medium">QSLP Enrollment Rate</div>
                <div className="text-xl font-bold text-emerald-400">48.2% Active</div>
                <div className="text-[11px] text-emerald-500">+28% vs traditional 401(k)</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs text-slate-400 font-medium">Annual Match Disbursed</div>
                <div className="text-xl font-bold text-white">$184,200 YTD</div>
                <div className="text-[11px] text-slate-400">Plan Year 2026 Allocation</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="text-xs text-slate-400 font-medium">HR Processing Time Saved</div>
                <div className="text-xl font-bold text-cyan-400">180 hrs / mo</div>
                <div className="text-[11px] text-cyan-500">100% Automated API Rails</div>
              </div>
            </div>

            {/* Active Enrolled Participants Table */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Live Enrolled QSLP Participants (Sample Roster)
                  </h3>
                </div>
                <button
                  onClick={() => showToast('Dispatched automated payroll batch sync to Fidelity Investments!')}
                  className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-md"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Payroll to Fidelity 401(k)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Employee</th>
                      <th className="px-6 py-3 font-semibold">Servicer Tradeline</th>
                      <th className="px-6 py-3 font-semibold">Monthly Payment</th>
                      <th className="px-6 py-3 font-semibold">Calculated Match</th>
                      <th className="px-6 py-3 font-semibold">IRS §110 Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Audit Cert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-white">Alex Morgan</td>
                      <td className="px-6 py-3.5 text-slate-300">Nelnet Servicing (Direct Stafford)</td>
                      <td className="px-6 py-3.5 font-mono">$350.00/mo</td>
                      <td className="px-6 py-3.5 font-mono text-emerald-400">+$175.00/mo</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          VERIFIED_COMPLIANT
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => showToast('Downloaded IRS Fiduciary Safe Harbor Certificate for Alex Morgan')}
                          className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline"
                        >
                          SHA-256 PDF ↗
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-white">Jordan Lee</td>
                      <td className="px-6 py-3.5 text-slate-300">MOHELA (Grad PLUS)</td>
                      <td className="px-6 py-3.5 font-mono">$480.00/mo</td>
                      <td className="px-6 py-3.5 font-mono text-emerald-400">+$240.00/mo</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          VERIFIED_COMPLIANT
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => showToast('Downloaded IRS Fiduciary Safe Harbor Certificate for Jordan Lee')}
                          className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline"
                        >
                          SHA-256 PDF ↗
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-white">Taylor Swift-Brown</td>
                      <td className="px-6 py-3.5 text-slate-300">Aidvantage (Direct Consolidation)</td>
                      <td className="px-6 py-3.5 font-mono">$220.00/mo</td>
                      <td className="px-6 py-3.5 font-mono text-emerald-400">+$110.00/mo</td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          VERIFIED_COMPLIANT
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => showToast('Downloaded IRS Fiduciary Safe Harbor Certificate for Taylor Swift-Brown')}
                          className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline"
                        >
                          SHA-256 PDF ↗
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spinwheel 1-Click Embedded Modal Simulation */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-xs">
                  S
                </div>
                <span className="font-bold text-white text-sm">Spinwheel Embedded Connect</span>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            {connectStep === 1 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Select Your Student Loan Servicer</h3>
                  <p className="text-xs text-slate-400">
                    Spinwheel pulls verified tradelines & payment records directly from your servicer under IRS Safe Harbor guidelines.
                  </p>
                </div>

                <div className="space-y-2">
                  {['Nelnet Servicing, LLC', 'MOHELA', 'Aidvantage', 'Sallie Mae', 'Federal Direct Student Loans'].map((servicer) => (
                    <button
                      key={servicer}
                      onClick={() => setSelectedServicer(servicer)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                        selectedServicer === servicer
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Landmark className="w-4 h-4 text-cyan-400" />
                        <span>{servicer}</span>
                      </div>
                      {selectedServicer === servicer && <Check className="w-4 h-4 text-cyan-400" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSimulateConnect}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Authenticate & Verify ({selectedServicer})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : connectStep === 2 ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Connecting to {selectedServicer} API...</h4>
                  <p className="text-xs text-slate-400">Verifying IRS §221(d) qualification & payment timestamps</p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Loan Tradeline Verified!</h4>
                  <p className="text-xs text-slate-400">Fiduciary audit certificate created and synced with HRIS.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
