'use client';

import type { ProgressStep } from '@/types/api';

interface LoadingStateProps {
  steps: ProgressStep[];
}

function StepIcon({ status }: { status: ProgressStep['status'] }) {
  if (status === 'done') return (
    <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
  if (status === 'active') return (
    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
      <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </span>
  );
  if (status === 'error') return (
    <span className="w-6 h-6 rounded-full bg-red-400/15 flex items-center justify-center shrink-0">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 2l6 6M8 2l-6 6" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
  return (
    <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-white/15" />
    </span>
  );
}

export function LoadingState({ steps }: LoadingStateProps) {
  return (
    <div className="w-full max-w-xs flex flex-col gap-2">
      {steps.map(step => (
        <div
          key={step.step}
          className={`
            liquid-glass rounded-2xl flex items-center gap-3 px-4 py-3.5
            transition-all duration-300
            ${step.status === 'active' ? 'bg-white/5' : ''}
          `}
        >
          <StepIcon status={step.status} />
          <span className={`text-xs transition-colors duration-200 ${
            step.status === 'active' ? 'text-white' :
            step.status === 'done'   ? 'text-white/30' : 'text-white/15'
          }`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
