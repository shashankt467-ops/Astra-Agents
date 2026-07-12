import React, { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, ShieldCheck, RefreshCw, FileText, Globe } from 'lucide-react';
import Dropzone from '../components/Dropzone';
import RiskGauge from '../components/RiskGauge';

const PdfModule = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/pdf/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.success) {
        setResult(res.data.data);
      } else {
        setError('Failed to analyze the PDF notice. Try again.');
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
    setFile(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100">
          PDF Notice Inspector
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
          Verify digital notice documents, fake court orders, and banking alerts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Upload Dropzone & Details */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleAnalyze} className="glass-card space-y-4">
            <Dropzone
              selectedFile={file}
              setSelectedFile={setFile}
              accept="application/pdf"
              label="Upload suspect PDF notice"
            />

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              {file && (
                <button
                  type="button"
                  onClick={clearInput}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-obsidian-800/50 transition-all"
                >
                  Discard File
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !file}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyber-cyan to-cyber-teal hover:from-cyber-cyan hover:to-cyber-cyan text-zinc-900 font-extrabold text-xs shadow-md shadow-cyber-cyan/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
                {loading ? 'Extracting PDF Data...' : 'Inspect PDF File'}
              </button>
            </div>
          </form>

          {/* Extracted Text Drawer once loaded */}
          {result && result.extractedText && (
            <div className="glass-card space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Document Text Excerpt
              </h4>
              <div className="p-4 bg-zinc-100/50 dark:bg-obsidian-900/40 border border-zinc-200/50 dark:border-zinc-800/40 rounded-xl max-h-60 overflow-y-auto font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                {result.extractedText}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Quick Risk Assessment Cards */}
        <div>
          {result ? (
            <div className="glass-card flex flex-col items-center text-center space-y-6 animate-fadeIn">
              <RiskGauge 
                score={result.riskScore} 
                classification={result.classification} 
                confidence={88} 
              />
              
              <div className="w-full text-left border-t border-zinc-200/40 dark:border-zinc-800/30 pt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                    <Globe size={14} className="text-cyber-cyan" />
                    Embedded Links Found
                  </h4>
                  {result.extractedUrls.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {result.urlRisks.map((ur, i) => (
                        <div key={i} className="p-2 border border-zinc-200/50 dark:border-zinc-800/30 rounded-lg bg-zinc-50/50 dark:bg-obsidian-750/30 text-xs">
                          <p className="font-bold text-zinc-850 dark:text-zinc-200 truncate">{ur.url}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Risk Rating</span>
                            <span className={`text-[10px] font-black uppercase ${
                              ur.classification === 'Critical' || ur.classification === 'High' ? 'text-rose-500' :
                              ur.classification === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                            }`}>{ur.riskScore}% ({ur.classification})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5 mt-1">
                      <ShieldCheck size={14} />
                      No embedded website hyperlinks detected.
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
              <FileText size={40} className="stroke-zinc-300 dark:stroke-zinc-800 animate-pulse mb-3" />
              <p className="text-sm font-bold">Workspace Ready</p>
              <p className="text-xs max-w-[200px] mt-1 font-medium leading-relaxed">
                Provide a PDF document on the left to trigger the MCP PDFAnalysisTool.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfModule;
