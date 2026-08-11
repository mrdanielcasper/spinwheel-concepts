import React, { useState } from 'react';
import { Phone, Calendar, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { connectUser } from '../utils/api';

interface ConnectFormProps {
  onSuccess: (data: {
    userId: string;
    connectResponse: any;
  }) => void;
  onRawResponse: (res: any) => void;
}

export const ConnectForm: React.FC<ConnectFormProps> = ({ onSuccess, onRawResponse }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1987-06-08');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; dob?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);
    setFieldErrors({});

    // Client side basic checks
    let errors: { phone?: string; dob?: string } = {};
    if (!phoneNumber.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+1[2-9]\d{9}$/.test(phoneNumber.trim())) {
      errors.phone = 'Please enter a valid US mobile number starting with +1 (e.g. +14155552671)';
    }

    if (!dateOfBirth.trim()) {
      errors.dob = 'Date of birth is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) {
      errors.dob = 'Date of birth must be in YYYY-MM-DD format';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    const response = await connectUser(phoneNumber.trim(), dateOfBirth.trim());
    onRawResponse(response);
    setLoading(false);

    if (response.success) {
      onSuccess({
        userId: response.data.userId,
        connectResponse: response.data
      });
    } else {
      const err = response.error;
      setErrorMessage(err.message || 'Unable to connect user.');
      setErrorCode(err.code || 'UNKNOWN_ERROR');

      if (err.code === 'INVALID_NUMBER' || err.code === 'UNSUPPORTED_COUNTRY_CODE') {
        setFieldErrors({ phone: err.message });
      }
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Step Badge Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary border border-primary/30">
              1
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Step 1 of 2
            </span>
          </div>
          <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3 h-3 mr-1" /> Sandbox Mode
          </span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
          Connect User via SMS
        </h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Enter a valid US test mobile number and date of birth to initiate phone verification with Spinwheel.
        </p>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-destructive flex items-start space-x-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold block mb-0.5 text-red-300">
                {errorCode ? `Error (${errorCode})` : 'Connection Error'}
              </span>
              <p className="text-red-200/90">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Phone Number Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              US Mobile Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+14155552671"
                className={`w-full rounded-xl bg-slate-900/80 border ${
                  fieldErrors.phone ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-800 focus:border-primary/80 focus:ring-primary/40'
                } pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all`}
                disabled={loading}
              />
            </div>
            {fieldErrors.phone ? (
              <p className="mt-1.5 text-xs text-red-400">{fieldErrors.phone}</p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">Must be E.164 formatted US number (+1XXXXXXXXXX)</p>
            )}
          </div>

          {/* Date of Birth Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Date of Birth (YYYY-MM-DD)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="1987-06-08"
                className={`w-full rounded-xl bg-slate-900/80 border ${
                  fieldErrors.dob ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-800 focus:border-primary/80 focus:ring-primary/40'
                } pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all`}
                disabled={loading}
              />
            </div>
            {fieldErrors.dob && (
              <p className="mt-1.5 text-xs text-red-400">{fieldErrors.dob}</p>
            )}
          </div>

          {/* Legal Agreement Text */}
          <div className="pt-2">
            <p className="text-[11px] text-slate-400 leading-normal border-t border-slate-800/80 pt-4">
              By clicking “Continue” you agree to the{' '}
              <a
                href="https://spinwheel.io/legal/end-user-agreement"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80 font-medium"
              >
                Spinwheel End User Agreement
              </a>
              . Further, you are providing “written instructions” to Spinwheel Solutions, Inc. authorizing it to obtain your credit profile from any consumer reporting agency.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-0.5 font-semibold text-sm text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
          >
            <div className="flex items-center justify-center space-x-2 rounded-[10px] bg-slate-950/40 px-6 py-3 transition-colors group-hover:bg-transparent">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Initiating Connect...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};
