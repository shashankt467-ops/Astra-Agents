import React, { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, ShieldCheck, RefreshCw, Link } from 'lucide-react';
import RiskGauge from '../components/RiskGauge';

const UrlModule = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await axios.post('/api/url/analyze', { url });
      if (res.data && res.data.success) {
        setResult(res.data.data);
      } else {
        setError('Failed to analyze the URL. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error?.message || 
        'Unable to connect to the backend server. Verify service status.'
      );
    } finally {
      setLoading(false);
    }
  };

  const clearInput = () => {
    setUrl('');
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100">
          URL Reputation Workspace
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
          Security validation for suspicious links and redirect chains
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Input Box */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleAnalyze} className="glass-card space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                Enter Suspect URL
              </label>
              <div className="flex gap-2 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                  <Link size={18} />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. www.login-update-verify.claim-prize.xyz"
                  className="w-full glass-input pl-11"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              {url && (
                <button
                  type="button"
                  onClick={clearInput}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-obsidian-800/50 transition-all"
                >
                  Clear Link
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyber-cyan to-cyber-teal hover:from-cyber-cyan hover:to-cyber-cyan text-zinc-900 font-extrabold text-xs shadow-md shadow-cyber-cyan/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
                {loading ? 'Validating Domain...' : 'Verify URL Safety'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Quick Risk Assessment Cards */}
        <div>
          {result ? (
            <div className="glass-card flex flex-col items-center text-center space-y-6 animate-fadeIn">
              <RiskGauge 
                score={result.riskScore} 
                classification={result.classification} 
                confidence={90} 
              />
              
              <div className="w-full text-left border-t border-zinc-200/40 dark:border-zinc-800/30 pt-4 space-y-3.5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                    Security Findings
                  </h4>
                  {result.reasons.length > 0 ? (
                    <ul className="space-y-1.5">
                      {result.reasons.map((reason, i) => (
                        <li key={i} className="text-xs text-zinc-600 dark:text-zinc-300 font-medium flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      No threat markers or suspicious properties found.
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                    Defensive Recommendations
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed mt-1">
                    {result.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card flex flex-col items-center justify-center text-center py-16 text-zinc-400 dark:text-zinc-600">
              <ShieldCheck size={40} className="stroke-zinc-300 dark:stroke-zinc-800 animate-pulse mb-3" />
              <p className="text-sm font-bold">Workspace Ready</p>
              <p className="text-xs max-w-[200px] mt-1 font-medium leading-relaxed">
                Provide a URL on the left to trigger the MCP URLAnalysisTool.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrlModule;
