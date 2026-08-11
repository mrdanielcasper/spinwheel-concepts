import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
interface DebugPanelProps {
  rawResponse: any;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ rawResponse }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [revealSensitive, setRevealSensitive] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!rawResponse) return null;

  // Sanitize sensitive values helper
  const sanitizeJson = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(sanitizeJson);

    const sanitized: any = {};
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (['phoneNumber', 'dateOfBirth', 'code', 'ssnLastFourDigits', 'ssn'].includes(key)) {
        sanitized[key] = revealSensitive ? val : '********';
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = sanitizeJson(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  };

  const displayData = sanitizeJson(rawResponse);

  const handleCopy = () => {
    const textToCopy = JSON.stringify(displayData, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-6">
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-xl">
        {/* Panel Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 hover:bg-slate-900 transition-colors text-xs text-slate-300 font-mono"
        >
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span>Raw Response Debugger</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              JSON
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="p-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => setRevealSensitive(!revealSensitive)}
                className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {revealSensitive ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Mask Sensitive Data</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Reveal Sensitive Data</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="bg-slate-900/90 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800/60 max-h-60">
              <code>{JSON.stringify(displayData, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
