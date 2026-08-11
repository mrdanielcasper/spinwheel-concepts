import { useState } from 'react';
import { ConnectForm } from './components/ConnectForm';
import { VerifyForm } from './components/VerifyForm';
import { DebugPanel } from './components/DebugPanel';
import { ShieldCheck, RefreshCw, Zap } from 'lucide-react';

export function App() {
  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectData, setConnectData] = useState<any | null>(null);
  const [rawResponse, setRawResponse] = useState<any | null>(null);

  const handleConnectSuccess = (data: { userId: string; connectResponse: any }) => {
    setUserId(data.userId);
    setConnectData(data.connectResponse);
    setStep(2);
  };

  const handleVerifySuccess = (data: any) => {
    console.log('User verified successfully:', data);
  };

  const handleReset = () => {
    setStep(1);
    setUserId(null);
    setConnectData(null);
    setRawResponse(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-primary selection:text-white">
      {/* Background radial gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-900/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation / Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 p-0.5 shadow-md flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-base">Spinwheel</span>
              <span className="ml-2 text-xs text-slate-400 font-normal">Connect Sandbox</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-[11px] font-mono text-slate-300 border border-slate-700">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>v1.0 API</span>
            </span>

            {(userId || step === 2) && (
              <button
                onClick={handleReset}
                className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
                title="Reset session"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center z-10">
        {/* Step Indicator */}
        <div className="w-full max-w-xs mb-8">
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-primary transition-all duration-300 -translate-y-1/2 z-0"
              style={{ width: step === 1 ? '0%' : '100%' }}
            />

            {/* Step 1 Circle */}
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= 1 ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-slate-800 text-slate-400'
            }`}>
              1
            </div>

            {/* Step 2 Circle */}
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === 2 ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-slate-800 text-slate-400'
            }`}>
              2
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
            <span>Connect User</span>
            <span>Verify OTP</span>
          </div>
        </div>

        {/* Form View */}
        {step === 1 ? (
          <ConnectForm
            onSuccess={handleConnectSuccess}
            onRawResponse={(res) => setRawResponse(res)}
          />
        ) : (
          <VerifyForm
            userId={userId!}
            connectData={connectData}
            onSuccess={handleVerifySuccess}
            onReset={handleReset}
            onRawResponse={(res) => setRawResponse(res)}
          />
        )}

        {/* Collapsible Debug Panel */}
        <DebugPanel rawResponse={rawResponse} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/40 py-6 text-center text-xs text-slate-500 z-10">
        <p>Spinwheel Developer Platform Sandbox Demonstration App</p>
      </footer>
    </div>
  );
}
