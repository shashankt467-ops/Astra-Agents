import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Files, 
  ChevronRight,
  Info
} from 'lucide-react';
import axios from 'axios';

const Dashboard = ({ setActiveTab }) => {
  const [stats, setStats] = useState({
    totalScans: 0,
    criticalThreats: 0,
    mediumThreats: 0,
    recentInvestigations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/reports');
        if (res.data && res.data.success) {
          const reports = res.data.data;
          const critical = reports.filter(r => r.classification === 'Critical' || r.classification === 'High').length;
          const medium = reports.filter(r => r.classification === 'Medium').length;
          setStats({
            totalScans: reports.length,
            criticalThreats: critical,
            mediumThreats: medium,
            recentInvestigations: reports.slice(0, 5)
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Scans', value: stats.totalScans, icon: Files, color: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10' },
    { label: 'Critical / High Risk', value: stats.criticalThreats, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Medium Suspects', value: stats.mediumThreats, icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Active MCP Tools', value: 6, icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8 bg-cyber-radial">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 dark:from-obsidian-800 dark:to-obsidian-900 text-white p-8 sm:p-10 border border-zinc-800 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-black uppercase tracking-widest text-cyber-cyan px-2.5 py-1 bg-cyber-cyan/15 rounded-full">
            Amrita MCP Hackathon 2026
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4 leading-tight">
            Agentic AI Cyber Investigation Platform
          </h2>
          <p className="text-zinc-400 text-sm mt-3.5 leading-relaxed font-semibold">
            Investigate suspicious text, URLs, official PDF notices, and screenshot evidence automatically using an Agentic Planner orchestrated entirely through Model Context Protocol (MCP) primitives.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={() => setActiveTab('planner')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyber-cyan to-cyber-teal hover:from-cyber-cyan hover:to-cyber-cyan text-zinc-900 hover:text-white font-extrabold text-sm shadow-lg shadow-cyber-cyan/15 transition-all"
            >
              Start Agentic Investigation
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/60 font-bold text-sm transition-all"
            >
              View Case Records
            </button>
          </div>
        </div>
        {/* Abstract cyber grid lines */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 hidden md:block bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card flex items-center justify-between hover:scale-[1.02] cursor-default">
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  {card.label}
                </p>
                <h4 className="text-3xl font-black tracking-tight text-zinc-800 dark:text-zinc-100 mt-2">
                  {loading ? '...' : card.value}
                </h4>
              </div>
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Modules & Recent Case Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Modular Investigative Workspaces */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card">
            <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <Cpu size={18} className="text-cyber-cyan" />
              Isolated Investigation Modules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'text', title: 'Text Scanner', desc: 'Scan message drafts and clipboard contents for fraudulent pressure keywords.' },
                { id: 'url', title: 'URL Validator', desc: 'Analyze domain protocols, shorten links, and check URL redirections.' },
                { id: 'pdf', title: 'PDF Inspector', desc: 'Parse official warning notices, legal pdfs, and check deep links.' },
                { id: 'ocr', title: 'OCR Image Scanner', desc: 'OCR screenshot notices, bank alerts, and extract embedded links.' }
              ].map(mod => (
                <div 
                  key={mod.id}
                  onClick={() => setActiveTab(mod.id)}
                  className="p-4 border border-zinc-200/50 dark:border-zinc-800/40 rounded-xl hover:border-cyber-cyan/50 dark:hover:border-cyber-cyan/50 bg-zinc-50/50 dark:bg-obsidian-800/20 hover:bg-zinc-100/50 dark:hover:bg-obsidian-750/30 cursor-pointer group transition-all"
                >
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                    {mod.title}
                    <ChevronRight size={14} className="text-zinc-400 group-hover:text-cyber-cyan group-hover:translate-x-0.5 transition-all" />
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 font-medium leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Recent Case Reports */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-cyber-cyan" />
              Recent Reports
            </h3>
            
            {loading ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold p-4 text-center">Loading cases...</p>
            ) : stats.recentInvestigations.length === 0 ? (
              <div className="text-center py-8">
                <Info size={28} className="text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold">No recent investigations logged.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {stats.recentInvestigations.map((caseItem) => (
                  <div 
                    key={caseItem._id}
                    onClick={() => setActiveTab('history')}
                    className="flex items-center justify-between p-2.5 border border-zinc-200/40 dark:border-zinc-800/30 rounded-xl hover:bg-zinc-100/50 dark:hover:bg-obsidian-800/40 cursor-pointer transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {caseItem.reportId}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
                        {new Date(caseItem.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      caseItem.classification === 'Critical' ? 'bg-rose-500/10 text-rose-500' :
                      caseItem.classification === 'High' ? 'bg-orange-500/10 text-orange-500' :
                      caseItem.classification === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {caseItem.classification}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setActiveTab('history')}
            className="w-full mt-4 text-xs font-bold text-cyber-cyan hover:underline text-center border-t border-zinc-200/40 dark:border-zinc-800/30 pt-3"
          >
            Manage Case History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
