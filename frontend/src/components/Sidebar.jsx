import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Link2, 
  FileSearch, 
  ScanEye, 
  Cpu, 
  History, 
  Settings, 
  Sun, 
  Moon,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'text', label: 'Text Scan', icon: FileText },
    { id: 'url', label: 'URL reputation', icon: Link2 },
    { id: 'pdf', label: 'PDF Inspector', icon: FileSearch },
    { id: 'ocr', label: 'OCR Scanner', icon: ScanEye },
    { id: 'planner', label: 'Agentic Planner', icon: Cpu },
    { id: 'history', label: 'Case History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-4 top-4 bottom-4 w-64 glass-panel rounded-2xl flex flex-col justify-between py-6 px-4 z-40">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="p-2 bg-gradient-to-tr from-cyber-cyan to-cyber-teal rounded-xl text-white shadow-lg shadow-cyber-cyan/20">
            <ShieldCheck size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-tight bg-gradient-to-r from-cyber-cyan to-cyber-neon bg-clip-text text-transparent">
              TRUTHSHIELD AI
            </h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-widest uppercase">
              MCP INVESTIGATOR
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyber-cyan/15 to-cyber-teal/5 text-cyber-cyan border-l-4 border-cyber-cyan shadow-sm dark:bg-cyber-cyan/10'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-obsidian-700/30'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-cyber-cyan' : 'text-zinc-400 dark:text-zinc-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Theme Toggler & Footer */}
      <div className="space-y-4">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 hover:bg-zinc-100/60 dark:hover:bg-obsidian-700/30 text-zinc-600 dark:text-zinc-300 font-semibold text-sm transition-all"
        >
          <span className="flex items-center gap-2">
            {isDarkMode ? <Moon size={16} className="text-purple-400" /> : <Sun size={16} className="text-amber-500" />}
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </span>
          <div className="w-8 h-4 bg-zinc-200 dark:bg-zinc-700 rounded-full p-0.5 flex justify-start dark:justify-end transition-all">
            <div className="w-3 h-3 bg-zinc-600 dark:bg-cyber-cyan rounded-full shadow-md" />
          </div>
        </button>

        <div className="px-3 text-center">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
            Version 1.0.0 (Hackathon Edition)
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
