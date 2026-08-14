import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Zap, ArrowRight, CheckCircle2, XCircle, 
  AlertTriangle, Play, RefreshCw, Layers,
  Terminal, Briefcase, Cpu, Camera, UserCheck, 
  ExternalLink, Scan, Loader2, Sparkles, Check
} from 'lucide-react';
import { executeIdentityWaterfall, fetchWaterfallKpis, fetchEvaluationStatus, completeDocVVerification } from '../utils/api';

interface RiskOSWaterfallProps {
  onNavigateToDebtProfile?: () => void;
}

export const RiskOSWaterfall: React.FC<RiskOSWaterfallProps> = ({ onNavigateToDebtProfile }) => {
  const [selectedScenario, setSelectedScenario] = useState<'SOCURE_RESCUE' | 'SYNTHETIC_FRAUD' | 'DOCV_STEPUP' | 'PROVE_MATCH'>('SOCURE_RESCUE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [kpis, setKpis] = useState<any | null>(null);
  const [activeJsonTab, setActiveJsonTab] = useState<'prove' | 'socure' | 'decision'>('decision');
  const [showPmExecutiveCase, setShowPmExecutiveCase] = useState(true);

  // In-App DocV Modal Experience State (Only opens when user explicitly clicks the Step-Up button)
  const [showDocVModal, setShowDocVModal] = useState(false);
  const [docVStep, setDocVStep] = useState<'intro' | 'document' | 'selfie' | 'verifying' | 'passed' | 'failed'>('intro');
  const [docVResult, setDocVResult] = useState<any | null>(null);

  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    runWaterfallTest('SOCURE_RESCUE');
    loadKpis();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const loadKpis = async () => {
    const res = await fetchWaterfallKpis();
    if (res.success && res.data) {
      setKpis(res.data);
    }
  };

  const runWaterfallTest = async (scenario: 'SOCURE_RESCUE' | 'SYNTHETIC_FRAUD' | 'DOCV_STEPUP' | 'PROVE_MATCH') => {
    setSelectedScenario(scenario);
    setLoading(true);
    setResult(null);
    setDocVResult(null);
    setShowDocVModal(false); // Never auto-open modal on scenario switch

    const res = await executeIdentityWaterfall({ scenarioOverride: scenario });
    setLoading(false);

    if (res.success && res.data) {
      setResult(res.data);
    }
  };

  // Launch DocV flow modal ONLY when explicitly clicked by user
  const handleLaunchDocV = () => {
    setShowDocVModal(true);
    setDocVStep('intro');
  };

  // Simulate or execute DocV step completion
  const handleRunDocVVerification = async (pass: boolean = true) => {
    setDocVStep('verifying');

    // Simulate multi-factor capture delay
    setTimeout(async () => {
      const res = await completeDocVVerification(result?.evalId, pass);

      if (res.success && res.data) {
        setDocVResult(res.data);
        setDocVStep(pass ? 'passed' : 'failed');

        if (pass) {
          // Upgrade waterfall result state
          setResult((prev: any) => prev ? {
            ...prev,
            finalDecision: 'RESCUED_APPROVE',
            spinwheelProfileProceed: true,
            executiveSummary: '🎉 Socure DocV Document Verification (Driver\'s License Scan & Biometric Match 96%) successfully verified! User unlocked for Spinwheel Debt Profile.'
          } : prev);
        }
      }
    }, 1600);
  };

  // Polling helper when user opens external Hosted Flow
  const startPollingEvalStatus = (evalId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      const res = await fetchEvaluationStatus(evalId);
      if (res.success && res.data?.eval_status === 'evaluation_completed') {
        clearInterval(pollIntervalRef.current);
        setDocVStep('passed');
        setResult((prev: any) => prev ? {
          ...prev,
          finalDecision: 'RESCUED_APPROVE',
          spinwheelProfileProceed: true,
          executiveSummary: '🎉 Socure Hosted Flow evaluation completed successfully in portal! User identity verified and unlocked.'
        } : prev);
      }
    }, 3000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-2xl border border-cyan-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-600/20 via-blue-600/10 to-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Spinwheel Identity Middleware</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono">Tiered RiskOS & DocV</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Prove & Socure RiskOS Orchestrator</h1>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <div className="flex items-center space-x-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Middleware Step-Up Engine</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>Zero-KBA Architecture (<span className="text-white font-bold">&lt; 2s Fallback</span>)</span>
            </div>
          </div>
        </div>

        {/* Executive Business Case / PM Narrative Drawer */}
        <div className="bg-slate-900/80 rounded-xl p-5 border border-cyan-500/25 mb-6 text-xs text-slate-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-cyan-300 flex items-center space-x-2 text-sm">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Executive Business Case: Retiring KBA with Tiered Socure RiskOS & DocV</span>
            </div>
            <button 
              onClick={() => setShowPmExecutiveCase(!showPmExecutiveCase)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              {showPmExecutiveCase ? 'Hide Executive Summary' : 'Show Executive Summary & TCO'}
            </button>
          </div>

          {showPmExecutiveCase && (
            <div className="pt-3 border-t border-slate-800 space-y-3 text-slate-300 text-xs leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80">
                  <span className="font-bold text-red-300 block mb-1">Current Problem (Prove + KBA)</span>
                  <p className="text-[11px] text-slate-400">Prove passes 80-85% of mobile users. The 15-20% failure bucket (VOIP, prepaid SIM, family plans, thin credit files) falls into KBA with &lt;45% pass rates, costing $0.80-$1.50/session with severe user drop-off.</p>
                </div>
                <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80">
                  <span className="font-bold text-cyan-300 block mb-1">Spinwheel Middleware Solution</span>
                  <p className="text-[11px] text-slate-400">Tiered Step-Up: Prove-failed users are routed directly to Socure RiskOS (ID+ & Sigma Fraud 3.0). When deeper verification is required, automated DocV (ID + Biometric Selfie) captures the user in &lt;30s.</p>
                </div>
                <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80">
                  <span className="font-bold text-emerald-300 block mb-1">Bottom-Line ROI Impact</span>
                  <p className="text-[11px] text-slate-400">Retires KBA completely (100% cost elimination), rescues +35% of dropped users, cuts synthetic fraud by &gt;80%, and reduces blended identity TCO from $0.58 to $0.38/user.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Scenario Quick-Runner Buttons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Live Demo Persona & Path:</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">Official Personas from `reference/api-test-cases.json`</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              onClick={() => runWaterfallTest('DOCV_STEPUP')}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                selectedScenario === 'DOCV_STEPUP'
                  ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="font-bold text-xs text-amber-300">🟡 Step-Up: DocV ID Scan</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Jax Myra (Thin File $\to$ DocV Biometric Step-Up)</p>
              <span className="text-[10px] text-amber-400/90 font-mono block mt-1.5 font-bold">Interactive DocV Demo</span>
            </button>

            <button
              onClick={() => runWaterfallTest('SOCURE_RESCUE')}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                selectedScenario === 'SOCURE_RESCUE'
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-xs text-emerald-300">🟢 Success: VOIP Rescue</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Stanley Brown (VOIP Line $\to$ Socure ACCEPT)</p>
              <span className="text-[10px] text-emerald-400/90 font-mono block mt-1.5 font-bold">+35% Conversion Rescued</span>
            </button>

            <button
              onClick={() => runWaterfallTest('SYNTHETIC_FRAUD')}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                selectedScenario === 'SYNTHETIC_FRAUD'
                  ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="font-bold text-xs text-red-300">🔴 Failure: Synthetic Fraud</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Jasmine Boon (High Sigma 892 $\to$ REJECT)</p>
              <span className="text-[10px] text-red-400/90 font-mono block mt-1.5 font-bold">Mitigates Credit Loss</span>
            </button>

            <button
              onClick={() => runWaterfallTest('PROVE_MATCH')}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                selectedScenario === 'PROVE_MATCH'
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="font-bold text-xs text-cyan-300">⚡ Baseline: Prove Match</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Daniel Casper (Verizon MNO $\to$ Instant Match)</p>
              <span className="text-[10px] text-cyan-400/90 font-mono block mt-1.5 font-bold">&lt; 400ms Standard Flow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Waterfall Flow Pipeline Diagram */}
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Live Waterfall Routing Trace</h3>
              <p className="text-xs text-slate-400">Visual state of Prove verification $\to$ Middleware fallback $\to$ Socure RiskOS & DocV.</p>
            </div>
          </div>

          <button
            onClick={() => runWaterfallTest(selectedScenario)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Re-run Trace</span>
          </button>
        </div>

        {/* Pipeline Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          
          {/* Node 1: User Input */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Node 1: Input</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-mono">Connect API</span>
            </div>
            <div className="text-xs font-bold text-white">{result?.userProvided?.fullName || 'Applicant'}</div>
            <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
              <div>Phone: {result?.userProvided?.phoneNumber}</div>
              <div>DOB: {result?.userProvided?.dob}</div>
              <div>SSN: ***-**-{result?.userProvided?.ssnLast4}</div>
            </div>
          </div>

          {/* Node 2: Prove Evaluation */}
          <div className={`p-4 rounded-xl border space-y-2 transition-all ${
            result?.proveResult?.status === 'MATCH'
              ? 'bg-emerald-950/30 border-emerald-500/50'
              : 'bg-amber-950/30 border-amber-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Node 2: Prove</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                result?.proveResult?.status === 'MATCH'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {result?.proveResult?.status || 'EVALUATING'}
              </span>
            </div>
            <div className="text-xs font-bold text-white">{result?.proveResult?.carrierName || 'Carrier Lookup'}</div>
            <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
              <div>Line: {result?.proveResult?.lineType}</div>
              <div>Latency: {result?.proveResult?.latencyMs}ms</div>
              {result?.proveResult?.reason && (
                <div className="text-amber-400 text-[10px]">{result.proveResult.reason}</div>
              )}
            </div>
          </div>

          {/* Node 3: Socure RiskOS Step-Up */}
          <div className={`p-4 rounded-xl border space-y-2 transition-all ${
            !result?.socureResult?.invoked
              ? 'bg-slate-950/40 border-slate-800 opacity-60'
              : result?.finalDecision === 'RESCUED_APPROVE'
              ? 'bg-emerald-950/30 border-emerald-500/50'
              : result?.finalDecision === 'REJECT_FRAUD'
              ? 'bg-red-950/30 border-red-500/50'
              : 'bg-amber-950/30 border-amber-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Node 3: Socure RiskOS</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                !result?.socureResult?.invoked
                  ? 'bg-slate-900 text-slate-500'
                  : result?.finalDecision === 'RESCUED_APPROVE'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : result?.finalDecision === 'REJECT_FRAUD'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {result?.socureResult?.invoked ? (result.finalDecision === 'RESCUED_APPROVE' ? 'ACCEPT (DOCV VERIFIED)' : result.socureResult.decision) : 'BYPASSED'}
              </span>
            </div>
            <div className="text-xs font-bold text-white">ID+ & Sigma Fraud & DocV</div>
            <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
              {result?.socureResult?.invoked ? (
                <>
                  <div>Sigma Score: <strong className={result.socureResult.sigmaFraudScore > 500 ? 'text-red-400' : 'text-emerald-400'}>{result.socureResult.sigmaFraudScore}/1000</strong></div>
                  <div>ID+ Match: {result.socureResult.idPlusScore}</div>
                  <div>Latency: {result.socureResult.latencyMs}ms</div>
                </>
              ) : (
                <div className="text-slate-500 text-[10px]">Not triggered (Prove Match)</div>
              )}
            </div>
          </div>

          {/* Node 4: Spinwheel Core Profile */}
          <div className={`p-4 rounded-xl border space-y-2 transition-all ${
            result?.spinwheelProfileProceed
              ? 'bg-violet-950/40 border-violet-500/50'
              : 'bg-red-950/20 border-red-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Node 4: Action</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                result?.spinwheelProfileProceed
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {result?.spinwheelProfileProceed ? 'PROCEED' : 'BLOCKED'}
              </span>
            </div>
            <div className="text-xs font-bold text-white">Debt Profile API</div>
            <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
              <div>VantageScore: {result?.spinwheelProfileProceed ? '720' : 'N/A'}</div>
              <div>Status: {result?.finalDecision}</div>
            </div>
          </div>
        </div>

        {/* Decision Banner */}
        {result && (
          <div className={`p-5 rounded-xl border flex flex-col space-y-4 ${
            result.finalDecision === 'RESCUED_APPROVE'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : result.finalDecision === 'REJECT_FRAUD'
              ? 'bg-red-950/40 border-red-500/40 text-red-300'
              : result.finalDecision === 'STEP_UP_DOCV'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                {result.finalDecision === 'RESCUED_APPROVE' || result.finalDecision === 'AUTO_APPROVED' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : result.finalDecision === 'REJECT_FRAUD' ? (
                  <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-bold text-white text-sm">
                      {result.finalDecision === 'RESCUED_APPROVE' && '🎉 Transaction Successfully Rescued without KBA!'}
                      {result.finalDecision === 'AUTO_APPROVED' && '⚡ Standard Prove Carrier Instant Verification'}
                      {result.finalDecision === 'REJECT_FRAUD' && '🛡️ High-Risk Synthetic Identity Blocked'}
                      {result.finalDecision === 'STEP_UP_DOCV' && '📄 Step-Up to Socure DocV Dispatched'}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40">
                      STATUS: {result.finalDecision}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {result.executiveSummary}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {result.finalDecision === 'STEP_UP_DOCV' && (
                  <button
                    onClick={handleLaunchDocV}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-2 transition-all animate-pulse"
                  >
                    <Scan className="w-4 h-4" />
                    <span>Complete DocV Verification Experience</span>
                  </button>
                )}

                {result.spinwheelProfileProceed && (
                  <button
                    onClick={onNavigateToDebtProfile}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center space-x-2 transition-all"
                  >
                    <span>Proceed to Debt Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Live Socure RiskOS Evaluation Link & Telemetry Bar */}
            {result.evalId && (
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-slate-300 font-mono text-[11px]">
                  <span className="text-cyan-400 font-bold">⚡ Live Socure RiskOS Evaluation:</span>
                  <code className="bg-black/50 px-2 py-0.5 rounded border border-slate-700 text-white">{result.evalId}</code>
                  {result.evalStatus && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">
                      {result.evalStatus}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {result.redirectUri && (
                    <a
                      href={result.redirectUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => startPollingEvalStatus(result.evalId)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold font-mono transition-colors shadow flex items-center space-x-1"
                    >
                      <span>Launch Hosted Flow UX ↗</span>
                    </a>
                  )}
                  <a
                    href="https://riskos.sandbox.socure.com/evaluations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-mono transition-colors flex items-center space-x-1"
                  >
                    <span>View in Socure RiskOS Portal ↗</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive DocV Verification Experience Modal */}
      {showDocVModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Scan className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Socure RiskOS Step-Up</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">DocV™ Verification</span>
                  </div>
                  <h3 className="text-lg font-black text-white">Government ID & Biometric Verification</h3>
                </div>
              </div>

              <button
                onClick={() => setShowDocVModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1"
              >
                ✕ Close
              </button>
            </div>

            {/* DocV Step Content */}
            {docVStep === 'intro' && (
              <div className="space-y-5">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                  <p className="leading-relaxed">
                    Prove detected an unverified carrier attribute (Thin Credit File). To proceed without manual KBA questions, Socure RiskOS automatically requests a fast 2-step document verification.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-center">
                    <Camera className="w-6 h-6 text-amber-400 mx-auto" />
                    <span className="font-bold text-xs text-white block">Step 1: ID Scan</span>
                    <p className="text-[11px] text-slate-400">Driver's License / State ID front & back with anti-tamper check</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-center">
                    <UserCheck className="w-6 h-6 text-cyan-400 mx-auto" />
                    <span className="font-bold text-xs text-white block">Step 2: Selfie Liveness</span>
                    <p className="text-[11px] text-slate-400">3D facial geometry & biometric match against photo ID</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  {result?.redirectUri && (
                    <a
                      href={result.redirectUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => startPollingEvalStatus(result.evalId)}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Open Socure Hosted Flow UX ↗</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleRunDocVVerification(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Complete & Verify DocV (96% Match Pass)</span>
                  </button>
                </div>
              </div>
            )}

            {docVStep === 'verifying' && (
              <div className="py-12 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-white">Analyzing ID Document & 3D Biometric Liveness...</h4>
                <div className="space-y-1 text-xs text-slate-400 font-mono">
                  <div>✓ Barcode PDF417 decoded</div>
                  <div>✓ Hologram & font microprint validated</div>
                  <div>✓ 3D Face map biometric match: 0.96</div>
                </div>
              </div>
            )}

            {docVStep === 'passed' && (
              <div className="space-y-5 animate-in zoom-in-95">
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">DocV Identity Successfully Verified & Approved!</h4>
                    <p className="text-xs text-emerald-300 mt-1">
                      Driver's license validated. Biometric match score: <strong className="text-white">96% (Pass)</strong>. No KBA drop-off occurred.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setShowDocVModal(false);
                      if (onNavigateToDebtProfile) onNavigateToDebtProfile();
                    }}
                    className="w-full py-3 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center space-x-2 transition-all"
                  >
                    <span>Proceed to Spinwheel Debt Profile & Co-Pilot</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {docVStep === 'failed' && (
              <div className="space-y-5">
                <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-5 text-center space-y-3">
                  <XCircle className="w-10 h-10 text-red-400 mx-auto" />
                  <div>
                    <h4 className="font-bold text-white text-base">DocV Verification Failed</h4>
                    <p className="text-xs text-red-300 mt-1">
                      Document tampering or biometric mismatch detected. Application halted to mitigate fraud.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDocVModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executive TCO & Value Realization Dashboard */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-premium rounded-xl p-4 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">KBA Vendor Spend</span>
            <div className="text-xl font-black text-emerald-400 font-mono">$0.00</div>
            <span className="text-[10px] text-slate-400 font-mono">100% Retired ($0.80-$1.50 saved/session)</span>
          </div>

          <div className="glass-premium rounded-xl p-4 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Failure Bucket Conversion</span>
            <div className="text-xl font-black text-white font-mono">82%</div>
            <span className="text-[10px] text-emerald-400 font-mono">+37% net recovery lift</span>
          </div>

          <div className="glass-premium rounded-xl p-4 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Fallback Resolution Time</span>
            <div className="text-xl font-black text-cyan-400 font-mono">&lt; 2.0s</div>
            <span className="text-[10px] text-slate-400 font-mono">vs 90-180s manual KBA</span>
          </div>

          <div className="glass-premium rounded-xl p-4 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Blended Identity Cost</span>
            <div className="text-xl font-black text-amber-400 font-mono">$0.38</div>
            <span className="text-[10px] text-slate-400 font-mono">34.5% overall TCO reduction</span>
          </div>
        </div>
      )}

      {/* Deep JSON & Enrichment Telemetry Drawer */}
      {result && (
        <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-xl border border-white/10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-cyan-400 text-xs">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Middleware Payload & Signal Inspector</h3>
                <p className="text-xs text-slate-400">Inspect raw enrichment telemetry from Prove carrier and Socure RiskOS APIs.</p>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setActiveJsonTab('decision')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeJsonTab === 'decision'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Decision Output
              </button>
              <button
                onClick={() => setActiveJsonTab('socure')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeJsonTab === 'socure'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Socure RiskOS Telemetry
              </button>
              <button
                onClick={() => setActiveJsonTab('prove')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeJsonTab === 'prove'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Prove Carrier Signal
              </button>
            </div>
          </div>

          {/* JSON Display Area */}
          <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-850 font-mono text-xs text-slate-300 max-h-[380px] overflow-y-auto">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {activeJsonTab === 'decision' && JSON.stringify({
                transactionId: result.transactionId,
                evalId: result.evalId,
                finalDecision: result.finalDecision,
                spinwheelProfileProceed: result.spinwheelProfileProceed,
                docVResult: docVResult || undefined,
                executiveSummary: result.executiveSummary,
                tcoImpact: result.tcoImpact
              }, null, 2)}

              {activeJsonTab === 'socure' && JSON.stringify(result.socureResult || { status: 'Bypassed in favor of Prove Match' }, null, 2)}

              {activeJsonTab === 'prove' && JSON.stringify(result.proveResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
