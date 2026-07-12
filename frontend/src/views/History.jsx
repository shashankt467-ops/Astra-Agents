import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Search, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  Clock, 
  Globe, 
  Files, 
  X,
  FileText,
  ShieldCheck
} from 'lucide-react';
import RiskGauge from '../components/RiskGauge';

const History = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/reports?query=${search}`);
      if (res.data && res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch report history from MongoDB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input
    const delayDebounceFn = setTimeout(() => {
      fetchReports();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleDelete = async (e, id, reportId) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete report ${reportId}?`)) return;

    try {
      const res = await axios.delete(`/api/reports/${id}`);
      if (res.data && res.data.success) {
        setReports(prev => prev.filter(r => r._id !== id));
        if (selectedReport?._id === id) {
          setSelectedReport(null);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete report.');
    }
  };

  return (
    <div className="space-y-6 relative min-h-[600px]">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-extrabold text-zinc-800 dark:text-zinc-100">
          Investigation Dossier History
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
          Query, inspect, and manage reports stored in MongoDB
        </p>
      </div>

      {/* Search Header */}
      <div className="glass-card flex items-center justify-between gap-4 p-4">
        <div className="flex-1 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Report ID, keywords, or summary copy..."
            className="w-full glass-input pl-11 py-2.5"
          />
        </div>
        <button
          onClick={fetchReports}
          className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-obsidian-750 transition-all"
        >
          Refresh DB
        </button>
      </div>

      {/* Reports Table/Grid */}
      {loading ? (
        <div className="glass-card text-center py-20 text-zinc-400 dark:text-zinc-600 font-semibold">
          Accessing MongoDB clusters...
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card text-center py-20 text-zinc-400 dark:text-zinc-600">
          <AlertTriangle size={36} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm font-bold">No Records Mapped</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-medium">
            Try adjusting search keys or run an Agentic Planner investigation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div
              key={report._id}
              onClick={() => setSelectedReport(report)}
              className="glass-card hover:scale-[1.01] hover:border-cyber-cyan/35 cursor-pointer flex flex-col justify-between h-48 border border-zinc-200/50 dark:border-zinc-800/40 relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                    {report.reportId}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    report.classification === 'Critical' ? 'bg-rose-500/10 text-rose-500' :
                    report.classification === 'High' ? 'bg-orange-500/10 text-orange-500' :
                    report.classification === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {report.classification}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium line-clamp-3 leading-relaxed">
                  {report.summary}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200/30 dark:border-zinc-800/20 pt-3 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(report.timestamp).toLocaleDateString()}
                </span>
                
                <div className="flex gap-1">
                  <button
                    onClick={(e) => handleDelete(e, report._id, report.reportId)}
                    className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 rounded-lg text-zinc-400 dark:text-zinc-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="p-1.5 group-hover:text-cyber-cyan text-zinc-400 dark:text-zinc-600">
                    <Eye size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Inspection Panel */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-obsidian-850 h-full p-6 overflow-y-auto flex flex-col justify-between border-l border-zinc-200 dark:border-zinc-800 animate-slideLeft shadow-2xl">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/40 pb-4 mb-6">
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Report Details</p>
                  <h3 className="text-lg font-extrabold text-zinc-850 dark:text-zinc-100">{selectedReport.reportId}</h3>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-obsidian-700 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex justify-center md:col-span-1">
                  <RiskGauge
                    score={selectedReport.overallRisk}
                    classification={selectedReport.classification}
                    confidence={selectedReport.confidence}
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Summary</h4>
                    <p className="text-xs font-semibold text-zinc-650 dark:text-zinc-300 mt-1 leading-relaxed">
                      {selectedReport.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">
                    <Clock size={12} />
                    Logged: {new Date(selectedReport.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Evidence details */}
              <div className="space-y-6 border-t border-zinc-200/40 dark:border-zinc-800/30 pt-6">
                {/* Keywords */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                    Flagged Keywords
                  </h4>
                  {selectedReport.evidence.matchedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReport.evidence.matchedKeywords.map((kw, i) => (
                        <span key={i} className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/10">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-500">No scam signature keywords matched in the analysis.</p>
                  )}
                </div>

                {/* URLs Map */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                    URL Reputation Map
                  </h4>
                  {selectedReport.evidence.detectedUrls.length > 0 ? (
                    <div className="space-y-3">
                      {selectedReport.evidence.detectedUrls.map((u, i) => (
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
                    {selectedReport.recommendations.map((rec, i) => (
                      <li key={i} className="p-3 border border-emerald-500/15 rounded-xl bg-emerald-500/5 text-xs text-zinc-700 dark:text-emerald-300/80 font-bold flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200/50 dark:border-zinc-800/40 pt-4 mt-6 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white font-bold text-xs transition-all border border-zinc-700/50"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
