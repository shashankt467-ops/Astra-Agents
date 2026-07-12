import React from 'react';
import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';

const Timeline = ({ activeSteps = [] }) => {
  // Master steps definition for visual mapping
  const masterSteps = [
    { num: 1, label: 'Planner Started' },
    { num: 2, label: 'Loading Resources' },
    { num: 3, label: 'Loading Prompts' },
    { num: 4, label: 'Discovering Tools' },
    { num: 5, label: 'Executing Text Tool' },
    { num: 6, label: 'Executing URL Tool' },
    { num: 7, label: 'Executing PDF Tool' },
    { num: 8, label: 'Executing OCR Tool' },
    { num: 9, label: 'Generating Report' },
    { num: 10, label: 'Saving MongoDB' },
    { num: 11, label: 'Completed' }
  ];

  // Helper to determine status of a step
  const getStepStatus = (stepNum) => {
    // Check if error step occurred
    const hasError = activeSteps.some(s => s.stepNumber === 99);
    
    // Find index of this step in logged active steps
    const activeStep = activeSteps.find(s => s.stepNumber === stepNum);
    const lastActiveStep = activeSteps[activeSteps.length - 1];

    if (activeStep) {
      if (hasError && lastActiveStep?.stepNumber === 99 && activeSteps[activeSteps.length - 2]?.stepNumber === stepNum) {
        return 'failed'; // Mark previous active step failed
      }
      return 'completed';
    }

    // If it's currently running (i.e. we are past previous step, but haven't written current step yet)
    if (lastActiveStep && lastActiveStep.stepNumber === stepNum - 1) {
      if (hasError) return 'pending';
      return 'running';
    }

    // Default is pending
    return 'pending';
  };

  return (
    <div className="w-full bg-white dark:bg-obsidian-800 glass-panel border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl p-6">
      <h3 className="text-sm font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 mb-6">
        Agentic MCP Execution Log
      </h3>
      
      <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-3 space-y-6">
        {masterSteps.map((step) => {
          const status = getStepStatus(step.num);
          
          return (
            <div key={step.num} className="relative flex items-center gap-4 pl-6">
              {/* Dot Icons */}
              <div className="absolute -left-[13px] bg-white dark:bg-obsidian-800 rounded-full p-1 z-10">
                {status === 'completed' && (
                  <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-50 dark:fill-emerald-950/20" />
                )}
                {status === 'running' && (
                  <Loader2 size={18} className="text-cyber-cyan animate-spin" />
                )}
                {status === 'pending' && (
                  <Circle size={18} className="text-zinc-300 dark:text-zinc-700" />
                )}
                {status === 'failed' && (
                  <AlertCircle size={18} className="text-rose-500 fill-rose-50 dark:fill-rose-950/20" />
                )}
              </div>

              {/* Step Label */}
              <div className="flex-1">
                <p 
                  className={`text-sm font-semibold transition-all duration-300 ${
                    status === 'completed' ? 'text-zinc-800 dark:text-zinc-200 font-bold' :
                    status === 'running' ? 'text-cyber-cyan font-bold scale-105 origin-left' :
                    'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {step.label}
                </p>
                {status === 'running' && (
                  <span className="text-[10px] text-cyber-cyan animate-pulse tracking-wide font-medium">
                    Orchestrating MCP registry...
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Custom Red Error Banner if Failed */}
        {activeSteps.some(s => s.stepNumber === 99) && (
          <div className="relative flex items-start gap-4 pl-6 text-rose-500">
            <div className="absolute -left-[13px] bg-white dark:bg-obsidian-800 rounded-full p-1 z-10">
              <AlertCircle size={18} className="text-rose-500" />
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 mt-2 w-full text-xs">
              <p className="font-bold uppercase tracking-wider">Investigation Pipeline Aborted</p>
              <p className="mt-1 font-medium text-zinc-600 dark:text-rose-200">
                {activeSteps.find(s => s.stepNumber === 99)?.message || 'An error occurred during planner orchestrations.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
