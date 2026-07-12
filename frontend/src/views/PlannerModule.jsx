import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Files, 
  Compass, 
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import Dropzone from '../components/Dropzone';
import Timeline from '../components/Timeline';
import RiskGauge from '../components/RiskGauge';

const PlannerModule = () => {
  // Input fields
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // States
  const [sessionId, setSessionId] = useState('');
  const [logs, setLogs] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  // EventSource stream handler
  useEffect(() => {
    if (!sessionId || !analyzing) return;

    // Create standard SSE connection
    const eventSource = new EventSource(`/api/planner/stream?sessionId=${sessionId}`);

    eventSource.addEventListener('log', (event) => {
      try {
        const logData = JSON.parse(event.data);
        setLogs(prev => {
          // Prevent duplicates
          if (prev.some(l => l.stepNumber === logData.stepNumber)) return prev;
          return [...prev, logData];
        });
      } catch (err) {
        console.error('Failed to parse SSE step data:', err);
      }
    });

    eventSource.addEventListener('result', (event) => {
      try {
        const reportData = JSON.parse(event.data);
        setReport(reportData);
        setAnalyzing(false);
        eventSource.close();
      } catch (err) {
        console.error('Failed to parse SSE result data:', err);
        setError('Error displaying investigation report.');
        setAnalyzing(false);
        eventSource.close();
      }
    });

    eventSource.addEventListener('error', (event) => {
      console.error('SSE connection error:', event);
      setError('Log streaming interrupted. Background runner might still complete.');
      setAnalyzing(false);
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [sessionId, analyzing]);

  const handleStartAnalysis = async (e) => {
    e.preventDefault();
    
    // Validate that at least one evidence source is present
    if (!text.trim() && !url.trim() && !pdfFile && !imageFile) {
      setError('Please provide at least one source of digital evidence to run investigation.');
      return;
    }

    setAnalyzing(true);
    setError('');
    setReport(null);
    setLogs([]);

    const currentSessionId = `TS-SESSION-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSessionId(currentSessionId);

    const formData = new FormData();
    formData.append('sessionId', currentSessionId);
    if (text.trim()) formData.append('text', text);
    if (url.trim()) formData.append('url', url);
    if (pdfFile) formData.append('pdf', pdfFile);
    if (imageFile) formData.append('image', imageFile);

    try {
      await axios.post('/api/planner/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Stream logs will automatically pick up via useEffect once sessionId is set
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error?.message || 
        'Unable to initialize the Agentic Planner pipeline. Connect backend.'
      );
      setAnalyzing(false);
    }
  };

  const resetWorkspace = () => {
    setText('');
    setUrl('');
    setPdfFile(null);
    setImageFile(null);
    setReport(null);
    setLogs([]);
    setSessionId('');
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100">
          Agentic Planner Investigation Hub
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
          Consolidated multi-vector scam analysis orchestrated by the MCP Planner
        </p>
      </div>

      {/* 1. INPUT FORM & LIVE TIMELINE PORTAL */}
      {!report && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Block: Evidence Inputs Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleStartAnalysis} className="glass-card space-y-5">
              <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide border-b border-zinc-200/40 dark:border-zinc-800/30 pb-2.5">
                Staged Evidence Sources
              </h3>

              {/* Text Notice Copy */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  1. Scam Copy / Message text
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste notice body copy or suspicious texts here..."
                  rows={3}
                  className="w-full glass-input resize-none"
                  disabled={analyzing}
                />
              </div>

              {/* URL String */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  2. Suspect Website URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. claim-gift-lottery.xyz"
                  className="w-full glass-input"
                  disabled={analyzing}
                />
              </div>

              {/* Files Upload Dropzone Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                    3. Upload PDF Warning letter
                  </label>
                  <Dropzone
                    selectedFile={pdfFile}
                    setSelectedFile={setPdfFile}
                    accept="application/pdf"
                    label="Drop PDF notice here"
                    disabled={analyzing}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                    4. Upload Screenshot notice
                  </label>
                  <Dropzone
                    selectedFile={imageFile}
                    setSelectedFile={setImageFile}
                    accept="image/*"
                    label="Drop warning image here"
                    disabled={analyzing}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={analyzing || (!text.trim() && !url.trim() && !pdfFile && !imageFile)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyber-cyan to-cyber-teal hover:from-cyber-cyan hover:to-cyber-cyan text-zinc-900 hover:text-white font-extrabold text-xs shadow-lg shadow-cyber-cyan/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Cpu size={16} />
                  Run Agentic MCP Planner
                </button>
              </div>
            </form>
          </div>

          {/* Right Block: Live Log stream */}
          <div className="lg:col-span-2">
            {analyzing || logs.length > 0 ? (
              <Timeline activeSteps={logs} />
            ) : (
              <div className="glass-card flex flex-col items-center justify-center text-center py-24 text-zinc-400 dark:text-zinc-600 h-full min-h-[300px]">
                <Compass size={40} className="stroke-zinc-300 dark:stroke-zinc-800 animate-spin mb-3.5" style={{ animationDuration: '4s' }} />
                <p className="text-sm font-bold">Investigation Loop Idle</p>
                <p className="text-xs max-w-[200px] mt-1 font-medium leading-relaxed">
                  Stage evidence vectors on the left and trigger the MCP Agentic Planner to orchestrate live.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. REPORT VIEW PORTAL */}
      {report && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Action bar */}
          <div className="flex items-center justify-between bg-zinc-150/40 dark:bg-obsidian-800/40 border border-zinc-200/50 dark:border-zinc-800/30 rounded-2xl p-4">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="text-cyber-cyan" />
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Active Dossier</p>
                <p className="text-sm font-extrabold text-zinc-850 dark:text-zinc-100">{report.reportId}</p>
              </div>
            </div>
            <button
              onClick={resetWorkspace}
              className="px-5 py-2.5 rounded-xl bg-cyber-cyan hover:bg-cyber-cyan/90 text-zinc-900 font-extrabold text-xs transition-all shadow-md shadow-cyber-cyan/15"
            >
              Start New Investigation
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Block: Threat Rating and Summary */}
            <div className="space-y-6">
              {/* Risk Gauge */}
              <div className="glass-card flex flex-col items-center justify-center text-center py-8">
                <RiskGauge 
                  score={report.overallRisk} 
                  classification={report.classification} 
                  confidence={report.confidence} 
                />
              </div>

              {/* Case Summary */}
              <div className="glass-card space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-200/40 dark:border-zinc-800/30 pb-2">
                  Executive Threat Summary
                </h3>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {report.summary}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase mt-3">
                  <Clock size={12} />
                  Analyzed at: {new Date(report.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Right Block: Threat Evidence Dossier details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card space-y-5">
                <h3 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-100 uppercase tracking-wide border-b border-zinc-200/40 dark:border-zinc-800/30 pb-2.5 flex items-center gap-2">
                  <Files size={16} className="text-cyber-cyan" />
                  Investigation Evidence Log
                </h3>

                {/* scam keywords */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                    Scam Keywords Flagged
                  </h4>
                  {report.evidence.matchedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {report.evidence.matchedKeywords.map((kw, i) => (
                        <span key={i} className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/10">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-500">No scam signature keywords matched in the analysis.</p>
                  )}
                </div>

                {/* detected URL structures */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                    URL Reputation Map
                  </h4>
                  {report.evidence.detectedUrls.length > 0 ? (
                    <div className="space-y-3">
                      {report.evidence.detectedUrls.map((u, i) => (
                        <div key={i} className="p-3 border border-zinc-200/50 dark:border-zinc-800/30 rounded-xl bg-zinc-55/40 dark:bg-obsidian-750/30">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/40 dark:border-zinc-800/20 pb-2">
                            <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 break-all flex items-center gap-1">
                              <Globe size={12} className="text-cyber-cyan shrink-0" />
                              {u.url}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              u.classification === 'Critical' || u.classification === 'High' ? 'bg-rose-500/10 text-rose-500' :
                              u.classification === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {u.riskScore}% ({u.classification})
                            </span>
                          </div>
                          {u.reasons.length > 0 && (
                            <ul className="space-y-1 mt-2 pl-2">
                              {u.reasons.map((r, ri) => (
                                <li key={ri} className="text-[10px] text-zinc-400 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                                  <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full shrink-0" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-500">No malicious URL redirects mapped in the sources.</p>
                  )}
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                    Action Guidelines
                  </h4>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="p-3 border border-emerald-500/10 rounded-xl bg-emerald-500/5 text-xs text-zinc-700 dark:text-emerald-300/80 font-bold flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerModule;
