'use client';

import { clsx } from 'clsx';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantStyles = {
  default: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-amber-500',
  error: 'bg-red-600',
};

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={clsx('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-slate-600">{label}</span>}
          {showLabel && (
            <span className="text-sm text-slate-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={clsx(
          'w-full bg-slate-200 rounded-full overflow-hidden',
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantStyles[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Calm progress indicator with subtle animation (per cognitive design doc)
export function CalmProgress({
  progress,
  stage,
  estimatedTimeRemaining,
}: {
  progress: number;
  stage: string;
  estimatedTimeRemaining?: number;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            boxShadow: '0 0 8px 2px rgba(37, 99, 235, 0.3)',
          }}
        />
      </div>
      <div className="flex justify-between mt-2 text-sm text-slate-500">
        <span className="text-slate-700">{stage}</span>
        {estimatedTimeRemaining !== undefined && (
          <span>~{Math.ceil(estimatedTimeRemaining / 1000)}s remaining</span>
        )}
      </div>
    </div>
  );
}
