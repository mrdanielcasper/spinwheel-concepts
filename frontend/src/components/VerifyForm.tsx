import React, { useState } from 'react';
import { KeyRound, ArrowRight, Loader2, AlertCircle, CheckCircle2, RotateCcw, UserCheck, MapPin } from 'lucide-react';
import { verifyUser } from '../utils/api';

interface VerifyFormProps {
  userId: string;
  connectData: any;
  onSuccess: (verifyResponse: any) => void;
  onReset: () => void;
  onRawResponse: (res: any) => void;
  onViewDebtProfile?: () => void;
}

export const VerifyForm: React.FC<VerifyFormProps> = ({
  userId,
  connectData,
  onSuccess,
  onReset,
  onRawResponse,
  onViewDebtProfile
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);

    if (!code.trim() || !/^\d{6}$/.test(code.trim())) {
      setErrorMessage('Please enter a 6-digit numeric verification code.');
      return;
    }

    setLoading(true);

    const response = await verifyUser(userId, code.trim());
    onRawResponse(response);
    setLoading(false);

    if (response.success) {
      setVerifyResult(response.data);
      onSuccess(response.data);
    } else {
      const err = response.error;
      setErrorMessage(err.message || 'Verification failed.');
      setErrorCode(err.code || 'UNKNOWN_ERROR');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Step Badge Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary border border-primary/30">
              2
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Step 2 of 2
            </span>
          </div>
          <button
            onClick={onReset}
            className="inline-flex items-center space-x-1 rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Start Over
          </button>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
          Verify Security Code
        </h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Enter the 6-digit OTP security code sent via SMS to verify the connection.
        </p>

        {/* Connection Metadata Summary Box */}
        <div className="mb-6 rounded-xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">User ID:</span>
            <span className="font-mono text-slate-200 bg-slate-800 px-2 py-0.5 rounded text-[11px] truncate max-w-[200px]">
              {userId}
            </span>
          </div>
          {connectData?.extUserId && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Ext User ID:</span>
              <span className="font-mono text-slate-300 text-[11px]">
                {connectData.extUserId}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {connectData?.connectionStatus || 'pending'}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-destructive flex items-start space-x-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold block mb-0.5 text-red-300">
                {errorCode ? `Verification Error (${errorCode})` : 'Error'}
              </span>
              <p className="text-red-200/90">{errorMessage}</p>

              {errorCode === 'EXPIRED' && (
                <button
                  onClick={onReset}
                  className="mt-3 inline-flex items-center text-xs font-semibold text-red-300 underline hover:text-white"
                >
                  Create new connection
                </button>
              )}
            </div>
          </div>
        )}

        {/* Success View */}
        {verifyResult ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-emerald-300">
                  Verification Successful!
                </h3>
                <p className="text-xs text-emerald-200/80">
                  User is now securely connected to Spinwheel APIs.
                </p>
              </div>
            </div>

            {/* Returned Profile Details */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <UserCheck className="w-4 h-4 mr-1.5 text-primary" /> Verified Profile
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">First Name</span>
                  <span className="text-white font-medium">
                    {verifyResult.profile?.firstName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Last Name</span>
                  <span className="text-white font-medium">
                    {verifyResult.profile?.lastName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">SSN (Last 4)</span>
                  <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded">
                    ***-**-{verifyResult.profile?.ssnLastFourDigits || '****'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                  <span className="text-white font-medium">
                    {verifyResult.profile?.dateOfBirth || 'N/A'}
                  </span>
                </div>
              </div>

              {verifyResult.profile?.addresses && verifyResult.profile.addresses.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block mb-1 text-xs flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> Address
                  </span>
                  {verifyResult.profile.addresses.map((addr: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      {addr.addressLine1}, {addr.city}, {addr.state} {addr.zip}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {onViewDebtProfile && (
              <button
                onClick={onViewDebtProfile}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 shadow-lg mb-3"
              >
                <UserCheck className="w-4 h-4" />
                <span>View Debt Profile</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="w-full rounded-xl bg-slate-800 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Connect Another User</span>
            </button>
          </div>
        ) : (
          /* Code Input Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                6-Digit SMS Security Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-xl bg-slate-900/80 border border-slate-800 focus:border-primary/80 focus:ring-primary/40 pl-10 pr-4 py-3 text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-0.5 font-semibold text-sm text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="flex items-center justify-center space-x-2 rounded-[10px] bg-slate-950/40 px-6 py-3 transition-colors group-hover:bg-transparent">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Link Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </div>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
