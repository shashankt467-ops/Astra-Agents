import React, { useEffect, useState } from 'react';

const RiskGauge = ({ score = 0, classification = 'Low', confidence = 0 }) => {
  const [currentOffset, setCurrentOffset] = useState(251.2); // Start empty (fully offset)

  const radius = 40;
  const circumference = 2 * Math.PI * radius; // Approx 251.2

  useEffect(() => {
    // Animate stroke dashoffset after mounting
    const calculatedOffset = circumference - (score / 100) * circumference;
    const timer = setTimeout(() => {
      setCurrentOffset(calculatedOffset);
    }, 150);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  // Color mappings
  const getColor = (riskClass) => {
    switch (riskClass) {
      case 'Critical':
        return { text: 'text-rose-500', stroke: '#f43f5e', bg: 'bg-rose-500/10' };
      case 'High':
        return { text: 'text-orange-500', stroke: '#f97316', bg: 'bg-orange-500/10' };
      case 'Medium':
        return { text: 'text-amber-500', stroke: '#eab308', bg: 'bg-amber-500/10' };
      default:
        return { text: 'text-emerald-500', stroke: '#10b981', bg: 'bg-emerald-500/10' };
    }
  };

  const themeColors = getColor(classification);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-zinc-100/40 dark:bg-obsidian-750/30 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/30 w-full max-w-[240px]">
      <div className="relative w-40 h-40">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-zinc-200 dark:stroke-zinc-800"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Animated Foreground Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={themeColors.stroke}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={currentOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        {/* Central Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tighter text-zinc-800 dark:text-zinc-100">
            {score}%
          </span>
          <span className={`text-[10px] font-black uppercase tracking-wider ${themeColors.text} ${themeColors.bg} px-2.5 py-0.5 rounded-full mt-1`}>
            {classification}
          </span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
          Assessment Confidence
        </p>
        <div className="flex items-center gap-1.5 justify-center mt-1.5">
          <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyber-cyan transition-all duration-1000" 
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
            {confidence}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;
